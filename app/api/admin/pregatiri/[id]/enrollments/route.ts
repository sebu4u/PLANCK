import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const workshopIdSchema = z.string().uuid()

async function verifyAdmin(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(token)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const client = createServerClientWithToken(token)
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(client, data.user))) {
    return {
      error: NextResponse.json(
        { error: "Acces interzis. Doar adminii pot vedea înscrierile." },
        { status: 403 },
      ),
    }
  }
  return { user: data.user }
}

async function emailsByUserId(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  userIds: string[],
) {
  const emails = new Map<string, string | null>()
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId)
        emails.set(userId, data.user?.email ?? null)
      } catch {
        emails.set(userId, null)
      }
    }),
  )
  return emails
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await context.params
    const parsedId = workshopIdSchema.safeParse(id)
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID-ul pregătirii este invalid." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const { data: workshop, error: workshopError } = await supabase
      .from("workshops")
      .select("id, title")
      .eq("id", parsedId.data)
      .maybeSingle()

    if (workshopError) {
      logger.error("[admin/pregatiri/enrollments] workshop lookup failed:", workshopError)
      return NextResponse.json({ error: "Nu am putut încărca înscrierile." }, { status: 500 })
    }
    if (!workshop) {
      return NextResponse.json({ error: "Pregătirea nu a fost găsită." }, { status: 404 })
    }

    const { data: unlocks, error: unlocksError } = await supabase
      .from("workshop_unlocks")
      .select("user_id, unlocked_at")
      .eq("workshop_id", parsedId.data)
      .order("unlocked_at", { ascending: false })

    if (unlocksError) {
      logger.error("[admin/pregatiri/enrollments] unlocks failed:", unlocksError)
      return NextResponse.json({ error: "Nu am putut încărca înscrierile." }, { status: 500 })
    }

    const rows = unlocks ?? []
    const userIds = [...new Set(rows.map((row) => row.user_id as string).filter(Boolean))]
    const nameById = new Map<string, string | null>()

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, nickname")
        .in("user_id", userIds)

      if (profilesError) {
        logger.error("[admin/pregatiri/enrollments] profiles failed:", profilesError)
        return NextResponse.json({ error: "Nu am putut încărca înscrierile." }, { status: 500 })
      }

      for (const profile of profiles ?? []) {
        const name =
          (typeof profile.name === "string" && profile.name.trim()) ||
          (typeof profile.nickname === "string" && profile.nickname.trim()) ||
          null
        nameById.set(profile.user_id as string, name)
      }
    }

    const emails = await emailsByUserId(supabase, userIds)
    const enrollments = rows.map((row) => {
      const userId = row.user_id as string
      return {
        user_id: userId,
        name: nameById.get(userId) ?? "Fără nume",
        email: emails.get(userId) ?? null,
        enrolled_at: row.unlocked_at as string,
      }
    })

    return NextResponse.json({
      workshop: { id: workshop.id, title: workshop.title },
      enrollments,
    })
  } catch (err) {
    logger.error("[admin/pregatiri/enrollments] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

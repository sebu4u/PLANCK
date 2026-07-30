import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { fetchTeachersByIds, fetchUserUnlockIds, mapWorkshopPublic } from "@/lib/pregatire/queries"
import { isWorkshopSubject } from "@/lib/pregatire/types"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

async function optionalUserId(req: NextRequest): Promise<string | null> {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token || isJwtExpired(token)) return null
  try {
    const client = createServerClientWithToken(token)
    const { data } = await client.auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const supabase = getServiceRoleSupabase()
    let query = supabase
      .from("workshops_public")
      .select("*")
      .order("starts_at", { ascending: true })

    if (subject && isWorkshopSubject(subject)) {
      query = query.eq("subject", subject)
    }
    if (from) query = query.gte("starts_at", from)
    if (to) query = query.lte("starts_at", to)

    const { data, error } = await query
    if (error) {
      logger.error("[pregatire] GET list failed:", error)
      return NextResponse.json({ error: "Nu am putut încărca pregătirile." }, { status: 500 })
    }

    const rows = data ?? []
    const teacherMap = await fetchTeachersByIds(
      supabase,
      rows.map((r) => r.teacher_id as string),
    )
    const userId = await optionalUserId(req)
    const unlockIds = userId
      ? await fetchUserUnlockIds(
          supabase,
          userId,
          rows.map((r) => r.id as string),
        )
      : new Set<string>()

    const workshops = rows.map((row) =>
      mapWorkshopPublic(
        row as Parameters<typeof mapWorkshopPublic>[0],
        teacherMap.get(row.teacher_id as string) ?? null,
        unlockIds.has(row.id as string),
      ),
    )

    return NextResponse.json({ workshops })
  } catch (err) {
    logger.error("[pregatire] GET list error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

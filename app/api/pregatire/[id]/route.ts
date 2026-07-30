import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { fetchTeachersByIds, mapWorkshopPublic } from "@/lib/pregatire/queries"
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: "ID invalid." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const { data: row, error } = await supabase
      .from("workshops_public")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      logger.error("[pregatire/[id]] GET failed:", error)
      return NextResponse.json({ error: "Nu am putut încărca pregătirea." }, { status: 500 })
    }
    if (!row) {
      return NextResponse.json({ error: "Pregătirea nu a fost găsită." }, { status: 404 })
    }

    const teacherMap = await fetchTeachersByIds(supabase, [row.teacher_id as string])
    const userId = await optionalUserId(req)

    let unlocked = false
    let meetUrl: string | null = null
    let recordingUrl: string | null = null

    if (userId) {
      const { data: unlock } = await supabase
        .from("workshop_unlocks")
        .select("workshop_id")
        .eq("user_id", userId)
        .eq("workshop_id", id)
        .maybeSingle()

      unlocked = Boolean(unlock)
      if (unlocked) {
        const { data: full } = await supabase
          .from("workshops")
          .select("meet_url, recording_url")
          .eq("id", id)
          .maybeSingle()
        meetUrl = full?.meet_url ?? null
        recordingUrl = full?.recording_url ?? null
      }
    }

    const workshop = {
      ...mapWorkshopPublic(
        row as Parameters<typeof mapWorkshopPublic>[0],
        teacherMap.get(row.teacher_id as string) ?? null,
        unlocked,
      ),
      meet_url: unlocked ? meetUrl : null,
      recording_url: unlocked ? recordingUrl : null,
    }

    return NextResponse.json({ workshop })
  } catch (err) {
    logger.error("[pregatire/[id]] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

import "server-only"

import { NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import type { WorkshopTeacher } from "@/lib/pregatire/types"

export type MentorSessionOk = {
  userId: string
  teacher: WorkshopTeacher & { mentor_user_id: string }
}

export async function requireMentorSession(
  headers: Headers,
): Promise<MentorSessionOk | NextResponse> {
  const accessToken = getAccessTokenFromRequest(headers.get("authorization"))
  if (!accessToken) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }
  if (isJwtExpired(accessToken)) {
    return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
  }

  const supabaseUser = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
  if (userErr || !userData?.user?.id) {
    return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
  }

  const userId = userData.user.id
  const service = getServiceRoleSupabase()
  const { data: profile } = await service
    .from("profiles")
    .select("is_mentor")
    .eq("user_id", userId)
    .maybeSingle()

  if (profile?.is_mentor !== true) {
    return NextResponse.json({ error: "Acces doar pentru conturi mentor." }, { status: 403 })
  }

  const { data: teacher } = await service
    .from("workshop_teachers")
    .select("id, name, description, icon_url, is_active, mentor_user_id, created_at, updated_at")
    .eq("mentor_user_id", userId)
    .maybeSingle()

  if (!teacher?.id || !teacher.mentor_user_id) {
    return NextResponse.json(
      { error: "Contul de mentor nu este legat de un profesor. Contactează un admin." },
      { status: 403 },
    )
  }

  return {
    userId,
    teacher: teacher as WorkshopTeacher & { mentor_user_id: string },
  }
}

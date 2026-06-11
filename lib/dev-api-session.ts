import { NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { getAccessTokenFromRequest, getDevPermissionsFromDB, type DevPermissions } from "@/lib/admin-check"

export type DevSessionOk = {
  supabaseUser: ReturnType<typeof createServerClientWithToken>
  userId: string
  permissions: DevPermissions
}

export async function requireDevSession(headers: Headers): Promise<DevSessionOk | NextResponse> {
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

  const permissions = await getDevPermissionsFromDB(supabaseUser, userData.user.id, userData.user)
  if (!permissions.isDev && !permissions.isAdmin) {
    return NextResponse.json({ error: "Acces doar pentru conturi dev." }, { status: 403 })
  }

  return { supabaseUser, userId: userData.user.id, permissions }
}

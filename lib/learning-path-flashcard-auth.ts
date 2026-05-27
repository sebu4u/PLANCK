import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"

export async function getAuthenticatedSupabase(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || ""
  const tokenMatch = authHeader.match(/^Bearer (.+)$/i)
  if (!tokenMatch) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const accessToken = tokenMatch[1]
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }

  const supabase = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }

  return { supabase, user: userData.user, accessToken }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim())
}

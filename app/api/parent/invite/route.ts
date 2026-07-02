import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { buildParentConnectUrl, normalizeParentInviteCode } from "@/lib/parent/invite-code"
import { ensureParentInviteCode } from "@/lib/parent/server"

export async function GET(request: NextRequest) {
  const accessToken = parseAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("user_id", userData.user.id)
    .maybeSingle()

  if (profile?.user_type !== "parinte") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const code = await ensureParentInviteCode(userData.user.id)
    const origin = new URL(request.url).origin
    return NextResponse.json({
      code: normalizeParentInviteCode(code),
      connect_url: buildParentConnectUrl(code, origin),
    })
  } catch (error) {
    console.error("[parent/invite] GET error:", error)
    return NextResponse.json({ error: "Failed to generate invite" }, { status: 500 })
  }
}

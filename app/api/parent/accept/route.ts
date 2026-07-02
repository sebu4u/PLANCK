import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { normalizeParentInviteCode } from "@/lib/parent/invite-code"
import { acceptParentInvite } from "@/lib/parent/server"

export async function POST(request: NextRequest) {
  const accessToken = parseAccessToken(request)
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const code = typeof body?.code === "string" ? normalizeParentInviteCode(body.code) : ""
    if (!code) {
      return NextResponse.json({ success: false, error: "Missing invite code" }, { status: 400 })
    }

    const result = await acceptParentInvite({
      childUserId: userData.user.id,
      inviteCode: code,
    })

    return NextResponse.json({
      success: true,
      parent_name: result.parent_name,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    const statusByError: Record<string, number> = {
      INVALID_INVITE_CODE: 404,
      SELF_LINK_NOT_ALLOWED: 400,
      ONLY_STUDENTS_CAN_LINK: 403,
      RELATIONSHIP_CREATE_FAILED: 500,
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: statusByError[message] ?? 500 }
    )
  }
}

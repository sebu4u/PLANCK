import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { getChildrenProgressForParent } from "@/lib/parent/server"

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
    const children = await getChildrenProgressForParent(userData.user.id)
    return NextResponse.json({ children })
  } catch (error) {
    console.error("[parent/children-progress] GET error:", error)
    return NextResponse.json({ error: "Failed to load children progress" }, { status: 500 })
  }
}

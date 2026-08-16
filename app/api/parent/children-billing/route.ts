import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { getChildrenBillingForParent } from "@/lib/parent/billing"
import { getParentChildren } from "@/lib/parent/server"

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
    const children = await getParentChildren(userData.user.id)
    const billingByChild = await getChildrenBillingForParent(
      userData.user.id,
      children.map((child) => child.child_id)
    )

    return NextResponse.json({
      children: children.map((child) => ({
        child_id: child.child_id,
        name: child.name,
        billing: billingByChild.get(child.child_id) ?? {
          plan: "free",
          billing_source: "none",
          current_period_end: null,
          can_manage: false,
          can_purchase: true,
        },
      })),
    })
  } catch (error) {
    console.error("[parent/children-billing] GET error:", error)
    return NextResponse.json({ error: "Failed to load children billing" }, { status: 500 })
  }
}

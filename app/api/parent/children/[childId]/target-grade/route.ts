import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { updateChildTargetGrade } from "@/lib/parent/server"

interface RouteContext {
  params: Promise<{ childId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

  const { childId } = await context.params
  if (!childId) {
    return NextResponse.json({ error: "Missing child id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const targetGrade =
    typeof body === "object" &&
    body !== null &&
    "target_grade" in body &&
    typeof (body as { target_grade: unknown }).target_grade === "number"
      ? (body as { target_grade: number }).target_grade
      : null

  if (targetGrade === null || !Number.isFinite(targetGrade)) {
    return NextResponse.json({ error: "target_grade must be a number between 4 and 10" }, { status: 400 })
  }

  try {
    const savedGrade = await updateChildTargetGrade({
      parentId: userData.user.id,
      childId,
      targetGrade,
    })
    return NextResponse.json({ target_grade: savedGrade })
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    if (message === "INVALID_TARGET_GRADE") {
      return NextResponse.json({ error: "target_grade must be between 4 and 10" }, { status: 400 })
    }
    if (message === "RELATIONSHIP_NOT_FOUND") {
      return NextResponse.json({ error: "Child not found" }, { status: 404 })
    }
    console.error("[parent/children/target-grade] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update target grade" }, { status: 500 })
  }
}

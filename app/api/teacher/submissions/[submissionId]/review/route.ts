import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { markSubmissionReviewed } from "@/lib/teacher/server"
import { normalizeUserType } from "@/lib/user-types"

interface RouteContext {
  params: Promise<{ submissionId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  if (normalizeUserType(profile?.user_type) !== "profesor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { submissionId } = await context.params
  if (!submissionId) {
    return NextResponse.json({ error: "Missing submission id" }, { status: 400 })
  }

  try {
    await markSubmissionReviewed(userData.user.id, submissionId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    if (message === "SUBMISSION_NOT_FOUND" || message === "ASSIGNMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("[teacher/submissions/review] POST error:", error)
    return NextResponse.json({ error: "Failed to mark submission as reviewed" }, { status: 500 })
  }
}

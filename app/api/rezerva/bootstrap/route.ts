import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isJwtExpired } from "@/lib/auth-validate"
import { workshopSubjectToOnboardingSubject } from "@/lib/landing-subjects"
import { logger } from "@/lib/logger"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { WORKSHOP_SUBJECTS } from "@/lib/pregatire/types"
import { normalizeUserType } from "@/lib/user-types"

export const runtime = "nodejs"

const bodySchema = z.object({
  subject: z.enum(WORKSHOP_SUBJECTS).optional(),
})

export async function POST(req: NextRequest) {
  const accessToken = parseAccessToken(req)
  if (!accessToken) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }
  if (isJwtExpired(accessToken)) {
    return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
  }

  const supabaseUser = createServerClientWithToken(accessToken)
  const { data: userData, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
  }

  let subject: z.infer<typeof bodySchema>["subject"]
  try {
    const body = bodySchema.parse(await req.json().catch(() => ({})))
    subject = body.subject
  } catch {
    return NextResponse.json({ error: "Materie invalidă." }, { status: 400 })
  }

  const userId = userData.user.id
  const preferredMaterie = subject ? workshopSubjectToOnboardingSubject(subject) : null

  try {
    const admin = getServiceRoleSupabase()
    const { data: profile } = await admin
      .from("profiles")
      .select("user_type, onboarding_completed_at, preferred_materie")
      .eq("user_id", userId)
      .maybeSingle()

    const userType = normalizeUserType(profile?.user_type)
    if (userType === "parinte" || userType === "profesor") {
      return NextResponse.json({ ok: true, blocked: userType })
    }

    const now = new Date().toISOString()
    if (!profile) {
      const { error: insertError } = await admin.from("profiles").insert({
        user_id: userId,
        user_type: "elev",
        plan: "free",
        onboarding_completed_at: now,
        ...(preferredMaterie ? { preferred_materie: preferredMaterie } : {}),
        created_at: now,
      })
      if (insertError?.code === "23505") {
        const { error: raceUpdateError } = await admin
          .from("profiles")
          .update({
            user_type: "elev",
            ...(!preferredMaterie ? {} : { preferred_materie: preferredMaterie }),
            onboarding_completed_at: now,
          })
          .eq("user_id", userId)
          .is("onboarding_completed_at", null)
        if (raceUpdateError) {
          logger.error("[rezerva/bootstrap] race update failed:", raceUpdateError)
          return NextResponse.json({ error: "Nu am putut pregăti profilul." }, { status: 500 })
        }
        return NextResponse.json({ ok: true })
      }
      if (insertError) {
        logger.error("[rezerva/bootstrap] insert failed:", insertError)
        return NextResponse.json({ error: "Nu am putut pregăti profilul." }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    const update: Record<string, unknown> = { user_type: "elev" }
    if (!profile.onboarding_completed_at) {
      update.onboarding_completed_at = now
    }
    if (preferredMaterie && !profile.preferred_materie) {
      update.preferred_materie = preferredMaterie
    }

    const { error: updateError } = await admin.from("profiles").update(update).eq("user_id", userId)
    if (updateError) {
      logger.error("[rezerva/bootstrap] update failed:", updateError)
      return NextResponse.json({ error: "Nu am putut pregăti profilul." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("[rezerva/bootstrap] unexpected error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

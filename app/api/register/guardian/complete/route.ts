import { NextResponse } from "next/server"
import { ZodError } from "zod"
import {
  GuardianOnboardingCompleteError,
  GuardianOnboardingRoleConflictError,
  completeGuardianOnboarding,
  parseGuardianCompleteInput,
} from "@/lib/guardian-onboarding-server"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const input = parseGuardianCompleteInput(body)
    await completeGuardianOnboarding({
      userId: user.id,
      userEmail: user.email,
      input,
    })

    return NextResponse.json({ success: true, role: input.role })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Date invalide pentru finalizarea onboarding-ului." },
        { status: 400 },
      )
    }

    if (error instanceof GuardianOnboardingRoleConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    if (error instanceof GuardianOnboardingCompleteError) {
      logger.error("[guardian/onboarding/complete]", error.message)
      return NextResponse.json(
        { error: "Nu am putut salva profilul. Mai încearcă o dată, te rog." },
        { status: 500 },
      )
    }

    logger.error("[guardian/onboarding/complete] unexpected error", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

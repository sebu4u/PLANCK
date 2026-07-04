import { z } from "zod"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { ensureParentInviteCode } from "@/lib/parent/server"
import {
  GUARDIAN_CHILD_AGE_MAX,
  GUARDIAN_CHILD_AGE_MIN,
  type GuardianDailyTimeOption,
  type GuardianRole,
  type GuardianTeachingMaterie,
} from "@/lib/guardian-onboarding"
import { logger } from "@/lib/logger"
import { normalizeUserType } from "@/lib/user-types"

const guardianCompleteSchema = z.discriminatedUnion("role", [
  z.object({
    name: z.string().trim().min(2).max(60),
    role: z.literal("parinte"),
    childAge: z.number().int().min(GUARDIAN_CHILD_AGE_MIN).max(GUARDIAN_CHILD_AGE_MAX),
    dailyTime: z.enum(["15", "30", "60"]),
  }),
  z.object({
    name: z.string().trim().min(2).max(60),
    role: z.literal("profesor"),
    teachingMaterie: z.enum(["matematica", "fizica", "informatica", "biologie"]),
  }),
])

export type GuardianCompleteInput = z.infer<typeof guardianCompleteSchema>

export class GuardianOnboardingCompleteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GuardianOnboardingCompleteError"
  }
}

export class GuardianOnboardingRoleConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GuardianOnboardingRoleConflictError"
  }
}

function buildProfilePayload(input: GuardianCompleteInput) {
  const completedAt = new Date().toISOString()

  if (input.role === "parinte") {
    return {
      name: input.name,
      nickname: input.name,
      user_type: "parinte" as const,
      teaching_materie: null,
      onboarding_child_age: input.childAge,
      onboarding_daily_minutes: input.dailyTime as GuardianDailyTimeOption,
      onboarding_completed_at: completedAt,
    }
  }

  return {
    name: input.name,
    nickname: input.name,
    user_type: "profesor" as const,
    teaching_materie: input.teachingMaterie as GuardianTeachingMaterie,
    onboarding_child_age: null,
    onboarding_daily_minutes: null,
    onboarding_completed_at: completedAt,
  }
}

async function generateReferralCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
    const { data: existing } = await admin
      .from("profiles")
      .select("user_id")
      .eq("referral_code", candidate)
      .maybeSingle()

    if (!existing) {
      return candidate
    }
  }

  throw new GuardianOnboardingCompleteError("REFERRAL_CODE_GENERATION_FAILED")
}

export function parseGuardianCompleteInput(body: unknown): GuardianCompleteInput {
  return guardianCompleteSchema.parse(body)
}

export async function completeGuardianOnboarding(params: {
  userId: string
  userEmail?: string | null
  input: GuardianCompleteInput
}): Promise<{ role: GuardianRole }> {
  const admin = createAdminClient()

  const { data: existingProfile, error: profileFetchError } = await admin
    .from("profiles")
    .select("user_type, onboarding_completed_at")
    .eq("user_id", params.userId)
    .maybeSingle()

  if (profileFetchError) {
    logger.error("[guardian/onboarding] profile fetch failed", profileFetchError)
    throw new GuardianOnboardingCompleteError(profileFetchError.message)
  }

  if (existingProfile?.onboarding_completed_at) {
    throw new GuardianOnboardingRoleConflictError(
      "Ai deja un cont activ. Folosește dashboard-ul contului tău existent.",
    )
  }

  if (existingProfile && normalizeUserType(existingProfile.user_type) !== "elev") {
    throw new GuardianOnboardingRoleConflictError(
      "Contul tău existent nu poate fi folosit pentru acest tip de înregistrare.",
    )
  }

  const payload = buildProfilePayload(params.input)

  const { data: updatedProfile, error: updateError } = await admin
    .from("profiles")
    .update(payload)
    .eq("user_id", params.userId)
    .select("user_id")
    .maybeSingle()

  if (updateError) {
    logger.error("[guardian/onboarding] profile update failed", updateError)
    throw new GuardianOnboardingCompleteError(updateError.message)
  }

  if (!updatedProfile) {
    const referralCode = await generateReferralCode(admin)
    const { error: insertError } = await admin.from("profiles").insert({
      user_id: params.userId,
      email: params.userEmail ?? null,
      plan: "free",
      referral_code: referralCode,
      ...payload,
    })

    if (insertError) {
      logger.error("[guardian/onboarding] profile insert failed", insertError)
      throw new GuardianOnboardingCompleteError(insertError.message)
    }
  }

  if (params.input.role === "parinte") {
    try {
      await ensureParentInviteCode(params.userId)
    } catch (error) {
      logger.error("[guardian/onboarding] parent invite code failed", error)
      throw new GuardianOnboardingCompleteError("INVITE_CODE_GENERATION_FAILED")
    }
  }

  return { role: params.input.role }
}

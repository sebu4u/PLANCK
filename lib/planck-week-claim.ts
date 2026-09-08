import "server-only"

import { upsertSubscriber } from "@/lib/mailerlite/client"
import { logger } from "@/lib/logger"
import type { OnboardingSubjectId } from "@/lib/onboarding"
import {
  getPlanckWeekPregatirePath,
  getPlanckWeekSiteUrl,
  PLANCK_WEEK_MOBILE_CALENDAR_FROM,
  PLANCK_WEEK_MOBILE_CALENDAR_TO,
  workshopSubjectToOnboardingSubject,
} from "@/lib/planck-week"
import {
  sendPlanckWeekClaimSummaryEmail,
  type PlanckWeekClaimedSession,
} from "@/lib/planck-week-email"
import { isWorkshopSubject, type WorkshopSubject } from "@/lib/pregatire/types"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export type PlanckWeekClaimResult = {
  ok: true
  claimed: boolean
  alreadyClaimed: boolean
  unlockedCount: number
  skippedFull: number
  redirectPath: string | null
}

type LeadRow = {
  id: string
  name: string
  email: string
  subjects: string[] | null
  user_id: string | null
  claimed_at: string | null
}

type WorkshopRow = {
  id: string
  title: string
  subject: string
  starts_at: string
  max_seats: number | null
}

function parseLeadSubjects(raw: readonly string[] | null): WorkshopSubject[] {
  if (!raw) return []
  const seen = new Set<WorkshopSubject>()
  const result: WorkshopSubject[] = []
  for (const value of raw) {
    if (!isWorkshopSubject(value) || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

async function lightCompleteProfile(input: {
  userId: string
  name: string
  subject: OnboardingSubjectId | null
  schoolGrade?: string | null
}): Promise<void> {
  const supabase = getServiceRoleSupabase()
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, preferred_materie, user_type, onboarding_completed_at, grade")
    .eq("user_id", input.userId)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    email_verified: true,
  }

  if (!profile?.onboarding_completed_at) {
    payload.onboarding_completed_at = new Date().toISOString()
    if (!profile?.user_type) payload.user_type = "elev"
    if (input.subject && !profile?.preferred_materie) {
      payload.preferred_materie = input.subject
    }
  }

  if (input.name.trim() && (!profile?.name || profile.name.trim() === "")) {
    payload.name = input.name.trim()
  }

  if (input.schoolGrade && !profile?.grade) {
    payload.grade = input.schoolGrade
  }

  const { error } = await supabase.from("profiles").update(payload).eq("user_id", input.userId)
  if (error) {
    logger.error("[planck-week] profile light-complete failed:", error.message)
  }
}

async function unlockPlanckWeekWorkshops(input: {
  userId: string
  subjects: WorkshopSubject[]
}): Promise<{ unlocked: PlanckWeekClaimedSession[]; skippedFull: number }> {
  if (input.subjects.length === 0) {
    return { unlocked: [], skippedFull: 0 }
  }

  const supabase = getServiceRoleSupabase()
  const from = `${PLANCK_WEEK_MOBILE_CALENDAR_FROM}T00:00:00+03:00`
  const to = `${PLANCK_WEEK_MOBILE_CALENDAR_TO}T23:59:59+03:00`

  const { data, error } = await supabase
    .from("workshops")
    .select("id, title, subject, starts_at, max_seats")
    .eq("is_published", true)
    .in("subject", input.subjects)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })

  if (error) {
    logger.error("[planck-week] workshops query failed:", error.message)
    return { unlocked: [], skippedFull: 0 }
  }

  const workshops = (data ?? []) as WorkshopRow[]
  const unlocked: PlanckWeekClaimedSession[] = []
  let skippedFull = 0

  for (const workshop of workshops) {
    if (!isWorkshopSubject(workshop.subject)) continue

    const { data: existing } = await supabase
      .from("workshop_unlocks")
      .select("user_id")
      .eq("user_id", input.userId)
      .eq("workshop_id", workshop.id)
      .maybeSingle()

    if (existing) {
      unlocked.push({
        title: workshop.title,
        startsAt: workshop.starts_at,
        subject: workshop.subject,
      })
      continue
    }

    if (workshop.max_seats != null) {
      const { count } = await supabase
        .from("workshop_unlocks")
        .select("user_id", { count: "exact", head: true })
        .eq("workshop_id", workshop.id)

      if ((count ?? 0) >= workshop.max_seats) {
        const { error: updateError } = await supabase
          .from("workshops")
          .update({ max_seats: workshop.max_seats + 10 })
          .eq("id", workshop.id)

        if (updateError) {
          logger.error("[planck-week] capacity expand failed:", updateError.message)
          skippedFull += 1
          continue
        }
      }
    }

    const { error: insertError } = await supabase.from("workshop_unlocks").insert({
      user_id: input.userId,
      workshop_id: workshop.id,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        unlocked.push({
          title: workshop.title,
          startsAt: workshop.starts_at,
          subject: workshop.subject,
        })
        continue
      }
      logger.error("[planck-week] unlock insert failed:", insertError.message)
      continue
    }

    unlocked.push({
      title: workshop.title,
      startsAt: workshop.starts_at,
      subject: workshop.subject,
    })
  }

  return { unlocked, skippedFull }
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() ?? ""
  return local.length >= 2 ? local : "Elev Planck"
}

export async function claimPlanckWeekForUser(input: {
  userId: string
  email: string
  schoolGrade?: string | null
  sendSummaryEmail?: boolean
  subjects?: WorkshopSubject[]
  name?: string | null
}): Promise<PlanckWeekClaimResult> {
  const email = input.email.trim().toLowerCase()
  const supabase = getServiceRoleSupabase()

  const { data: lead, error: leadError } = await supabase
    .from("planck_week_leads")
    .select("id, name, email, subjects, user_id, claimed_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (leadError) {
    logger.error("[planck-week] lead lookup failed:", leadError.message)
  }

  let row = (lead ?? null) as LeadRow | null
  const requestedSubjects = input.subjects ? parseLeadSubjects(input.subjects) : []
  const leadSubjects = parseLeadSubjects(row?.subjects ?? null)
  const subjects = requestedSubjects.length > 0 ? requestedSubjects : leadSubjects
  const displayName = (input.name?.trim() || row?.name || nameFromEmail(email)).slice(0, 80)

  if (subjects.length > 0) {
    if (row) {
      const { error: updateLeadError } = await supabase
        .from("planck_week_leads")
        .update({
          name: displayName,
          subjects,
        })
        .eq("id", row.id)
      if (updateLeadError) {
        logger.error("[planck-week] lead update failed:", updateLeadError.message)
      } else {
        row = { ...row, name: displayName, subjects }
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("planck_week_leads")
        .insert({
          name: displayName,
          email,
          subjects,
        })
        .select("id, name, email, subjects, user_id, claimed_at")
        .maybeSingle()
      if (insertError) {
        logger.error("[planck-week] lead insert failed:", insertError.message)
      } else {
        row = (inserted ?? null) as LeadRow | null
      }
    }

    const groupId = process.env.MAILERLITE_PLANCK_WEEK_GROUP_ID?.trim()
    if (groupId) {
      try {
        await upsertSubscriber(email, {
          fields: { name: displayName },
          groups: [groupId],
        })
      } catch {
        // Reservation already saved — MailerLite is optional.
      }
    }
  }

  const firstSubject = subjects[0] ?? null
  const redirectPath = getPlanckWeekPregatirePath(firstSubject)
  const preferredMaterie = firstSubject
    ? workshopSubjectToOnboardingSubject(firstSubject)
    : null

  if (!row || subjects.length === 0) {
    return {
      ok: true,
      claimed: false,
      alreadyClaimed: false,
      unlockedCount: 0,
      skippedFull: 0,
      redirectPath,
    }
  }

  await lightCompleteProfile({
    userId: input.userId,
    name: displayName,
    subject: preferredMaterie,
    schoolGrade: input.schoolGrade,
  })

  const alreadyClaimed = Boolean(row.claimed_at) && row.user_id === input.userId
  const { unlocked, skippedFull } = await unlockPlanckWeekWorkshops({
    userId: input.userId,
    subjects,
  })

  const { error: updateError } = await supabase
    .from("planck_week_leads")
    .update({
      user_id: input.userId,
      claimed_at: row.claimed_at ?? new Date().toISOString(),
    })
    .eq("id", row.id)

  if (updateError) {
    logger.error("[planck-week] lead claim update failed:", updateError.message)
  }

  if (input.sendSummaryEmail === true && !alreadyClaimed && unlocked.length > 0) {
    const summary = await sendPlanckWeekClaimSummaryEmail({
      to: email,
      name: row.name,
      sessions: unlocked,
      pregatireUrl: `${getPlanckWeekSiteUrl()}${redirectPath}`,
    })
    if (!summary.ok) {
      logger.error("[planck-week] claim summary email failed:", summary.message)
    }
  }

  return {
    ok: true,
    claimed: true,
    alreadyClaimed,
    unlockedCount: unlocked.length,
    skippedFull,
    redirectPath,
  }
}

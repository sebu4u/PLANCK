import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import {
  daysInactiveSince,
  isExcludedAdminEmail,
  isValidLastActivity,
  shouldSendReengagementEmail,
} from "@/lib/reengagement/eligibility"
import { buildReengagementPersonalization } from "@/lib/reengagement/personalization"
import { sendReengagementEmail } from "@/lib/reengagement/send-email"
import type {
  ReengagementJobSummary,
  ReengagementSendRecord,
  ReengagementTier,
  ReengagementTierStats,
} from "@/lib/reengagement/types"

const PAGE_SIZE = 1000
const SEND_DELAY_MS = 500

function emptyTierStats(): ReengagementTierStats {
  return { eligible: 0, sent: 0, failed: 0, skipped: 0 }
}

function initSummary(): ReengagementJobSummary {
  return {
    tier1: emptyTierStats(),
    tier2: emptyTierStats(),
    tier3: emptyTierStats(),
    tier4: emptyTierStats(),
    skipped_no_activity: 0,
    skipped_excluded: 0,
    skipped_opt_out: 0,
    skipped_not_sendable: 0,
    duration_ms: 0,
  }
}

function tierKey(tier: ReengagementTier): keyof Pick<
  ReengagementJobSummary,
  "tier1" | "tier2" | "tier3" | "tier4"
> {
  return `tier${tier}` as "tier1" | "tier2" | "tier3" | "tier4"
}

async function buildEmailMap(supabase: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    })
    if (error) throw error

    for (const user of data.users) {
      if (user.email) map.set(user.id, user.email.toLowerCase())
    }

    if (data.users.length < PAGE_SIZE) break
    page++
  }

  return map
}

async function fetchSendHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<ReengagementSendRecord[]> {
  const { data, error } = await supabase
    .from("user_reengagement_email_sends")
    .select("tier, sent_at, status")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })

  if (error) {
    console.warn("[reengagement] Failed to load send history:", userId, error.message)
    return []
  }

  return (data ?? []) as ReengagementSendRecord[]
}

async function claimSend(
  supabase: SupabaseClient,
  userId: string,
  tier: ReengagementTier,
  daysInactive: number,
  sendId: string,
  personalization: Record<string, unknown>
): Promise<{ ok: true; rowId: string } | { ok: false; reason: "duplicate" | "error" }> {
  const { data, error } = await supabase
    .from("user_reengagement_email_sends")
    .insert({
      user_id: userId,
      tier,
      days_inactive: daysInactive,
      status: "pending",
      mailerlite_send_id: sendId,
      personalization,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "duplicate" }
    console.warn("[reengagement] Claim insert failed:", error.message)
    return { ok: false, reason: "error" }
  }

  return { ok: true, rowId: data.id }
}

async function finalizeSend(
  supabase: SupabaseClient,
  rowId: string,
  status: "sent" | "failed",
  errorMessage?: string
) {
  await supabase
    .from("user_reengagement_email_sends")
    .update({ status, error_message: errorMessage ?? null })
    .eq("id", rowId)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function runReengagementJob(
  supabase: SupabaseClient,
  adminEmails: string[]
): Promise<ReengagementJobSummary> {
  const started = Date.now()
  const summary = initSummary()
  const now = new Date()

  const emailByUserId = await buildEmailMap(supabase)

  let offset = 0
  while (true) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, name, preferred_materie, marketing_emails_opt_out, is_admin, is_dev")
      .order("user_id")
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error
    if (!profiles?.length) break

    const userIds = profiles.map((p) => p.user_id)

    const { data: statsRows } = await supabase
      .from("user_stats")
      .select("user_id, last_activity_date, current_streak")
      .in("user_id", userIds)

    const statsByUser = new Map(
      (statsRows ?? []).map((s) => [s.user_id, s])
    )

    const { data: activityRows, error: activityError } = await supabase.rpc(
      "get_users_last_activity_batch",
      { user_ids: userIds }
    )

    if (activityError) {
      console.warn("[reengagement] get_users_last_activity_batch failed:", activityError.message)
    }

    const activityByUser = new Map<string, string>()
    for (const row of activityRows ?? []) {
      if (row.last_activity_at && row.last_activity_at !== "-infinity") {
        activityByUser.set(row.user_id, row.last_activity_at)
      }
    }

    for (const profile of profiles) {
      if (profile.marketing_emails_opt_out) {
        summary.skipped_opt_out++
        continue
      }

      if (profile.is_admin || profile.is_dev) {
        summary.skipped_excluded++
        continue
      }

      const email = emailByUserId.get(profile.user_id)
      if (!email || isExcludedAdminEmail(email, adminEmails)) {
        summary.skipped_excluded++
        continue
      }

      const stats = statsByUser.get(profile.user_id)
      const lastActivityAt =
        activityByUser.get(profile.user_id) ??
        (stats?.last_activity_date
          ? `${stats.last_activity_date}T12:00:00.000Z`
          : null)

      if (!isValidLastActivity(lastActivityAt)) {
        summary.skipped_no_activity++
        continue
      }

      const lastActivityDate = new Date(lastActivityAt!)
      const daysInactive = daysInactiveSince(lastActivityDate, now)
      const sends = await fetchSendHistory(supabase, profile.user_id)
      const decision = shouldSendReengagementEmail(daysInactive, sends, now)

      if (!decision.send || decision.tier === null) {
        if (decision.tier !== null) {
          summary[tierKey(decision.tier)].skipped++
        }
        continue
      }

      const tier = decision.tier
      summary[tierKey(tier)].eligible++

      const personalization = await buildReengagementPersonalization(
        supabase,
        profile.user_id,
        tier,
        daysInactive,
        {
          name: profile.name,
          preferred_materie: profile.preferred_materie,
          current_streak: stats?.current_streak ?? 0,
        }
      )

      const claim = await claimSend(
        supabase,
        profile.user_id,
        tier,
        daysInactive,
        personalization.reeng_send_id,
        personalization as unknown as Record<string, unknown>
      )

      if (!claim.ok) {
        summary[tierKey(tier)].skipped++
        continue
      }

      const result = await sendReengagementEmail({
        email,
        tier,
        personalization,
      })

      if (result.ok) {
        await finalizeSend(supabase, claim.rowId, "sent")
        summary[tierKey(tier)].sent++
      } else {
        await finalizeSend(supabase, claim.rowId, "failed", result.message)
        if (result.reason === "not_sendable") {
          summary.skipped_not_sendable++
        } else {
          summary[tierKey(tier)].failed++
        }
      }

      await delay(SEND_DELAY_MS)
    }

    if (profiles.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  summary.duration_ms = Date.now() - started
  return summary
}

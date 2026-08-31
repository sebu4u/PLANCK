import "server-only"

import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { hasEntitledSubscriptionStatus } from "@/lib/stripe-subscription"
import { normalizeSubscriptionPlan } from "@/lib/subscription-plan"
import { normalizeUserType } from "@/lib/user-types"
import {
  getPrizeWheelCouponExpiresAt,
  isPrizeWheelCouponExpired,
} from "@/lib/prize-wheel/expiry"
import {
  getPrizeWheelDisplayPromo,
  getPrizeWheelInterval,
  getPrizeWheelPrizeLabel,
  isCampaignLive,
  isPrizeWheelPrizeType,
  type PrizeWheelPrizeView,
  type PrizeWheelPublicCampaign,
} from "@/lib/prize-wheel/types"

export type PrizeWheelCampaignRow = {
  id: string
  starts_at: string | null
  ends_at: string | null
  guaranteed_1leu_limit: number
  guaranteed_1leu_awarded: number
  created_at: string
  updated_at: string
}

export type PrizeWheelPrizeRow = {
  id: string
  campaign_id: string
  user_id: string
  prize_type: string
  code: string
  email: string | null
  display_name: string | null
  redeemed_at: string | null
  stripe_checkout_session_id: string | null
  created_at: string
}

export function toPrizeView(
  row: Pick<PrizeWheelPrizeRow, "id" | "prize_type" | "code" | "redeemed_at" | "created_at">
): PrizeWheelPrizeView | null {
  if (!isPrizeWheelPrizeType(row.prize_type)) return null
  const display = getPrizeWheelDisplayPromo(row.prize_type)
  const createdAt = row.created_at
  return {
    id: row.id,
    type: row.prize_type,
    code: row.code,
    label: getPrizeWheelPrizeLabel(row.prize_type),
    interval: getPrizeWheelInterval(row.prize_type),
    redeemedAt: row.redeemed_at,
    createdAt,
    expiresAt: getPrizeWheelCouponExpiresAt(createdAt),
    percentOff: display.percentOff,
    amountOff: display.amountOff,
    currency: display.currency,
    isTrial: display.isTrial,
  }
}

export async function getPrizeWheelCampaign(): Promise<PrizeWheelCampaignRow | null> {
  const supabase = getServiceRoleSupabase()
  const { data, error } = await supabase
    .from("prize_wheel_campaigns")
    .select(
      "id, starts_at, ends_at, guaranteed_1leu_limit, guaranteed_1leu_awarded, created_at, updated_at"
    )
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export function toPublicCampaign(campaign: PrizeWheelCampaignRow | null): PrizeWheelPublicCampaign {
  return {
    isLive: campaign ? isCampaignLive(campaign.starts_at, campaign.ends_at) : false,
    startsAt: campaign?.starts_at ?? null,
    endsAt: campaign?.ends_at ?? null,
  }
}

export function isProfilePremium(profile: {
  plan?: string | null
  stripe_subscription_status?: string | null
} | null): boolean {
  if (!profile) return false
  if (normalizeSubscriptionPlan(profile.plan) === "premium") return true
  if (normalizeSubscriptionPlan(profile.plan) === "plus") return false
  return hasEntitledSubscriptionStatus(profile.stripe_subscription_status)
}

export function isProfileStudent(userType: unknown): boolean {
  return normalizeUserType(userType) === "elev"
}

export async function getUserPrizeForCampaign(
  userId: string,
  campaignId: string
): Promise<PrizeWheelPrizeRow | null> {
  const supabase = getServiceRoleSupabase()
  const { data, error } = await supabase
    .from("prize_wheel_prizes")
    .select(
      "id, campaign_id, user_id, prize_type, code, email, display_name, redeemed_at, stripe_checkout_session_id, created_at"
    )
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getUnusedPrizeForUser(userId: string): Promise<PrizeWheelPrizeView | null> {
  const campaign = await getPrizeWheelCampaign()
  if (!campaign) return null
  const prize = await getUserPrizeForCampaign(userId, campaign.id)
  if (!prize || prize.redeemed_at) return null
  const view = toPrizeView(prize)
  if (!view || isPrizeWheelCouponExpired(view.expiresAt)) return null
  return view
}

export async function getPrizeByCodeForUser(
  userId: string,
  code: string
): Promise<PrizeWheelPrizeView | null> {
  const supabase = getServiceRoleSupabase()
  const { data, error } = await supabase
    .from("prize_wheel_prizes")
    .select(
      "id, campaign_id, user_id, prize_type, code, email, display_name, redeemed_at, stripe_checkout_session_id, created_at"
    )
    .eq("user_id", userId)
    .eq("code", code)
    .maybeSingle()

  if (error) throw error
  if (!data || data.redeemed_at) return null
  const view = toPrizeView(data)
  if (!view || isPrizeWheelCouponExpired(view.expiresAt)) return null
  return view
}

export async function countUserSpins(userId: string, campaignId: string): Promise<number> {
  const supabase = getServiceRoleSupabase()
  const { count, error } = await supabase
    .from("prize_wheel_spins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)

  if (error) throw error
  return count ?? 0
}

export async function markPrizeRedeemed(options: {
  prizeId: string
  sessionId?: string | null
}): Promise<void> {
  const supabase = getServiceRoleSupabase()
  const { error } = await supabase
    .from("prize_wheel_prizes")
    .update({
      redeemed_at: new Date().toISOString(),
      stripe_checkout_session_id: options.sessionId ?? null,
    })
    .eq("id", options.prizeId)
    .is("redeemed_at", null)

  if (error) throw error
}

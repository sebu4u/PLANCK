import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import {
  SHOP_PRODUCTS,
  getShopProduct,
  isShopBillingInterval,
  isShopProductKey,
  type ShopCouponView,
  type ShopProductKey,
  type ShopPurchaseView,
  type ShopStatusResponse,
} from "@/lib/shop/types"

type UnknownRow = Record<string, unknown>

function isSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? String(error.code) : ""
  const message = "message" in error ? String(error.message).toLowerCase() : ""
  const details = "details" in error ? String(error.details).toLowerCase() : ""
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache") ||
    details.includes("purchased_balance")
  )
}

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null

const asNumber = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function toCoupon(row: UnknownRow): ShopCouponView | null {
  const productKey = row.product_key ?? row.product_id
  if (!isShopProductKey(productKey)) return null
  const product = getShopProduct(productKey)
  const interval = row.interval ?? row.billing_interval ?? product.interval
  const percentOff = asNumber(row.percent_off ?? row.discount_percent) ?? product.percentOff
  const id = asString(row.id)
  const code = asString(row.code)
  if (!id || !code || !isShopBillingInterval(interval) || percentOff == null) return null

  return {
    id,
    productKey,
    code,
    percentOff,
    interval,
    redeemedAt: asString(row.redeemed_at),
    expiresAt: asString(row.expires_at),
  }
}

function toPurchase(row: UnknownRow): ShopPurchaseView | null {
  const productKey = row.product_key ?? row.product_id
  const id = asString(row.id)
  if (!id || !isShopProductKey(productKey)) return null
  return {
    id,
    productKey,
    coinCost: asNumber(row.coin_cost ?? row.price_coins) ?? getShopProduct(productKey).coinCost,
    createdAt: asString(row.created_at) ?? new Date(0).toISOString(),
  }
}

async function loadShopPurchases(
  client: SupabaseClient,
  userId: string
): Promise<ShopPurchaseView[]> {
  const { data, error } = await client
    .from("planckpass_shop_purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    if (isSchemaMissingError(error)) return []
    throw error
  }

  return ((data ?? []) as UnknownRow[])
    .map(toPurchase)
    .filter((item): item is ShopPurchaseView => Boolean(item))
}

async function loadActiveShopCoupons(
  client: SupabaseClient,
  userId: string
): Promise<ShopCouponView[]> {
  const { data, error } = await client
    .from("planckpass_shop_coupons")
    .select("*")
    .eq("user_id", userId)
    .is("redeemed_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    if (isSchemaMissingError(error)) return []
    throw error
  }

  const now = Date.now()
  return ((data ?? []) as UnknownRow[])
    .map(toCoupon)
    .filter(
      (item): item is ShopCouponView =>
        Boolean(item) && (!item!.expiresAt || new Date(item!.expiresAt).getTime() > now)
    )
}

async function loadWorkshopEnergy(
  client: SupabaseClient,
  userId: string
): Promise<{ energyBalance: number; purchasedEnergyBalance: number }> {
  let result = await client
    .from("user_workshop_energy")
    .select("balance, carryover_balance, purchased_balance")
    .eq("user_id", userId)
    .maybeSingle()

  if (result.error && isSchemaMissingError(result.error)) {
    result = await client
      .from("user_workshop_energy")
      .select("balance, carryover_balance")
      .eq("user_id", userId)
      .maybeSingle()
  }

  if (result.error && result.error.code !== "PGRST116") {
    if (isSchemaMissingError(result.error)) {
      return { energyBalance: 0, purchasedEnergyBalance: 0 }
    }
    throw result.error
  }

  const energy = (result.data ?? {}) as UnknownRow
  const balance = asNumber(energy.balance) ?? 0
  const carryover = asNumber(energy.carryover_balance) ?? 0
  const purchased = asNumber(energy.purchased_balance) ?? 0

  return {
    energyBalance: balance + carryover + purchased,
    purchasedEnergyBalance: purchased,
  }
}

export async function getShopStatus(
  userId: string,
  client: SupabaseClient
): Promise<ShopStatusResponse> {
  const [purchases, activeCoupons, statsResult, energy] = await Promise.all([
    loadShopPurchases(client, userId),
    loadActiveShopCoupons(client, userId),
    client.from("user_stats").select("coins").eq("user_id", userId).maybeSingle(),
    loadWorkshopEnergy(client, userId),
  ])

  if (statsResult.error && statsResult.error.code !== "PGRST116") {
    throw statsResult.error
  }

  const stats = (statsResult.data ?? {}) as UnknownRow
  const coinBalance = asNumber(stats.coins)

  return {
    products: Object.values(SHOP_PRODUCTS),
    purchases,
    activeCoupons,
    coinBalance,
    energyBalance: energy.energyBalance,
    purchasedEnergyBalance: energy.purchasedEnergyBalance,
  }
}

export async function purchaseShopItem(
  userClient: SupabaseClient,
  productKey: ShopProductKey
): Promise<unknown> {
  const { data, error } = await userClient.rpc("purchase_planckpass_shop_item", {
    p_product_id: productKey,
  })
  if (error) throw error
  return data
}

export async function getShopCouponByIdForUser(
  userId: string,
  couponId: string
): Promise<ShopCouponView | null> {
  const supabase = getServiceRoleSupabase()
  const { data, error } = await supabase
    .from("planckpass_shop_coupons")
    .select("*")
    .eq("id", couponId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  const coupon = data ? toCoupon(data as UnknownRow) : null
  if (!coupon || coupon.redeemedAt) return null
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) return null
  return coupon
}

export async function getShopCouponByCodeForUser(
  userId: string,
  code: string
): Promise<ShopCouponView | null> {
  const supabase = getServiceRoleSupabase()
  const { data, error } = await supabase
    .from("planckpass_shop_coupons")
    .select("*")
    .eq("user_id", userId)
    .ilike("code", code)
    .maybeSingle()
  if (error) throw error
  const coupon = data ? toCoupon(data as UnknownRow) : null
  if (!coupon || coupon.redeemedAt) return null
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) return null
  return coupon
}

export async function markShopCouponRedeemed(options: {
  couponId: string
  sessionId: string
}): Promise<void> {
  const supabase = getServiceRoleSupabase()
  const { error } = await supabase
    .from("planckpass_shop_coupons")
    .update({
      redeemed_at: new Date().toISOString(),
      stripe_checkout_session_id: options.sessionId,
    })
    .eq("id", options.couponId)
    .is("redeemed_at", null)
  if (error) throw error
}

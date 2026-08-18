export const SHOP_PRODUCT_KEYS = ["energy_25", "month_50", "year_10", "week_90"] as const

export type ShopProductKey = (typeof SHOP_PRODUCT_KEYS)[number]
export type ShopBillingInterval = "week" | "month" | "year"

export type ShopProduct = {
  key: ShopProductKey
  name: string
  description: string
  coinCost: number
  kind: "energy" | "coupon"
  energyAmount: number | null
  percentOff: number | null
  interval: ShopBillingInterval | null
}

export const SHOP_PRODUCTS: Record<ShopProductKey, ShopProduct> = {
  energy_25: {
    key: "energy_25",
    name: "25 energie",
    description: "Continuă să înveți fără pauză cu 25 de energie.",
    coinCost: 250,
    kind: "energy",
    energyAmount: 25,
    percentOff: null,
    interval: null,
  },
  month_50: {
    key: "month_50",
    name: "50% Premium lunar",
    description: "Jumătate de preț pentru prima lună de Premium.",
    coinCost: 1250,
    kind: "coupon",
    energyAmount: null,
    percentOff: 50,
    interval: "month",
  },
  year_10: {
    key: "year_10",
    name: "10% Premium anual",
    description: "Reducere la primul an de Premium.",
    coinCost: 1500,
    kind: "coupon",
    energyAmount: null,
    percentOff: 10,
    interval: "year",
  },
  week_90: {
    key: "week_90",
    name: "90% Premium săptămânal",
    description: "Încearcă Premium o săptămână aproape gratuit.",
    coinCost: 900,
    kind: "coupon",
    energyAmount: null,
    percentOff: 90,
    interval: "week",
  },
}

export type ShopCouponView = {
  id: string
  productKey: ShopProductKey
  code: string
  percentOff: number
  interval: ShopBillingInterval
  redeemedAt: string | null
  expiresAt: string | null
}

export type ShopPurchaseView = {
  id: string
  productKey: ShopProductKey
  coinCost: number
  createdAt: string
}

export type ShopStatusResponse = {
  products: ShopProduct[]
  purchases: ShopPurchaseView[]
  activeCoupons: ShopCouponView[]
  coinBalance: number | null
  energyBalance: number
  purchasedEnergyBalance: number
}

export function isShopProductKey(value: unknown): value is ShopProductKey {
  return typeof value === "string" && (SHOP_PRODUCT_KEYS as readonly string[]).includes(value)
}

export function isShopBillingInterval(value: unknown): value is ShopBillingInterval {
  return value === "week" || value === "month" || value === "year"
}

export function getShopProduct(key: ShopProductKey): ShopProduct {
  return SHOP_PRODUCTS[key]
}

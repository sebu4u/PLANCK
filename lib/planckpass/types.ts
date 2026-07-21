export type PlanckPassRewardKind =
  | "icon"
  | "badge"
  | "border"
  | "skin"
  | "elo"
  | "elo_2x"
  | "streak_freeze"
  | "coins"

export type PlanckPassCosmeticKind = "icon" | "badge" | "border" | "skin"

export interface PlanckPassCosmetic {
  id: string
  kind: PlanckPassCosmeticKind
  name: string
  imageUrl: string
  meta?: Record<string, unknown>
}

export interface PlanckPassTier {
  tier: number
  isFree: boolean
  kind: PlanckPassRewardKind
  label: string
  xpRequired: number
  coinsAmount: number | null
  eloAmount: number | null
  eloMultiplierMinutes: number | null
  streakFreezeHours: number | null
  cosmetic: PlanckPassCosmetic | null
  claimed: boolean
  unlocked: boolean
  claimable: boolean
  premiumLocked: boolean
}

export interface PlanckPassSeason {
  id: string
  title: string
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
}

export interface PlanckPassState {
  season: PlanckPassSeason | null
  currentTier: number
  xpCurrent: number
  xpMax: number
  xpTotal: number
  tiers: PlanckPassTier[]
  canClaimPremium: boolean
  coins: number
  eloBoostUntil: string | null
  streakFreezeUntil: string | null
}

export interface PlanckPassClaimResult {
  tierNumber: number
  rewardKind: PlanckPassRewardKind
  label: string
  isFree: boolean
  coinsAmount: number | null
  eloAmount: number | null
  eloMultiplierMinutes: number | null
  streakFreezeHours: number | null
  cosmetic: PlanckPassCosmetic | null
  eloBoostUntil?: string | null
  streakFreezeUntil?: string | null
  newElo?: number | null
  newCoins?: number | null
}

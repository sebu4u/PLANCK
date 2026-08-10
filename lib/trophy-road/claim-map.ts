import type { PlanckPassClaimResult } from "@/lib/planckpass/types"
import type { TrophyRoadClaimResult } from "@/lib/trophy-road/types"

/** Map trophy-road claim → Pass reveal UI shape */
export function trophyClaimToPassReveal(
  reward: TrophyRoadClaimResult,
): PlanckPassClaimResult {
  return {
    tierNumber: reward.threshold,
    rewardKind: reward.rewardKind,
    label: reward.label,
    isFree: true,
    coinsAmount: reward.coinsAmount,
    eloAmount: reward.eloAmount,
    eloMultiplierMinutes: reward.eloMultiplierMinutes,
    streakFreezeHours: reward.streakFreezeHours,
    cosmetic: reward.cosmetic,
    eloBoostUntil: reward.eloBoostUntil,
    streakFreezeUntil: reward.streakFreezeUntil,
    newElo: reward.newElo,
    newCoins: reward.newCoins,
  }
}

export function mapTrophyRoadClaimRpcResult(
  data: Record<string, unknown>,
): TrophyRoadClaimResult {
  const cosmeticRaw = data.cosmetic as
    | {
        id: string
        kind: string
        name: string
        imageUrl: string
      }
    | null
    | undefined

  return {
    milestoneId: String(data.milestoneId ?? ""),
    threshold: Number(data.threshold ?? 0),
    rewardKind: data.rewardKind as TrophyRoadClaimResult["rewardKind"],
    label: String(data.label ?? ""),
    coinsAmount: (data.coinsAmount as number | null) ?? null,
    eloAmount: (data.eloAmount as number | null) ?? null,
    eloMultiplierMinutes: (data.eloMultiplierMinutes as number | null) ?? null,
    streakFreezeHours: (data.streakFreezeHours as number | null) ?? null,
    cosmetic: cosmeticRaw?.id
      ? {
          id: cosmeticRaw.id,
          kind: cosmeticRaw.kind as NonNullable<TrophyRoadClaimResult["cosmetic"]>["kind"],
          name: cosmeticRaw.name,
          imageUrl: cosmeticRaw.imageUrl,
        }
      : null,
    eloBoostUntil: (data.eloBoostUntil as string | null) ?? null,
    streakFreezeUntil: (data.streakFreezeUntil as string | null) ?? null,
    newElo: (data.newElo as number | null) ?? null,
    newCoins: (data.newCoins as number | null) ?? null,
  }
}

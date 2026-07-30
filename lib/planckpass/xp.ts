/** First tier is unlocked for every user without XP; still requires manual claim. */
export const PLANCK_PASS_AUTO_UNLOCK_TIER = 1

export function isPlanckPassTierAutoUnlocked(tierNumber: number): boolean {
  return tierNumber === PLANCK_PASS_AUTO_UNLOCK_TIER
}

/** Default incremental XP to unlock each tier (1-indexed). */
export function defaultXpForTier(tier: number): number {
  if (tier >= 1 && tier <= 5) return 150
  if (tier >= 6 && tier <= 10) return 250
  if (tier >= 11 && tier <= 15) return 350
  if (tier >= 16 && tier <= 20) return 450
  if (tier >= 21 && tier <= 25) return 550
  return 650
}

export function buildDefaultTierXp(): number[] {
  return Array.from({ length: 30 }, (_, i) => defaultXpForTier(i + 1))
}

/** Cumulative XP needed to unlock tier N (inclusive). */
export function cumulativeXpToTier(xpRequiredByTier: number[], tierNumber: number): number {
  let sum = 0
  for (let i = 0; i < tierNumber && i < xpRequiredByTier.length; i++) {
    sum += xpRequiredByTier[i] ?? 0
  }
  return sum
}

/** Highest unlocked tier from total XP (0 if none). */
export function currentTierFromXp(xpTotal: number, xpRequiredByTier: number[]): number {
  let sum = 0
  let tier = 0
  for (let i = 0; i < xpRequiredByTier.length; i++) {
    sum += xpRequiredByTier[i] ?? 0
    if (xpTotal >= sum) tier = i + 1
    else break
  }
  return tier
}

/** XP into the current tier progress bar + xp needed for next tier. */
export function xpBarForProgress(
  xpTotal: number,
  xpRequiredByTier: number[],
): { xpCurrent: number; xpMax: number; currentTier: number } {
  const currentTier = currentTierFromXp(xpTotal, xpRequiredByTier)
  if (currentTier >= xpRequiredByTier.length) {
    const last = xpRequiredByTier[xpRequiredByTier.length - 1] ?? 650
    return { xpCurrent: last, xpMax: last, currentTier }
  }
  const unlockedCum = cumulativeXpToTier(xpRequiredByTier, currentTier)
  const nextCost = xpRequiredByTier[currentTier] ?? 150
  return {
    xpCurrent: Math.max(0, xpTotal - unlockedCum),
    xpMax: nextCost,
    currentTier,
  }
}

export const PLANCKPASS_XP = {
  problemEasy: 40,
  problemMedium: 70,
  problemHard: 110,
  lpInteractive: 35,
  lpItem: 25,
  lpTest: 80,
} as const

export function xpForDifficulty(difficulty: string | null | undefined): number {
  const d = (difficulty ?? "").trim().toLowerCase()
  if (["ușor", "usor", "easy", "inițiere", "initiere"].includes(d)) {
    return PLANCKPASS_XP.problemEasy
  }
  if (["mediu", "medium"].includes(d)) return PLANCKPASS_XP.problemMedium
  if (["avansat", "hard", "difficult", "concurs"].includes(d)) {
    return PLANCKPASS_XP.problemHard
  }
  return PLANCKPASS_XP.problemEasy
}

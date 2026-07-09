/**
 * Maps ELO to an estimated grade (4–10) using the same tier thresholds
 * as get_rank_from_elo in the database.
 */
const ELO_TIER_BOUNDARIES = [
  650, 850, 1050, 1400, 1800, 2300, 3000, 3700, 4500, 5600, 6700, 7900, 9300,
  10800, 12500, 14300, 16200, 18200, 20000,
] as const

export const MIN_GRADE = 4
export const MAX_GRADE = 10

function roundGrade(value: number): number {
  return Math.round(value * 10) / 10
}

export function clampGrade(value: number): number {
  return Math.min(MAX_GRADE, Math.max(MIN_GRADE, roundGrade(value)))
}

export function estimateGradeFromElo(elo: number): number {
  const safeElo = Math.max(0, elo)

  let tierIndex = 0
  while (tierIndex < ELO_TIER_BOUNDARIES.length && safeElo >= ELO_TIER_BOUNDARIES[tierIndex]) {
    tierIndex += 1
  }

  const totalTiers = ELO_TIER_BOUNDARIES.length + 1
  const gradeSpan = MAX_GRADE - MIN_GRADE
  const rawGrade = MIN_GRADE + (tierIndex / totalTiers) * gradeSpan

  if (tierIndex < ELO_TIER_BOUNDARIES.length) {
    const lowerBound = tierIndex === 0 ? 0 : ELO_TIER_BOUNDARIES[tierIndex - 1]
    const upperBound = ELO_TIER_BOUNDARIES[tierIndex]
    const tierProgress = (safeElo - lowerBound) / (upperBound - lowerBound)
    const tierGradeStep = gradeSpan / totalTiers
    const interpolated =
      MIN_GRADE + tierIndex * tierGradeStep + tierProgress * tierGradeStep
    return clampGrade(interpolated)
  }

  return clampGrade(rawGrade)
}

export interface GradeProjectionPoint {
  monthIndex: number
  label: string
  grade: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const MONTH_LABELS = [
  "ian.",
  "feb.",
  "mar.",
  "apr.",
  "mai",
  "iun.",
  "iul.",
  "aug.",
  "sept.",
  "oct.",
  "nov.",
  "dec.",
] as const

function monthLabelFromDate(date: Date, monthOffset: number): string {
  const d = new Date(date.getFullYear(), date.getMonth() + monthOffset, 1)
  return MONTH_LABELS[d.getMonth()] ?? "—"
}

export function buildGradeProjection(
  currentGrade: number,
  targetGrade: number,
  months = 12,
  startDate: Date = new Date(),
): GradeProjectionPoint[] {
  const points: GradeProjectionPoint[] = []

  for (let i = 0; i <= months; i += 1) {
    const t = i / months
    const eased = easeOutCubic(t)
    const grade = currentGrade + (targetGrade - currentGrade) * eased

    points.push({
      monthIndex: i,
      label: i === 0 ? "Azi" : monthLabelFromDate(startDate, i),
      grade: clampGrade(grade),
    })
  }

  return points
}

export function formatGrade(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** Inverse of estimateGradeFromElo — binary search with 0.05 tolerance.
 *
 * NOTE: this spans the full competitive ELO scale (0–25000+, up through
 * Masters/Ascendant/Singularity) and is meant for *estimating* a grade from
 * ELO that a user has actually earned by solving problems over time. Do not
 * use this to seed a brand-new user's starting ELO from a self-reported
 * onboarding grade — that previously caused new accounts to start with
 * multi-thousand ELO (Gold/Platinum/Diamond tiers) just for picking a normal
 * grade like 8 or 9. Use `initialEloFromSelfGrade` for that instead. */
export function eloFromGrade(targetGrade: number): number {
  const goal = clampGrade(targetGrade)
  let low = 0
  let high = 25_000

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (estimateGradeFromElo(mid) < goal) {
      low = mid
    } else {
      high = mid
    }
  }

  const lowDiff = Math.abs(estimateGradeFromElo(low) - goal)
  const highDiff = Math.abs(estimateGradeFromElo(high) - goal)
  return lowDiff <= highDiff ? low : high
}

/**
 * Starting ELO for a brand-new user based on their self-reported onboarding
 * grade (nota, 4–10). Kept within the Bronze/low-Silver band (the same range
 * new users already start in) so onboarding never launches an account
 * straight into Gold/Platinum/Diamond territory.
 */
const INITIAL_ELO_MIN = 400
const INITIAL_ELO_MAX = 950

export function initialEloFromSelfGrade(selfGrade: number): number {
  const grade = clampGrade(selfGrade)
  const progress = (grade - MIN_GRADE) / (MAX_GRADE - MIN_GRADE)
  const elo = INITIAL_ELO_MIN + progress * (INITIAL_ELO_MAX - INITIAL_ELO_MIN)
  return Math.round(elo)
}

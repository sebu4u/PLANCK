import { clampGrade, formatGrade } from "@/lib/parent/grade-estimate"

export type StudentDailyTimeOption = "15" | "30" | "60"

export const SELF_GRADE_MIN = 4
export const SELF_GRADE_MAX = 9.6
export const TARGET_GRADE_MAX = 10
export const TARGET_GRADE_OFFSET = 2

export function roundGradeStep(value: number): number {
  return Math.round(value * 10) / 10
}

export function clampSelfGrade(value: number): number {
  return Math.min(SELF_GRADE_MAX, Math.max(SELF_GRADE_MIN, roundGradeStep(value)))
}

export function getMinTargetGrade(selfGrade: number): number {
  return roundGradeStep(clampGrade(selfGrade + TARGET_GRADE_OFFSET))
}

export function clampTargetGrade(selfGrade: number, targetGrade: number): number {
  const minTarget = getMinTargetGrade(selfGrade)
  const maxTarget = TARGET_GRADE_MAX
  if (minTarget > maxTarget) return maxTarget
  return Math.min(maxTarget, Math.max(minTarget, roundGradeStep(targetGrade)))
}

export function defaultTargetGrade(selfGrade: number): number {
  return clampTargetGrade(selfGrade, getMinTargetGrade(selfGrade))
}

/** e.g. 8.5 → "80–90" */
export function formatGradeZone(grade: number): string {
  const floor = Math.floor(clampGrade(grade))
  const lower = floor * 10
  const upper = (floor + 1) * 10
  return `${lower}–${upper}`
}

export function formatDailyTimeLabel(dailyTime: StudentDailyTimeOption): string {
  switch (dailyTime) {
    case "15":
      return "15 min/zi"
    case "30":
      return "30 min/zi"
    case "60":
      return "60 min/zi"
    default:
      return "30 min/zi"
  }
}

/** ~0.25 grade points/month at 30 min/day, scaled linearly by daily time. */
export function estimatePlanMonths(
  currentGrade: number,
  targetGrade: number,
  dailyMinutes: StudentDailyTimeOption,
): number {
  const gap = Math.max(0, targetGrade - currentGrade)
  if (gap <= 0) return 1

  const minutes = Number.parseInt(dailyMinutes, 10)
  const ratePerMonth = 0.25 * (minutes / 30)
  if (ratePerMonth <= 0) return 12

  return Math.max(1, Math.ceil(gap / ratePerMonth))
}

export function buildPlanSummaryCopy(params: {
  targetGrade: number
  selfGrade: number
  dailyTime: StudentDailyTimeOption
}): { title: string; subtitle: string } {
  const target = formatGrade(params.targetGrade)
  const zone = formatGradeZone(params.selfGrade)
  const months = estimatePlanMonths(params.selfGrade, params.targetGrade, params.dailyTime)
  const dailyLabel = formatDailyTimeLabel(params.dailyTime)

  return {
    title: `Planul tău pentru ${target} e gata`,
    subtitle: `Pornești din zona ${zone} și ai ~${months} luni — ritmul tău de ${dailyLabel} e suficient. Înregistrează-te pentru a-ți salva planul.`,
  }
}

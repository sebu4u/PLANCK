import { getProblemsByClass, toGradeNumber } from "@/lib/supabase-learning-paths"

const MIN_LICEU_GRADE = 9

/**
 * Clasa țintă pentru retenție: cu un an mai mic decât clasa userului (ex. 12 → 11).
 * Pentru clasa 9, rămâne 9 (nu coborâm la gimnaziu în mod implicit).
 */
function getPostContestRetentionTargetGrade(
  userGrade: string | number | null | undefined
): number | null {
  const g = toGradeNumber(userGrade)
  if (g == null) return null
  if (g <= MIN_LICEU_GRADE) return g
  return g - 1
}

export type PostContestRetentionResolution = {
  href: string
  /** Număr de clasă pentru text (ex. "11"), sau null dacă mergem la catalog general */
  targetClassNumber: string | null
}

/**
 * Alege o problemă din clasa anterioară, cu fallback la aceeași clasă, apoi orice problemă, apoi /probleme.
 */
export async function resolvePostContestRetention(
  grade: string
): Promise<PostContestRetentionResolution> {
  const userNum = toGradeNumber(grade)
  const targetNum = getPostContestRetentionTargetGrade(grade)

  let problems = targetNum != null ? await getProblemsByClass(targetNum, 1) : []
  let labelNum: number | null = targetNum

  if (problems.length === 0 && userNum != null) {
    problems = await getProblemsByClass(userNum, 1)
    labelNum = userNum
  }

  if (problems.length === 0) {
    problems = await getProblemsByClass(null, 1)
    labelNum = null
  }

  if (problems.length > 0) {
    return {
      href: `/probleme/${problems[0].id}`,
      targetClassNumber: labelNum != null ? String(labelNum) : null
    }
  }

  return {
    href: "/probleme",
    targetClassNumber: null
  }
}

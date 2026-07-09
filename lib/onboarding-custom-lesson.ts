/**
 * Post-onboarding custom lesson: a hidden learning-path chapter (see migration
 * `20260708_onboarding_custom_lessons.sql`) with lessons tailored to the subject
 * (and, for fizică, the class) picked during onboarding.
 */

export const ONBOARDING_CUSTOM_LESSON_CHAPTER_SLUG = "onboarding-personalizat"

const ONBOARDING_CUSTOM_LESSON_SLUGS = {
  viteza: "viteza",
  gazulIdeal: "gazul-ideal",
  pendulul: "pendulul",
  optica: "optica",
  introducereMatematica: "introducere-matematica-onboarding",
  introducerePython: "introducere-python-onboarding",
} as const

const FIZICA_LESSON_SLUG_BY_GRADE: Record<string, string> = {
  "9": ONBOARDING_CUSTOM_LESSON_SLUGS.viteza,
  "10": ONBOARDING_CUSTOM_LESSON_SLUGS.gazulIdeal,
  "11": ONBOARDING_CUSTOM_LESSON_SLUGS.pendulul,
  "12": ONBOARDING_CUSTOM_LESSON_SLUGS.optica,
}

/**
 * Resolve which onboarding custom lesson slug applies for a given subject + class.
 * - fizică: per-class lesson (defaults to "viteza" for an unknown/missing class).
 * - matematică / informatică: a single intro lesson regardless of class.
 * - biologie (and anything else): redirects to the fizică clasa 9 lesson ("viteza").
 */
export function getOnboardingCustomLessonSlug(
  subject: unknown,
  grade?: unknown,
): string {
  if (subject === "matematica") return ONBOARDING_CUSTOM_LESSON_SLUGS.introducereMatematica
  if (subject === "informatica") return ONBOARDING_CUSTOM_LESSON_SLUGS.introducerePython

  if (subject === "fizica") {
    const gradeKey = typeof grade === "string" ? grade : String(grade ?? "")
    return FIZICA_LESSON_SLUG_BY_GRADE[gradeKey] ?? ONBOARDING_CUSTOM_LESSON_SLUGS.viteza
  }

  // biologie and any other/unknown subject
  return ONBOARDING_CUSTOM_LESSON_SLUGS.viteza
}

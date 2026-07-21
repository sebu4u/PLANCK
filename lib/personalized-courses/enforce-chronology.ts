import type {
  PersonalizedCourseCatalogCandidate,
  PersonalizedCourseGeneratedPlan,
  PersonalizedCourseGeneratedPlanItem,
} from "@/lib/personalized-courses/types"

function metaNumber(metadata: Record<string, unknown> | undefined, key: string): number {
  const value = metadata?.[key]
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function sourceChronologyKey(
  candidate: PersonalizedCourseCatalogCandidate | undefined,
): [number, number, number] {
  if (!candidate) return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
  const meta = candidate.metadata
  return [
    metaNumber(meta, "chapter_order_index"),
    metaNumber(meta, "lesson_order_index"),
    metaNumber(meta, "item_order_index"),
  ]
}

function compareChronology(
  a: PersonalizedCourseCatalogCandidate | undefined,
  b: PersonalizedCourseCatalogCandidate | undefined,
): number {
  const ka = sourceChronologyKey(a)
  const kb = sourceChronologyKey(b)
  for (let i = 0; i < 3; i += 1) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i]
  }
  return (a?.title ?? "").localeCompare(b?.title ?? "")
}

/**
 * Reorder reused (source_key) items within each lesson so their relative order
 * matches the original catalog chronology (chapter → lesson → item order_index).
 * Generated items keep their positions as "glue" between source slots.
 */
export function enforceSourceChronology(
  plan: PersonalizedCourseGeneratedPlan,
  candidatesByKey: Map<string, PersonalizedCourseCatalogCandidate>,
): PersonalizedCourseGeneratedPlan {
  const lessons = plan.lessons.map((lesson) => {
    const items = lesson.items
    const sourceSlots: number[] = []
    const sourced: PersonalizedCourseGeneratedPlanItem[] = []

    for (let i = 0; i < items.length; i += 1) {
      const key = items[i].source_key?.trim()
      if (key) {
        sourceSlots.push(i)
        sourced.push(items[i])
      }
    }

    if (sourced.length < 2) return lesson

    sourced.sort((a, b) =>
      compareChronology(
        candidatesByKey.get(a.source_key!.trim()),
        candidatesByKey.get(b.source_key!.trim()),
      ),
    )

    const next = items.slice()
    for (let i = 0; i < sourceSlots.length; i += 1) {
      next[sourceSlots[i]] = sourced[i]
    }
    return { ...lesson, items: next }
  })

  return { ...plan, lessons }
}

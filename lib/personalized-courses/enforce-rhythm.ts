import type {
  PersonalizedCourseGeneratedPlan,
  PersonalizedCourseGeneratedPlanItem,
} from "@/lib/personalized-courses/types"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"

const TEACHING_TYPES = new Set<LearningPathLessonType>(["custom_text", "text", "video"])

const INTERACTIVE_CHECK_TYPES = new Set<LearningPathLessonType>([
  "poll",
  "match",
  "card_sort",
  "fill_slot",
  "reveal_steps",
  "table_fill",
  "swipe_classify",
  "memory_flip",
  "code_trace",
  "grila",
  "problem",
  "math_problem",
  "coding_problem",
  "simulation",
])

const MAX_ITEMS_PER_LESSON = 30
const TARGET_CHECKS_AFTER_TEACHING = 2

function isTeachingItem(item: PersonalizedCourseGeneratedPlanItem): boolean {
  return TEACHING_TYPES.has(item.item_type)
}

function isInteractiveCheck(item: PersonalizedCourseGeneratedPlanItem): boolean {
  return INTERACTIVE_CHECK_TYPES.has(item.item_type)
}

function isFinalTest(item: PersonalizedCourseGeneratedPlanItem): boolean {
  return item.item_type === "test"
}

function makeIntroCustomText(
  lessonTitle: string,
  userPrompt: string,
): PersonalizedCourseGeneratedPlanItem {
  return {
    title: `Introducere: ${lessonTitle}`.slice(0, 120),
    item_type: "custom_text",
    source_key: null,
    content_json: {
      body: [
        `## ${lessonTitle}`,
        "",
        `În această lecție construim fundamentele pentru obiectivul tău: **${userPrompt}**.`,
        "",
        "Citește cu atenție ideile de mai jos — imediat după explicație vei verifica ce ai înțeles prin exerciții interactive.",
        "",
        "[IMPORTANT]Nu trece la verificări înainte să citești explicația.[/IMPORTANT]",
      ].join("\n"),
    },
  }
}

function makePlaceholderPoll(
  index: number,
  priorTitle: string,
  userPrompt: string,
): PersonalizedCourseGeneratedPlanItem {
  const n = index + 1
  return {
    title: `Verificare: ${priorTitle}`.slice(0, 120),
    item_type: "poll",
    source_key: null,
    content_json: {
      imageSrc: "",
      imageAlt: "",
      question: `Care afirmație despre „${priorTitle}” este corectă în contextul obiectivului „${userPrompt}"?`,
      correctAnswerId: "a",
      options: [
        {
          id: "a",
          label: `Ideea centrală din „${priorTitle}” este esențială pentru obiectiv.`,
          feedback: "Corect — verificarea reia ce s-a predat imediat înainte.",
        },
        {
          id: "b",
          label: "Putem ignora explicația anterioară și să inventăm un concept nou.",
          feedback: "Incorect — verificările trebuie să testeze doar ce s-a predat.",
        },
        {
          id: "c",
          label: `„${priorTitle}” nu are legătură cu obiectivul.`,
          feedback: "Incorect — totul din lecție sprijină obiectivul.",
        },
        {
          id: "d",
          label: `Varianta ${n}: informație din afara lecției.`,
          feedback: "Incorect — nu introducem noțiuni netratate.",
        },
      ],
      _needs_fidelity_rewrite: true,
    },
  }
}

/**
 * Enforce teaching rhythm:
 * - first item is always custom_text
 * - after a teaching block, ensure 1–3 interactive checks before the next teaching block
 * - 2–3 consecutive custom_text items are allowed
 * - final test without a preceding text is OK
 */
export function enforceTeachingRhythm(
  plan: PersonalizedCourseGeneratedPlan,
  userPrompt: string,
): PersonalizedCourseGeneratedPlan {
  const lessons = plan.lessons.map((lesson) => {
    let items = lesson.items.slice(0, MAX_ITEMS_PER_LESSON)

    // Ensure first item is custom_text (generated or sourced).
    if (!items.length || items[0].item_type !== "custom_text") {
      items = [makeIntroCustomText(lesson.title, userPrompt), ...items].slice(
        0,
        MAX_ITEMS_PER_LESSON,
      )
    }

    const result: PersonalizedCourseGeneratedPlanItem[] = []
    let pendingTeachingTitle: string | null = null
    let checksAfterTeaching = 0
    let consecutiveTeaching = 0

    const flushNeededChecks = () => {
      if (!pendingTeachingTitle) return
      if (checksAfterTeaching >= 1) {
        pendingTeachingTitle = null
        checksAfterTeaching = 0
        return
      }
      const toAdd = Math.min(
        TARGET_CHECKS_AFTER_TEACHING - checksAfterTeaching,
        MAX_ITEMS_PER_LESSON - result.length,
      )
      for (let i = 0; i < toAdd; i += 1) {
        result.push(makePlaceholderPoll(i, pendingTeachingTitle, userPrompt))
      }
      pendingTeachingTitle = null
      checksAfterTeaching = 0
    }

    for (let i = 0; i < items.length; i += 1) {
      if (result.length >= MAX_ITEMS_PER_LESSON) break
      const item = items[i]
      const isLast = i === items.length - 1

      if (isTeachingItem(item)) {
        // Starting a new teaching block while previous had zero checks → insert checks first
        // (unless we're still in a consecutive custom_text run of 2–3).
        if (pendingTeachingTitle && checksAfterTeaching === 0 && consecutiveTeaching >= 3) {
          flushNeededChecks()
          if (result.length >= MAX_ITEMS_PER_LESSON) break
        }

        result.push(item)
        pendingTeachingTitle = item.title
        consecutiveTeaching += 1
        checksAfterTeaching = 0
        continue
      }

      consecutiveTeaching = 0

      if (isFinalTest(item) && isLast) {
        // Final test may follow without an immediate teaching item.
        if (pendingTeachingTitle && checksAfterTeaching === 0) {
          flushNeededChecks()
          if (result.length >= MAX_ITEMS_PER_LESSON) break
        }
        result.push(item)
        pendingTeachingTitle = null
        checksAfterTeaching = 0
        continue
      }

      if (isInteractiveCheck(item)) {
        result.push(item)
        if (pendingTeachingTitle) {
          checksAfterTeaching += 1
          if (checksAfterTeaching >= 3) {
            pendingTeachingTitle = null
            checksAfterTeaching = 0
          }
        }
        continue
      }

      // Other types (simulation, etc.): treat as neutral; still flush if we had zero checks.
      if (pendingTeachingTitle && checksAfterTeaching === 0) {
        flushNeededChecks()
        if (result.length >= MAX_ITEMS_PER_LESSON) break
      }
      result.push(item)
    }

    if (pendingTeachingTitle && checksAfterTeaching === 0) {
      flushNeededChecks()
    }

    return { ...lesson, items: result.slice(0, MAX_ITEMS_PER_LESSON) }
  })

  return { ...plan, lessons }
}

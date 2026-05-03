import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Problem } from "@/data/problems"
import { Navigation } from "@/components/navigation"
import { LessonItemShell } from "@/components/invata/lesson-item-shell"
import { LearningPathLessonLockedPreview } from "@/components/invata/learning-path-lesson-locked-preview"
import { FreePlanComparisonScreen } from "@/components/invata/free-plan-comparison-screen"
import { supabase } from "@/lib/supabaseClient"
import { fetchQuizQuestionById } from "@/lib/supabase-quiz"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import { createClient } from "@/lib/supabase/server"
import {
  ITEM_TYPE_LABEL,
  LearningPathItemBody,
  getItemIcon,
} from "@/components/invata/learning-path-item-body"
import { ProblemSection } from "@/components/invata/problem-section"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import {
  getLearningPathLessonHref,
  getLearningPathChapterById,
  getLearningPathChapterBySlug,
  getLearningPathLessonById,
  getLearningPathLessonBySlug,
  getLearningPathLessonItems,
  getCompletedLearningPathItemIdsForUser,
  isUuid,
} from "@/lib/supabase-learning-paths"
import { getLessonBySlug } from "@/lib/supabase-physics"

export const revalidate = 21600

async function resolveLessonContext(chapterSlug: string, lessonSlug: string) {
  const chapter = isUuid(chapterSlug)
    ? await getLearningPathChapterById(chapterSlug)
    : await getLearningPathChapterBySlug(chapterSlug)

  if (!chapter) return { chapter: null, lesson: null }

  const lesson = isUuid(lessonSlug)
    ? await getLearningPathLessonById(lessonSlug)
    : await getLearningPathLessonBySlug(chapterSlug, lessonSlug)

  if (!lesson || lesson.chapter_id !== chapter.id) {
    return { chapter: null, lesson: null }
  }

  return { chapter, lesson }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string; itemIndex: string }>
}): Promise<Metadata> {
  const { chapterSlug, lessonSlug, itemIndex } = await params
  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug)

  if (!chapter || !lesson) {
    return generatePageMetadata("learning-paths")
  }

  const access = await getLearningPathAccess(chapter)
  if (access.mode === "locked") {
    return generatePageMetadata("learning-paths")
  }

  const items = await getLearningPathLessonItems(lesson.id)
  const parsedIndex = Number.parseInt(itemIndex, 10)
  const item = Number.isFinite(parsedIndex) ? items[parsedIndex - 1] : null

  if (!item) {
    return generatePageMetadata("learning-paths")
  }

  return {
    title: `${item.title || ITEM_TYPE_LABEL[item.item_type]} | ${lesson.title} | PLANCK`,
    description: lesson.description || `Item din lecția ${lesson.title}.`,
    alternates: {
      canonical: `/invata/${chapterSlug}/${lessonSlug}/${itemIndex}`,
    },
  }
}

export default async function InvataLessonItemPage({
  params,
}: {
  params: Promise<{ chapterSlug: string; lessonSlug: string; itemIndex: string }>
}) {
  const { chapterSlug, lessonSlug, itemIndex } = await params
  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug)

  if (!chapter || !lesson) {
    notFound()
  }

  const parsedIndex = Number.parseInt(itemIndex, 10)
  if (!Number.isFinite(parsedIndex) || parsedIndex < 1) {
    notFound()
  }

  const access = await getLearningPathAccess(chapter)

  if (access.mode === "locked") {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#ffffff]">
          <LearningPathLessonLockedPreview chapter={chapter} lesson={lesson} />
        </main>
      </>
    )
  }

  const items = await getLearningPathLessonItems(lesson.id)
  const item = items[parsedIndex - 1]

  if (!item) {
    notFound()
  }

  const lessonBaseHref = getLearningPathLessonHref(chapter, lesson)

  let initialCurrentItemCompleted = false
  let completedItemIdsForLesson: string[] = []
  const supabaseForProgress = await createClient()
  const {
    data: { user: progressUser },
  } = await supabaseForProgress.auth.getUser()
  if (progressUser) {
    completedItemIdsForLesson = await getCompletedLearningPathItemIdsForUser(
      supabaseForProgress,
      progressUser.id,
      items.map((i) => i.id)
    )
    initialCurrentItemCompleted = completedItemIdsForLesson.includes(item.id)
  }

  if (access.mode === "free-preview") {
    const completedSet = new Set(completedItemIdsForLesson)
    const nextItemId = items.find((i) => !completedSet.has(i.id))?.id ?? items[0]?.id ?? null
    const isCurrentItemNext = item.id === nextItemId
    const isCurrentItemCompleted = initialCurrentItemCompleted

    if (!isCurrentItemCompleted) {
      const blockedBySkip = !isCurrentItemNext
      const blockedByLimit = isCurrentItemNext && access.itemsRemaining <= 0

      if (blockedBySkip || blockedByLimit) {
        return (
          <>
            <Navigation />
            <main className="min-h-screen bg-[#ffffff]">
              <FreePlanComparisonScreen backHref={lessonBaseHref} />
            </main>
          </>
        )
      }
    }
  }

  const isLinkedTextItem = item.item_type === "text"
  const isCustomTextItem = item.item_type === "custom_text"
  const sourceLesson =
    isLinkedTextItem && item.cursuri_lesson_slug ? await getLessonBySlug(item.cursuri_lesson_slug) : null
  let sourceProblem: Problem | null = null
  if (item.item_type === "problem" && item.problem_id) {
    const { data } = await supabase.from("problems").select("*").eq("id", item.problem_id).single()
    sourceProblem = data as Problem | null
  }

  const sourceQuizQuestion =
    item.item_type === "grila" && item.quiz_question_id
      ? await fetchQuizQuestionById(item.quiz_question_id)
      : null
  const ItemIcon = getItemIcon(item.item_type)
  const nextItemHref =
    parsedIndex < items.length ? `${lessonBaseHref}/${parsedIndex + 1}` : lessonBaseHref

  const isPoll = item.item_type === "poll"
  const isProblem = item.item_type === "problem" && !!sourceProblem
  const isSimulation = item.item_type === "simulation"
  const isTest = item.item_type === "test"
  const problemHasAnswer =
    sourceProblem &&
    (sourceProblem.answer_type === "value" || sourceProblem.answer_type === "grila")

  return (
    <LessonItemShell
      chapterSlug={chapter.slug ?? chapter.id}
      lessonSlug={lesson.slug ?? lesson.id}
      itemIndex={parsedIndex}
      items={items}
      lessonId={lesson.id}
      currentItemId={item.id}
      initialCurrentItemCompleted={initialCurrentItemCompleted}
      lessonBaseHref={lessonBaseHref}
      isTextLesson={isLinkedTextItem || isCustomTextItem}
      hideBottomCta={isPoll || isTest || (isProblem && !!problemHasAnswer)}
      overflowHidden={isProblem}
      fullWidth={isProblem}
      grilaQuestion={item.item_type === "grila" ? sourceQuizQuestion : undefined}
    >
      {isTest ? (
        <div className="py-4 sm:py-6">
          <LearningPathItemBody
            item={item}
            sourceLesson={sourceLesson}
            sourceProblem={sourceProblem}
            sourceQuizQuestion={sourceQuizQuestion}
            nextItemHref={nextItemHref}
            lessonId={lesson.id}
            isLastItem={parsedIndex >= items.length}
          />
        </div>
      ) : isPoll ? (
        <LearningPathItemBody
          item={item}
          sourceLesson={sourceLesson}
          sourceProblem={sourceProblem}
          sourceQuizQuestion={sourceQuizQuestion}
          nextItemHref={nextItemHref}
          lessonId={lesson.id}
          isLastItem={parsedIndex >= items.length}
        />
      ) : isProblem && sourceProblem ? (
        <ProblemSection
          problem={sourceProblem}
          nextItemHref={nextItemHref}
          itemIndex={parsedIndex}
          lessonId={lesson.id}
          currentItemId={item.id}
          isLastItem={parsedIndex >= items.length}
        />
      ) : isCustomTextItem ? (
        <div className="flex min-h-[calc(100svh-3.5rem-6.5rem)] w-full flex-col justify-center py-6 sm:py-10">
          <LearningPathItemBody
            item={item}
            sourceLesson={sourceLesson}
            sourceProblem={sourceProblem}
            sourceQuizQuestion={sourceQuizQuestion}
            nextItemHref={nextItemHref}
            lessonId={lesson.id}
            isLastItem={parsedIndex >= items.length}
          />
        </div>
      ) : item.item_type === "grila" ? (
        <div className="flex min-h-[calc(100svh-3.5rem-6.5rem)] w-full flex-col items-center justify-center py-6 sm:py-10">
          <div className="w-full max-w-3xl">
            <LearningPathItemBody
              item={item}
              sourceLesson={sourceLesson}
              sourceProblem={sourceProblem}
              sourceQuizQuestion={sourceQuizQuestion}
              nextItemHref={nextItemHref}
              lessonId={lesson.id}
              isLastItem={parsedIndex >= items.length}
            />
          </div>
        </div>
      ) : isSimulation ? (
        <section className="flex min-h-[calc(100svh-3.5rem-6.5rem)] w-full flex-col items-center justify-center py-6 sm:py-10">
          <LearningPathItemBody
            item={item}
            sourceLesson={sourceLesson}
            sourceProblem={sourceProblem}
            sourceQuizQuestion={sourceQuizQuestion}
            nextItemHref={nextItemHref}
            lessonId={lesson.id}
            isLastItem={parsedIndex >= items.length}
          />
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-[30px] border border-[#ebe4f1] bg-white shadow-[0_18px_50px_rgba(76,44,114,0.08)]">
          <header className="border-b border-[#eee7f3] bg-[linear-gradient(180deg,#fcfbfe_0%,#f7f4fb_100%)] px-5 py-5 sm:px-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_8px_16px_rgba(124,58,237,0.24)]">
                <ItemIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6fac]">
                  Pasul {parsedIndex} din {items.length}
                </p>
                <h1 className="mt-2 text-2xl font-bold leading-tight text-[#111111] sm:text-3xl">
                  {item.title || (sourceProblem?.title ?? ITEM_TYPE_LABEL[item.item_type])}
                </h1>
                <p className="mt-2 text-sm text-[#6f657b]">
                  {ITEM_TYPE_LABEL[item.item_type]} din lecția {lesson.title}
                </p>
              </div>
            </div>
          </header>

          <div className="px-5 py-6 sm:px-7">
            <LearningPathItemBody
              item={item}
              sourceLesson={sourceLesson}
              sourceProblem={sourceProblem}
              sourceQuizQuestion={sourceQuizQuestion}
              nextItemHref={nextItemHref}
              lessonId={lesson.id}
              isLastItem={parsedIndex >= items.length}
            />
          </div>
        </section>
      )}
    </LessonItemShell>
  )
}

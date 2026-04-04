import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Problem } from "@/data/problems"
import { Navigation } from "@/components/navigation"
import { LessonItemShell } from "@/components/invata/lesson-item-shell"
import { LearningPathLessonLockedPreview } from "@/components/invata/learning-path-lesson-locked-preview"
import { supabase } from "@/lib/supabaseClient"
import { fetchQuizQuestionById } from "@/lib/supabase-quiz"
import { canViewLearningPathContent } from "@/lib/learning-path-access"
import {
  ITEM_TYPE_LABEL,
  LearningPathItemBody,
  getItemIcon,
} from "@/components/invata/learning-path-item-body"
import { MarkLearningPathLessonProgress } from "@/components/invata/mark-learning-path-lesson-progress"
import { ProblemSection } from "@/components/invata/problem-section"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import {
  getLearningPathChapterById,
  getLearningPathChapterBySlug,
  getLearningPathLessonById,
  getLearningPathLessonBySlug,
  getLearningPathLessonItems,
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
  const canViewLearningPathsContent = await canViewLearningPathContent()
  if (!canViewLearningPathsContent) {
    return generatePageMetadata("learning-paths")
  }

  const { chapterSlug, lessonSlug, itemIndex } = await params
  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug)

  if (!chapter || !lesson) {
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
  const canViewLearningPathsContent = await canViewLearningPathContent()
  const { chapterSlug, lessonSlug, itemIndex } = await params
  const { chapter, lesson } = await resolveLessonContext(chapterSlug, lessonSlug)

  if (!chapter || !lesson) {
    notFound()
  }

  const parsedIndex = Number.parseInt(itemIndex, 10)
  if (!Number.isFinite(parsedIndex) || parsedIndex < 1) {
    notFound()
  }

  if (!canViewLearningPathsContent) {
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
  const lessonBaseHref = `/invata/${chapter.slug ?? chapter.id}/${lesson.slug ?? lesson.id}`
  const nextItemHref =
    parsedIndex < items.length ? `${lessonBaseHref}/${parsedIndex + 1}` : lessonBaseHref

  const isPoll = item.item_type === "poll"
  const isProblem = item.item_type === "problem" && !!sourceProblem
  const isSimulation = item.item_type === "simulation"
  const problemHasAnswer =
    sourceProblem &&
    (sourceProblem.answer_type === "value" || sourceProblem.answer_type === "grila")

  return (
    <LessonItemShell
      chapterSlug={chapter.slug ?? chapter.id}
      lessonSlug={lesson.slug ?? lesson.id}
      itemIndex={parsedIndex}
      items={items}
      lessonBaseHref={lessonBaseHref}
      isTextLesson={isLinkedTextItem || isCustomTextItem}
      hideBottomCta={isPoll || (isProblem && !!problemHasAnswer)}
      overflowHidden={isProblem}
      fullWidth={isProblem}
      grilaQuestion={item.item_type === "grila" ? sourceQuizQuestion : undefined}
    >
      {items.length > 0 && parsedIndex === items.length ? (
        <MarkLearningPathLessonProgress lessonId={lesson.id} />
      ) : null}
      {isPoll ? (
        <LearningPathItemBody
          item={item}
          sourceLesson={sourceLesson}
          sourceProblem={sourceProblem}
          sourceQuizQuestion={sourceQuizQuestion}
          nextItemHref={nextItemHref}
        />
      ) : isProblem && sourceProblem ? (
        <ProblemSection problem={sourceProblem} nextItemHref={nextItemHref} itemIndex={parsedIndex} />
      ) : isCustomTextItem ? (
        <div className="flex min-h-[calc(100svh-3.5rem-6.5rem)] w-full flex-col justify-center py-6 sm:py-10">
          <LearningPathItemBody
            item={item}
            sourceLesson={sourceLesson}
            sourceProblem={sourceProblem}
            sourceQuizQuestion={sourceQuizQuestion}
            nextItemHref={nextItemHref}
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
            />
          </div>
        </div>
      ) : isSimulation ? (
        <section className="mt-4 sm:mt-6 sm:overflow-hidden sm:rounded-[30px] sm:border sm:border-[#ebe4f1] sm:bg-white sm:shadow-[0_18px_50px_rgba(76,44,114,0.08)]">
          <header className="px-1 pb-3 sm:border-b sm:border-[#eee7f3] sm:bg-[linear-gradient(180deg,#fcfbfe_0%,#f7f4fb_100%)] sm:px-7 sm:py-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_6px_12px_rgba(124,58,237,0.24)] sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-[0_8px_16px_rgba(124,58,237,0.24)]">
                <ItemIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b6fac] sm:text-xs sm:tracking-[0.18em]">
                  Pasul {parsedIndex} din {items.length}
                </p>
                <h1 className="mt-1.5 text-xl font-bold leading-tight text-[#111111] sm:mt-2 sm:text-3xl">
                  {item.title || ITEM_TYPE_LABEL[item.item_type]}
                </h1>
                <p className="mt-1.5 text-xs text-[#6f657b] sm:mt-2 sm:text-sm">
                  {ITEM_TYPE_LABEL[item.item_type]} din lecția {lesson.title}
                </p>
              </div>
            </div>
          </header>

          <div className="px-0 py-0 sm:px-7 sm:py-6">
            <LearningPathItemBody
              item={item}
              sourceLesson={sourceLesson}
              sourceProblem={sourceProblem}
              sourceQuizQuestion={sourceQuizQuestion}
              nextItemHref={nextItemHref}
            />
          </div>
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
            />
          </div>
        </section>
      )}
    </LessonItemShell>
  )
}

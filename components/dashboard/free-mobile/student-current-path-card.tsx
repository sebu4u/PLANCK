"use client"

import { type CSSProperties, type MouseEvent, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Circle, Loader2, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { getLearningPathChapterTheme } from "@/lib/learning-path-chapter-theme"
import {
  getCompletedLearningPathItemIdsForUser,
  getLearningPathLessonItemAggregates,
  getLearningPathLessonsByChapterId,
  type LearningPathChapter,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"
import { withDashboardItemReturn } from "@/lib/learning-path-item-return"
import { LessonItemProgressBar } from "@/components/invata/lesson-item-progress-bar"
import { DashboardDetailOverlay } from "@/components/dashboard/free-mobile/dashboard-detail-overlay"

interface StudentCurrentPathCardProps {
  userId: string
  chapter: LearningPathChapter
  level: number
  hasStarted: boolean
  resumeHref: string
  lessonProgress?: { completed: number; total: number }
  currentLessonTitle?: string | null
  /** Remaining items in the free-plan global quota; null while loading. */
  freeItemsRemaining?: number | null
}

interface DetailLessonRow {
  id: string
  title: string
  completed: number
  total: number
  isCompleted: boolean
}

export function StudentCurrentPathCard({
  userId,
  chapter,
  level,
  hasStarted,
  resumeHref,
  lessonProgress,
  currentLessonTitle,
  freeItemsRemaining,
}: StudentCurrentPathCardProps) {
  const router = useRouter()
  const [detailOpen, setDetailOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [detailLessons, setDetailLessons] = useState<DetailLessonRow[] | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const theme = getLearningPathChapterTheme(chapter.accent_color)
  const progress = lessonProgress ?? { completed: 0, total: 0 }

  const loadDetail = useCallback(async () => {
    if (detailLessons || detailLoading) return
    setDetailLoading(true)
    try {
      const lessons = await getLearningPathLessonsByChapterId(chapter.id)
      const lessonIds = lessons.map((lesson: LearningPathLesson) => lesson.id)
      const { counts, itemIdsByLessonId } = await getLearningPathLessonItemAggregates(lessonIds)
      const allItemIds = Object.values(itemIdsByLessonId).flat()
      const completedItemIds = new Set(
        await getCompletedLearningPathItemIdsForUser(supabase, userId, allItemIds),
      )

      const rows: DetailLessonRow[] = lessons.map((lesson: LearningPathLesson) => {
        const total = counts[lesson.id] ?? 0
        const itemIds = itemIdsByLessonId[lesson.id] ?? []
        const completed = itemIds.filter((id) => completedItemIds.has(id)).length
        return {
          id: lesson.id,
          title: lesson.title,
          completed,
          total,
          isCompleted: total > 0 && completed >= total,
        }
      })

      setDetailLessons(rows)
    } catch (error) {
      console.error("[StudentCurrentPathCard] Failed to load chapter detail:", error)
      setDetailLessons([])
    } finally {
      setDetailLoading(false)
    }
  }, [chapter.id, detailLessons, detailLoading, userId])

  useEffect(() => {
    if (detailOpen) void loadDetail()
  }, [detailOpen, loadDetail])

  const handleCardClick = () => setDetailOpen(true)

  const handleCta = (event: MouseEvent) => {
    event.stopPropagation()
    if (isNavigating) return
    setIsNavigating(true)
    router.push(withDashboardItemReturn(resumeHref))
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleCardClick()
          }
        }}
        className="w-full cursor-pointer rounded-3xl border-2 border-[#e5e5e5] bg-white p-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9aa0b4]">
              {hasStarted ? "Traseul tău curent" : "Traseu recomandat"}
            </p>
            <h3 className="mt-0.5 truncate text-lg font-bold text-[#111111]">{chapter.title}</h3>
            {currentLessonTitle ? (
              <p className="mt-0.5 truncate text-sm text-[#6b7280]">{currentLessonTitle}</p>
            ) : null}
          </div>
          {chapter.icon_url ? (
            <img
              src={chapter.icon_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-2xl object-contain"
              loading="lazy"
              draggable={false}
            />
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#6b7280]">
          <span>Nivel {level}</span>
          <span className="text-[#d0d0d0]">•</span>
          <span>
            {progress.total > 0 ? `${progress.completed}/${progress.total} lecție` : "Lecție nouă"}
          </span>
          {typeof freeItemsRemaining === "number" ? (
            <>
              <span className="text-[#d0d0d0]">•</span>
              <span className="font-semibold" style={{ color: theme.accent }}>
                {freeItemsRemaining} lecții gratuite rămase
              </span>
            </>
          ) : null}
        </div>
        <LessonItemProgressBar completed={progress.completed} total={progress.total} className="mt-2" />

        <button
          type="button"
          aria-busy={isNavigating}
          onClick={handleCta}
          className={cn(
            "dashboard-start-glow mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_var(--lp-accent-dark)] transition-[transform,box-shadow,opacity] active:translate-y-0.5 active:shadow-[0_2px_0_var(--lp-accent-dark)]",
            isNavigating && "pointer-events-none opacity-70",
          )}
          style={
            {
              "--lp-accent-light": theme.accentLight,
              "--lp-accent": theme.accent,
              "--lp-accent-dark": theme.accentDark,
              backgroundImage: "linear-gradient(to right, var(--lp-accent-light), var(--lp-accent))",
            } as CSSProperties
          }
        >
          <span className="relative z-[1] inline-flex items-center justify-center gap-2">
            {isNavigating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <>
                {hasStarted ? "Continuă" : "Start"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
      </div>

      <DashboardDetailOverlay open={detailOpen} onClose={() => setDetailOpen(false)} title={chapter.title}>
        {detailLoading || !detailLessons ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#9a9a9a]" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {detailLessons.map((lesson) => (
              <div
                key={lesson.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                  lesson.isCompleted
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-[#ececec] bg-[#fafafa]",
                )}
              >
                {lesson.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : lesson.completed > 0 ? (
                  <PlayCircle className="h-5 w-5 shrink-0 text-[#6e4ef2]" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-[#c9c9c9]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#2a2a2a]">{lesson.title}</p>
                  <LessonItemProgressBar completed={lesson.completed} total={lesson.total} className="mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardDetailOverlay>
    </>
  )
}

"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react"
import Link from "next/link"
import { BookOpen, ChevronDown, Loader2, Lock, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getLearningPathLessonHref } from "@/lib/learning-path-routes"
import { cn } from "@/lib/utils"
import type {
  LearningPathHubChapter,
  LearningPathHubLesson,
} from "@/lib/supabase-learning-paths"
import type { ElasticLessonsScrollerProps } from "@/components/invata/elastic-lessons-scroller"
import { GUEST_LEARNING_PATH_PROGRESS_COOKIE } from "@/lib/guest-learning-path-cookie"
import { dispatchInvataHubRefresh, INVATA_HUB_REFRESH_EVENT } from "@/lib/invata/hub-events"
import { LearningPathSegmentedProgress } from "@/components/invata/learning-path-segmented-progress"
import { InvataMobileLessonList } from "@/components/invata/invata-mobile-lesson-card"
import {
  INVATA_HUB_CHAPTER_IMAGE_Z,
  INVATA_HUB_LESSON_CARDS_Z,
} from "@/components/invata/invata-hub-layout-constants"
import { invataChapterSectionDomId } from "@/lib/invata/chapter-section-dom"
import {
  InvataDeferredImage,
  useInvataChapterImagesEnabled,
  useRegisterInvataChapterSection,
} from "@/components/invata/invata-chapter-image-load-context"
import { useSetInvataHubChapters } from "@/components/invata/invata-hub-nav-context"

export type LessonProgressByLessonId = Record<string, { completed: number; total: number }>

interface LearningPathsListProps {
  chapters: LearningPathHubChapter[]
  archivedChapters?: LearningPathHubChapter[]
  lessonsByChapter: Record<string, LearningPathHubLesson[]>
  lockedChapterIds?: string[]
  completedLessonIds?: string[]
  lessonProgressByLessonId?: LessonProgressByLessonId
}

type HubProgressResponse = {
  completedLessonIds?: string[]
  lessonProgressByLessonId?: LessonProgressByLessonId
  error?: string
}

type HubSessionResponse = {
  chapters?: LearningPathHubChapter[]
  archivedChapters?: LearningPathHubChapter[]
  lessonsByChapter?: Record<string, LearningPathHubLesson[]>
  lockedChapterIds?: string[]
  lessonProgressByLessonId?: LessonProgressByLessonId
  error?: string
}

function hasGuestLearningPathProgressCookie() {
  if (typeof document === "undefined") return false
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${GUEST_LEARNING_PATH_PROGRESS_COOKIE}=`))
}

function useShouldLoadMediaQuery(mediaQueryText: string) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad || typeof window === "undefined") return

    const mediaQuery = window.matchMedia(mediaQueryText)
    if (mediaQuery.matches) {
      setShouldLoad(true)
      return
    }

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setShouldLoad(true)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [mediaQueryText, shouldLoad])

  return shouldLoad
}

function useShouldEnhanceDesktopScroller() {
  return useShouldLoadMediaQuery("(min-width: 640px)")
}

function useShouldLoadDesktopChapterIndicator() {
  return useShouldLoadMediaQuery("(min-width: 1024px)")
}

type ElasticScrollerComponent = ComponentType<ElasticLessonsScrollerProps>
type ChapterSectionIndicatorComponent = ComponentType<{ chapterIds: string[] }>

function LazyInvataChapterSectionIndicator({
  chapterIds,
  enabled,
}: {
  chapterIds: string[]
  enabled: boolean
}) {
  const [Indicator, setIndicator] = useState<ChapterSectionIndicatorComponent | null>(null)

  useEffect(() => {
    if (!enabled || Indicator) return

    let cancelled = false
    void import("@/components/invata/invata-chapter-section-indicator").then((mod) => {
      if (!cancelled) {
        setIndicator(() => mod.InvataChapterSectionIndicator)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enabled, Indicator])

  if (!Indicator) return null

  return <Indicator chapterIds={chapterIds} />
}

interface LazyElasticLessonsScrollerProps extends ElasticLessonsScrollerProps {
  enabled: boolean
}

function LazyElasticLessonsScroller({
  children,
  bleedMargins = true,
  enabled,
}: LazyElasticLessonsScrollerProps) {
  const [Scroller, setScroller] = useState<ElasticScrollerComponent | null>(null)

  useEffect(() => {
    if (!enabled || Scroller) return

    let cancelled = false
    void import("@/components/invata/elastic-lessons-scroller").then((mod) => {
      if (!cancelled) {
        setScroller(() => mod.ElasticLessonsScroller)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enabled, Scroller])

  if (Scroller) {
    return <Scroller bleedMargins={bleedMargins}>{children}</Scroller>
  }

  return (
    <div className="relative">
      <div
        className={
          bleedMargins
            ? "-mx-5 overflow-x-auto scrollbar-hide px-5 pb-2 sm:mx-0 sm:px-0"
            : "overflow-x-auto scrollbar-hide px-5 pb-2"
        }
      >
        <div
          className={`flex min-w-max items-start gap-4 sm:gap-5 ${
            bleedMargins ? "pr-5 sm:pr-0" : "pr-5"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function isHiddenGeneratingChapter(chapter: LearningPathHubChapter): boolean {
  return chapter.generation_status === "creating" || chapter.generation_status === "failed"
}

interface InvataChapterSectionProps {
  chapter: LearningPathHubChapter
  chapterIndex: number
  chapterLessons: LearningPathHubLesson[]
  isLocked: boolean
  completedLessonIds: string[]
  lessonProgressByLessonId: LessonProgressByLessonId
  shouldEnhanceDesktopScroller: boolean
  isDeletingPersonalizedChapter?: boolean
  onDeletePersonalizedChapter?: (chapter: LearningPathHubChapter) => void
}

function InvataChapterSection({
  chapter,
  chapterIndex,
  chapterLessons,
  isLocked,
  completedLessonIds,
  lessonProgressByLessonId,
  shouldEnhanceDesktopScroller,
  isDeletingPersonalizedChapter = false,
  onDeletePersonalizedChapter,
}: InvataChapterSectionProps) {
  const sectionRef = useRegisterInvataChapterSection(chapterIndex)
  const imagesEnabled = useInvataChapterImagesEnabled(chapterIndex)
  const canDeletePersonalizedChapter = chapter.is_personalized === true && !!onDeletePersonalizedChapter

  if (isHiddenGeneratingChapter(chapter)) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      id={invataChapterSectionDomId(chapter.id)}
      className={
        chapterIndex === 0
          ? "relative max-sm:scroll-mt-[calc(5.875rem+3rem)] sm:scroll-mt-0"
          : "relative max-sm:scroll-mt-[calc(5.875rem+3rem)] border-t border-[#ececec] pt-10 sm:scroll-mt-0 sm:pt-10"
      }
      aria-label={chapter.title}
    >
      <div className="relative mb-5 sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div
            className="relative min-w-0 flex-1"
            style={{ zIndex: INVATA_HUB_LESSON_CARDS_Z }}
          >
            <h2 className="text-xl font-bold text-[#111111]">{chapter.title}</h2>
            {chapter.description ? (
              <p className="mt-1 text-sm text-[#707070]">{chapter.description}</p>
            ) : null}
            {isLocked ? (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#ebdef9] bg-[#f6f0ff] px-3 py-1 text-xs font-semibold text-[#7c3aed]">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Disponibil cu Plus+
              </span>
            ) : null}
            {canDeletePersonalizedChapter ? (
              <button
                type="button"
                onClick={() => onDeletePersonalizedChapter?.(chapter)}
                disabled={isDeletingPersonalizedChapter}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5f5f] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingPersonalizedChapter ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Șterge
              </button>
            ) : null}
          </div>
          {chapter.icon_url ? (
            <div
              className="relative shrink-0"
              style={{ zIndex: INVATA_HUB_CHAPTER_IMAGE_Z }}
            >
              <InvataDeferredImage
                src={chapter.icon_url}
                enabled={imagesEnabled}
                alt=""
                className={cn("h-20 w-20 object-contain", isLocked && "opacity-60 grayscale")}
              />
            </div>
          ) : (
            <div
              className={cn(
                "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f]",
                isLocked && "opacity-60 grayscale"
              )}
              style={{ zIndex: INVATA_HUB_CHAPTER_IMAGE_Z }}
            >
              <BookOpen className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 hidden sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
          {chapter.icon_url ? (
            <InvataDeferredImage
              src={chapter.icon_url}
              enabled={imagesEnabled}
              alt={chapter.title}
              className={cn(
                "h-24 w-24 shrink-0 rounded-xl object-contain sm:h-28 sm:w-28",
                isLocked && "opacity-60 grayscale"
              )}
            />
          ) : (
            <div
              className={cn(
                "flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f] sm:h-28 sm:w-28",
                isLocked && "opacity-60 grayscale"
              )}
            >
              <BookOpen className="h-12 w-12 sm:h-14 sm:w-14" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[#111111]">{chapter.title}</h2>
              {chapter.is_personalized ? (
                <span className="rounded-full border border-[#e6e6e6] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6f6f6f]">
                  Curs personalizat
                </span>
              ) : null}
            </div>
            {chapter.description ? (
              <p className="mt-0.5 text-sm text-[#707070]">{chapter.description}</p>
            ) : null}
            {chapterLessons.length > 0 ? (
              <LearningPathSegmentedProgress
                lessons={chapterLessons}
                completedLessonIds={completedLessonIds}
              />
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canDeletePersonalizedChapter ? (
            <button
              type="button"
              onClick={() => onDeletePersonalizedChapter?.(chapter)}
              disabled={isDeletingPersonalizedChapter}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5f5f] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingPersonalizedChapter ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Șterge
            </button>
          ) : null}
          {isLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#ebdef9] bg-[#f6f0ff] px-3 py-1 text-xs font-semibold text-[#7c3aed]">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Disponibil cu Plus+
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative sm:hidden" style={{ zIndex: INVATA_HUB_LESSON_CARDS_Z }}>
        <InvataMobileLessonList
          chapter={chapter}
          lessons={chapterLessons}
          lessonProgressByLessonId={lessonProgressByLessonId}
          loadImages={imagesEnabled}
          isLocked={isLocked}
        />
      </div>

      <div className="hidden sm:block">
        <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
          {chapterLessons.length ? (
            <LazyElasticLessonsScroller enabled={shouldEnhanceDesktopScroller}>
              {chapterLessons.map((lesson, lessonIndex) => {
                const lessonHref = getLearningPathLessonHref(chapter, lesson)
                const cardContent = (
                  <div
                    className={
                      isLocked
                        ? "relative flex w-[168px] shrink-0 cursor-not-allowed flex-col items-center opacity-60 grayscale sm:w-[190px]"
                        : "relative flex w-[168px] shrink-0 cursor-pointer flex-col items-center sm:w-[190px]"
                    }
                  >
                    <div
                      className={
                        isLocked
                          ? "relative flex h-[142px] w-[142px] items-center justify-center rounded-2xl border-[3px] border-[#e6e6e6] border-b-[7px] bg-white p-3 sm:h-[162px] sm:w-[162px]"
                          : "flex h-[142px] w-[142px] items-center justify-center rounded-2xl border-[3px] border-[#e6e6e6] border-b-[7px] bg-white p-3 transition-[transform,border-color,border-bottom-width] duration-200 hover:translate-y-1 hover:border-[#cfcfcf] hover:border-b-[4px] sm:h-[162px] sm:w-[162px]"
                      }
                    >
                      {isLocked ? (
                        <div className="absolute inset-0 z-[1] flex items-center justify-center rounded-2xl bg-white/60">
                          <Lock className="h-6 w-6 text-[#8a8a8a]" aria-hidden="true" />
                        </div>
                      ) : null}
                      {lesson.image_url ? (
                        <InvataDeferredImage
                          src={lesson.image_url}
                          enabled={imagesEnabled}
                          alt={lesson.title}
                          className="h-full w-full object-contain"
                          draggable={false}
                          onDragStart={(event) => event.preventDefault()}
                        />
                      ) : (
                        <div className="h-full w-full rounded-xl bg-[#f3f3f3]" />
                      )}
                    </div>

                    {lessonIndex < chapterLessons.length - 1 ? (
                      <div className="pointer-events-none absolute left-[155px] top-[71px] h-[5px] w-[42px] bg-[#e6e6e6] sm:left-[176px] sm:top-[81px] sm:w-[48px]" />
                    ) : null}

                    <p className="mt-3 line-clamp-2 text-center text-base font-medium text-[#1f1f1f]">
                      {lesson.title}
                    </p>
                  </div>
                )

                if (isLocked) {
                  return (
                    <div key={lesson.id} aria-disabled="true" className="block shrink-0">
                      {cardContent}
                    </div>
                  )
                }

                return (
                  <Link key={lesson.id} href={lessonHref} className="block shrink-0">
                    {cardContent}
                  </Link>
                )
              })}
            </LazyElasticLessonsScroller>
          ) : (
            <p className="text-sm text-[#7a7a7a]">Acest capitol nu are încă lecții.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function getArchivedChapterProgress(
  chapterLessons: LearningPathHubLesson[],
  completedLessonIds: string[],
): number {
  if (!chapterLessons.length) return 0
  const completed = new Set(completedLessonIds)
  const doneCount = chapterLessons.filter((lesson) => completed.has(lesson.id)).length
  return doneCount / chapterLessons.length
}

function InvataArchivedLearningPathsSection({
  chapters,
  lessonsByChapter,
  completedLessonIds,
}: {
  chapters: LearningPathHubChapter[]
  lessonsByChapter: Record<string, LearningPathHubLesson[]>
  completedLessonIds: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      const frame = requestAnimationFrame(() => setIsVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => setIsMounted(false), 300)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  if (!chapters.length) return null

  return (
    <section className="pt-8 sm:pt-10" aria-label="Arhivă trasee de învățare">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="shrink-0 text-base font-semibold text-[#6d6d6d] sm:text-lg">Arhivă</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#8a8a8a] transition-transform duration-200 sm:h-5 sm:w-5 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
        <div className="h-px flex-1 bg-[#e4e4e4]" aria-hidden="true" />
      </button>

      {isMounted ? (
        <div
          className={`mt-5 rounded-2xl bg-[#f3f3f3] p-5 transition-all duration-300 ease-out sm:mt-6 sm:p-6 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          <div className="-mx-1 overflow-x-auto px-1 scrollbar-hide">
            <div className="flex min-w-max items-start gap-6 pb-1 sm:gap-8">
              {chapters.map((chapter, chapterIndex) => {
                const chapterLessons = lessonsByChapter[chapter.id] ?? []
                const progress = getArchivedChapterProgress(chapterLessons, completedLessonIds)

                return (
                  <div
                    key={chapter.id}
                    className="relative flex w-[120px] shrink-0 flex-col items-center sm:w-[132px]"
                  >
                    <div className="relative">
                      {chapterIndex < chapters.length - 1 ? (
                        <div
                          className="pointer-events-none absolute left-[108px] top-[60px] z-0 h-[2px] w-[40px] bg-[#dddddd] sm:left-[118px] sm:top-[66px] sm:w-[44px]"
                          aria-hidden="true"
                        />
                      ) : null}

                      <div className="relative z-10 flex h-[120px] w-[120px] flex-col overflow-hidden rounded-2xl bg-white sm:h-[132px] sm:w-[132px]">
                        <div className="flex flex-1 items-center justify-center p-4 sm:p-5">
                          {chapter.icon_url ? (
                            <img
                              src={chapter.icon_url}
                              alt=""
                              className="h-full w-full object-contain grayscale"
                              loading="lazy"
                              draggable={false}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#f5f5f5] text-[#b0b0b0]">
                              <BookOpen className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden="true" />
                            </div>
                          )}
                        </div>

                        {progress > 0 ? (
                          <div className="h-[3px] w-full bg-[#e8e8e8]" aria-hidden="true">
                            <div
                              className="h-full bg-[#22c55e] transition-[width] duration-300"
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-center text-sm font-medium leading-snug text-[#1f1f1f]">
                      {chapter.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function LearningPathsList({
  chapters,
  archivedChapters = [],
  lessonsByChapter,
  lockedChapterIds = [],
  completedLessonIds = [],
  lessonProgressByLessonId = {},
}: LearningPathsListProps) {
  const { loading: authLoading, user } = useAuth()
  const setInvataHubChapters = useSetInvataHubChapters()
  const shouldEnhanceDesktopScroller = useShouldEnhanceDesktopScroller()
  const shouldLoadDesktopChapterIndicator = useShouldLoadDesktopChapterIndicator()
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null)
  const [deletedChapterIds, setDeletedChapterIds] = useState<Set<string>>(() => new Set())
  const [hubChapters, setHubChapters] = useState(chapters)
  const [hubArchivedChapters, setHubArchivedChapters] = useState(archivedChapters)
  const [hubLessonsByChapter, setHubLessonsByChapter] = useState(lessonsByChapter)
  const [hubLockedChapterIds, setHubLockedChapterIds] = useState(lockedChapterIds)
  const [hubSessionReadyUserId, setHubSessionReadyUserId] = useState<string | null>(null)
  const [hubRefreshToken, setHubRefreshToken] = useState(0)
  const lockedChapterIdSet = useMemo(
    () => new Set(hubLockedChapterIds),
    [hubLockedChapterIds],
  )
  const [hydratedCompletedLessonIds, setHydratedCompletedLessonIds] = useState(completedLessonIds)
  const [hydratedLessonProgressByLessonId, setHydratedLessonProgressByLessonId] =
    useState(lessonProgressByLessonId)

  useEffect(() => {
    const refresh = () => setHubRefreshToken((token) => token + 1)
    window.addEventListener(INVATA_HUB_REFRESH_EVENT, refresh)
    return () => window.removeEventListener(INVATA_HUB_REFRESH_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (user) return

    setHubChapters(chapters)
    setHubArchivedChapters(archivedChapters)
    setHubLessonsByChapter(lessonsByChapter)
    setHubLockedChapterIds(lockedChapterIds)
    setHubSessionReadyUserId(null)
    setHydratedCompletedLessonIds(completedLessonIds)
    setHydratedLessonProgressByLessonId(lessonProgressByLessonId)
  }, [
    archivedChapters,
    authLoading,
    chapters,
    completedLessonIds,
    lessonProgressByLessonId,
    lessonsByChapter,
    lockedChapterIds,
    user,
  ])

  useEffect(() => {
    if (authLoading || !user?.id) return

    const controller = new AbortController()
    setHubSessionReadyUserId(null)

    void (async () => {
      try {
        const response = await fetch("/api/invata/hub-session", {
          credentials: "same-origin",
          signal: controller.signal,
        })
        if (!response.ok) {
          setHubSessionReadyUserId(user.id)
          return
        }

        const data = (await response.json().catch(() => ({}))) as HubSessionResponse
        if (controller.signal.aborted) return

        if (Array.isArray(data.chapters)) setHubChapters(data.chapters)
        if (Array.isArray(data.archivedChapters)) setHubArchivedChapters(data.archivedChapters)
        if (data.lessonsByChapter && typeof data.lessonsByChapter === "object") {
          setHubLessonsByChapter(data.lessonsByChapter)
        }
        if (Array.isArray(data.lockedChapterIds)) setHubLockedChapterIds(data.lockedChapterIds)
        if (data.lessonProgressByLessonId && typeof data.lessonProgressByLessonId === "object") {
          setHydratedLessonProgressByLessonId(data.lessonProgressByLessonId)
        }
        setHydratedCompletedLessonIds([])
        setHubSessionReadyUserId(user.id)
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        setHubSessionReadyUserId(user.id)
      }
    })()

    return () => controller.abort()
  }, [authLoading, hubRefreshToken, user?.id])

  const visibleChapters = useMemo(
    () =>
      hubChapters.filter(
        (chapter) => !deletedChapterIds.has(chapter.id) && !isHiddenGeneratingChapter(chapter),
      ),
    [hubChapters, deletedChapterIds],
  )
  const visibleArchivedChapters = useMemo(
    () =>
      hubArchivedChapters.length === 0
        ? []
        : hubArchivedChapters.filter(
            (chapter) => !deletedChapterIds.has(chapter.id) && !isHiddenGeneratingChapter(chapter),
          ),
    [hubArchivedChapters, deletedChapterIds],
  )

  useEffect(() => {
    setInvataHubChapters?.(visibleChapters)
  }, [setInvataHubChapters, visibleChapters])

  useEffect(() => {
    setHydratedCompletedLessonIds(completedLessonIds)
  }, [completedLessonIds])

  useEffect(() => {
    setHydratedLessonProgressByLessonId(lessonProgressByLessonId)
  }, [lessonProgressByLessonId])

  const progressRequest = useMemo(() => {
    const allLessonIds: string[] = []
    const publicVisibleLessonIds: string[] = []
    const personalizedVisibleLessonIds: string[] = []

    for (const lessons of Object.values(hubLessonsByChapter)) {
      for (const lesson of lessons) {
        allLessonIds.push(lesson.id)
      }
    }

    for (const chapter of visibleChapters) {
      const target = chapter.is_personalized
        ? personalizedVisibleLessonIds
        : publicVisibleLessonIds
      for (const lesson of hubLessonsByChapter[chapter.id] ?? []) {
        target.push(lesson.id)
      }
    }

    return {
      allLessonIds,
      publicVisibleLessonIds,
      personalizedVisibleLessonIds,
    }
  }, [hubLessonsByChapter, visibleChapters])

  // The effect re-fires only when this signature actually changes. Reading the
  // request body through a ref keeps the dep array at a constant length and
  // primitive-friendly for React's diff.
  const progressRequestKey = useMemo(
    () =>
      `${progressRequest.allLessonIds.length}|${progressRequest.publicVisibleLessonIds.join(",")}|${progressRequest.personalizedVisibleLessonIds.join(",")}`,
    [progressRequest],
  )
  const progressRequestRef = useRef(progressRequest)
  useEffect(() => {
    progressRequestRef.current = progressRequest
  }, [progressRequest])

  useEffect(() => {
    if (authLoading) return
    if (user && hubSessionReadyUserId !== user.id) return
    if (!user && !hasGuestLearningPathProgressCookie()) return

    const request = progressRequestRef.current
    if (
      request.allLessonIds.length === 0 &&
      request.publicVisibleLessonIds.length === 0 &&
      request.personalizedVisibleLessonIds.length === 0
    ) {
      return
    }

    const controller = new AbortController()
    void (async () => {
      try {
        const response = await fetch("/api/invata/hub-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          credentials: "same-origin",
          signal: controller.signal,
        })
        if (!response.ok) return
        const data = (await response.json().catch(() => ({}))) as HubProgressResponse
        if (controller.signal.aborted) return

        if (Array.isArray(data.completedLessonIds)) {
          setHydratedCompletedLessonIds(data.completedLessonIds)
        }
        if (data.lessonProgressByLessonId && typeof data.lessonProgressByLessonId === "object") {
          setHydratedLessonProgressByLessonId(data.lessonProgressByLessonId)
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
      }
    })()

    return () => controller.abort()
  }, [authLoading, hubSessionReadyUserId, progressRequestKey, user])

  const handleDeletePersonalizedChapter = useCallback(
    async (chapter: LearningPathHubChapter) => {
      if (chapter.is_personalized !== true || deletingChapterId) return

      const confirmed = window.confirm(
        `Ștergi cursul personalizat „${chapter.title}”? Această acțiune nu poate fi anulată.`,
      )
      if (!confirmed) return

      setDeletingChapterId(chapter.id)
      try {
        const response = await fetch("/api/personalized-courses", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId: chapter.id }),
          credentials: "same-origin",
        })
        const data = (await response.json().catch(() => ({}))) as { error?: string }

        if (!response.ok) {
          window.alert(data.error || "Nu am putut șterge cursul personalizat.")
          return
        }

        setDeletedChapterIds((current) => {
          const next = new Set(current)
          next.add(chapter.id)
          return next
        })
        dispatchInvataHubRefresh()
      } catch {
        window.alert("Conexiunea a eșuat. Încearcă din nou.")
      } finally {
        setDeletingChapterId(null)
      }
    },
    [deletingChapterId],
  )

  if (!visibleChapters.length) {
    return (
      <section className="rounded-2xl border border-[#e6e6e6] bg-[#f7f7f7] p-8 text-center">
        <h2 className="text-lg font-semibold text-[#1f1f1f]">Nu există încă learning paths.</h2>
        <p className="mt-2 text-sm text-[#6f6f6f]">
          Adaugă capitole și lecții în tabelele dedicate pentru pagina <span className="font-medium">/invata</span>.
        </p>
      </section>
    )
  }

  return (
    <div className="pb-14">
      <LazyInvataChapterSectionIndicator
        chapterIds={visibleChapters.map((c) => c.id)}
        enabled={shouldLoadDesktopChapterIndicator}
      />

      <div className="space-y-12 sm:space-y-10">
        {visibleChapters.map((chapter, chapterIndex) => (
          <InvataChapterSection
            key={chapter.id}
            chapter={chapter}
            chapterIndex={chapterIndex}
            chapterLessons={hubLessonsByChapter[chapter.id] || []}
            isLocked={lockedChapterIdSet.has(chapter.id)}
            completedLessonIds={hydratedCompletedLessonIds}
            lessonProgressByLessonId={hydratedLessonProgressByLessonId}
            shouldEnhanceDesktopScroller={shouldEnhanceDesktopScroller}
            isDeletingPersonalizedChapter={deletingChapterId === chapter.id}
            onDeletePersonalizedChapter={handleDeletePersonalizedChapter}
          />
        ))}
      </div>

      <InvataArchivedLearningPathsSection
        chapters={visibleArchivedChapters}
        lessonsByChapter={hubLessonsByChapter}
        completedLessonIds={hydratedCompletedLessonIds}
      />
    </div>
  )
}

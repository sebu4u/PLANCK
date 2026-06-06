"use client"

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Loader2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/mobile-app-nav"
import {
  getLearningPathChapterNavTitle,
  getLearningPathLessonHref,
  type LearningPathChapter,
  type LearningPathLesson,
} from "@/lib/supabase-learning-paths"

interface DashboardLearningPathsCarouselProps {
  chapters: LearningPathChapter[]
  lessonsByChapter: Record<string, LearningPathLesson[]>
  startHrefByChapter?: Record<string, string>
  levelByChapter?: Record<string, number>
  hasStartedByChapter?: Record<string, boolean>
}

type ChapterTheme = {
  text: string
  border: string
  shadow: string
  gradient: string
  accentBorder: string
  accentRing: string
  buttonShadow: string
  buttonHoverShadow: string
  buttonActiveShadow: string
  buttonGlowTint: string
  dotActive: string
}

function getChapterTheme(title: string): ChapterTheme {
  const t = title.toLowerCase()
  if (t.includes("dinamic")) {
    return {
      text: "text-[#f7c325]",
      border: "border-[#f7c325]/40",
      shadow: "shadow-[0_12px_40px_rgba(247,195,37,0.2)]",
      gradient: "from-[#fcd34d] to-[#f7c325]",
      accentBorder: "border-[#f7c325]",
      accentRing: "ring-[#f7c325]/30",
      buttonShadow: "shadow-[0_4px_0_#b88e08]",
      buttonHoverShadow: "hover:shadow-[0_1px_0_#b88e08]",
      buttonActiveShadow: "active:shadow-[0_1px_0_#b88e08]",
      buttonGlowTint: "rgba(255, 238, 170, 0.86)",
      dotActive: "bg-[#f7c325]",
    }
  }
  if (t.includes("optic")) {
    return {
      text: "text-[#456dff]",
      border: "border-[#456dff]/40",
      shadow: "shadow-[0_12px_40px_rgba(69,109,255,0.2)]",
      gradient: "from-[#60a5fa] to-[#456dff]",
      accentBorder: "border-[#456dff]",
      accentRing: "ring-[#456dff]/30",
      buttonShadow: "shadow-[0_4px_0_#2448cc]",
      buttonHoverShadow: "hover:shadow-[0_1px_0_#2448cc]",
      buttonActiveShadow: "active:shadow-[0_1px_0_#2448cc]",
      buttonGlowTint: "rgba(186, 218, 255, 0.84)",
      dotActive: "bg-[#456dff]",
    }
  }
  return {
    text: "text-[#7c3aed]",
    border: "border-[#d4d0f9]",
    shadow: "shadow-[0_12px_40px_rgba(124,58,237,0.12)]",
    gradient: "from-[#8b5cf6] to-[#7c3aed]",
    accentBorder: "border-[#7c3aed]",
    accentRing: "ring-[#7c3aed]/30",
    buttonShadow: "shadow-[0_4px_0_#5b21b6]",
    buttonHoverShadow: "hover:shadow-[0_1px_0_#5b21b6]",
    buttonActiveShadow: "active:shadow-[0_1px_0_#5b21b6]",
    buttonGlowTint: "rgba(221, 211, 255, 0.84)",
    dotActive: "bg-[#7c3aed]",
  }
}

function getChapterHref(
  chapter: LearningPathChapter,
  lessons: LearningPathLesson[],
  startHrefByChapter: Record<string, string>
): string {
  const firstLesson = lessons[0]
  const fallbackChapterHref = firstLesson
    ? getLearningPathLessonHref(chapter, firstLesson)
    : "/invata"
  return startHrefByChapter[chapter.id] ?? fallbackChapterHref
}

function LessonPreviewRows({
  lessons,
  variant = "nested",
}: {
  lessons: LearningPathLesson[]
  variant?: "nested" | "flat"
}) {
  if (lessons.length === 0) {
    return <p className="text-sm text-[#666666]">Lectiile vor aparea in curand.</p>
  }

  const rowClass =
    variant === "flat"
      ? "flex items-center gap-2.5 py-1"
      : "flex items-center gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] px-3 py-2.5"

  return (
    <div className={variant === "flat" ? "space-y-0" : "space-y-2.5"}>
      {lessons.map((lesson) => (
        <div key={lesson.id} className={rowClass}>
          {lesson.image_url ? (
            variant === "flat" ? (
              <MobileAspectImage
                src={lesson.image_url}
                alt={lesson.title}
                frameClassName={cn(MOBILE_LESSON_THUMB_CLASS, "rounded-lg")}
              />
            ) : (
              <img
                src={lesson.image_url}
                alt={lesson.title}
                className="h-9 w-9 rounded-lg object-cover"
                loading="lazy"
                draggable={false}
              />
            )
          ) : (
            <div
              className={cn(
                "flex items-center justify-center rounded-lg bg-[#f1f1f1] text-[#888888]",
                variant === "flat" ? MOBILE_LESSON_THUMB_CLASS : "h-9 w-9"
              )}
            >
              <Play className="h-4 w-4" />
            </div>
          )}
          <p className="line-clamp-2 text-sm font-medium text-[#2a2a2a]">{lesson.title}</p>
          <span className="ml-auto h-3 w-3 shrink-0 rounded-full bg-[#ddd]" />
        </div>
      ))}
    </div>
  )
}

const MOBILE_ICON_SLOT_WIDTH_REM = 13
/** Extra space beside the focused edge neighbor so first/last icons sit visually centered. */
const MOBILE_EDGE_NEIGHBOR_GAP_REM = 2
/** Fixed 1:1 frame so layout does not shift between chapters or focus states. */
const MOBILE_CHAPTER_ICON_ROW_HEIGHT_CLASS = "h-60"
const MOBILE_CHAPTER_ICON_FOCUSED_CLASS = "h-56 w-56"
const MOBILE_CHAPTER_ICON_PEEK_CLASS = "h-36 w-36"
const MOBILE_LESSON_THUMB_CLASS = "h-9 w-9 shrink-0 aspect-square"

const MOBILE_EDGE_INSET_STYLE = `calc(50% - ${MOBILE_ICON_SLOT_WIDTH_REM / 2}rem)`

function getFixedSlideGapAfterRem(slideIndex: number, count: number) {
  if (count <= 1) return 0
  if (slideIndex === 0) return MOBILE_EDGE_NEIGHBOR_GAP_REM
  if (count > 2 && slideIndex === count - 2) return MOBILE_EDGE_NEIGHBOR_GAP_REM
  return 0
}

function MobileAspectImage({
  src,
  alt,
  frameClassName,
  imageClassName,
}: {
  src: string
  alt: string
  frameClassName: string
  imageClassName?: string
}) {
  return (
    <div className={cn("relative aspect-square", frameClassName)}>
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full object-contain", imageClassName)}
        loading="lazy"
        draggable={false}
      />
    </div>
  )
}

function isCarouselInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest("a, button, input, textarea, select, label"))
}

function StartContinueButton({
  href,
  hasStarted,
  colors,
  className,
  isLoading = false,
  onContinue,
}: {
  href: string
  hasStarted: boolean
  colors: ChapterTheme
  className?: string
  isLoading?: boolean
  onContinue: (href: string) => void
}) {
  return (
    <button
      type="button"
      aria-busy={isLoading}
      className={cn(
        "dashboard-start-glow mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white transition-[transform,box-shadow,opacity] hover:translate-y-1 active:translate-y-1",
        colors.gradient,
        colors.buttonShadow,
        colors.buttonHoverShadow,
        colors.buttonActiveShadow,
        isLoading && "pointer-events-none opacity-70",
        className
      )}
      style={{ "--start-glow-tint": colors.buttonGlowTint } as CSSProperties}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        if (isLoading) return
        onContinue(href)
      }}
    >
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <>
            {hasStarted ? "Continuă" : "Start"}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </span>
    </button>
  )
}

export function DashboardLearningPathsCarousel({
  chapters,
  lessonsByChapter,
  startHrefByChapter = {},
  levelByChapter = {},
  hasStartedByChapter = {},
}: DashboardLearningPathsCarouselProps) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [continueLoadingHref, setContinueLoadingHref] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const mobileSlideRefs = useRef<(HTMLDivElement | null)[]>([])
  const mobileScrollRafRef = useRef(0)
  const mobileScrollEndTimerRef = useRef(0)
  const isMobileScrollSyncingRef = useRef(false)
  const scrollGestureStartIndexRef = useRef(0)
  const activeIndexRef = useRef(0)

  const count = chapters.length
  const activeChapter = chapters[activeIndex]
  const activeLessons = activeChapter ? lessonsByChapter[activeChapter.id] || [] : []
  const activeColors = activeChapter ? getChapterTheme(activeChapter.title) : getChapterTheme("")
  const activeHasStarted = activeChapter
    ? (hasStartedByChapter[activeChapter.id] ?? false)
    : false
  const activeHref = activeChapter
    ? getChapterHref(activeChapter, activeLessons, startHrefByChapter)
    : "/invata"

  const activeLevel = activeChapter ? (levelByChapter[activeChapter.id] ?? 1) : 1
  activeIndexRef.current = activeIndex

  useEffect(() => {
    setContinueLoadingHref(null)
  }, [activeIndex, activeHref])

  const handleContinueClick = useCallback(
    (href: string) => {
      if (continueLoadingHref) return

      setContinueLoadingHref(href)
      router.prefetch(href)
      router.push(href)
    },
    [continueLoadingHref, router]
  )

  const getClosestIndexFromScroll = useCallback(() => {
    const root = mobileScrollRef.current
    if (!root || count === 0) return 0

    const centerX = root.scrollLeft + root.clientWidth / 2
    let closestIndex = 0
    let closestDistance = Infinity

    mobileSlideRefs.current.forEach((slide, index) => {
      if (!slide) return
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
      const distance = Math.abs(slideCenter - centerX)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    return closestIndex
  }, [count])

  const clampToAdjacentIndex = useCallback((candidate: number, start: number) => {
    if (candidate === start) return start
    const direction = candidate > start ? 1 : -1
    return Math.max(0, Math.min(count - 1, start + direction))
  }, [count])

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const slide = mobileSlideRefs.current[index]
    if (!slide || slide.offsetParent === null) return

    isMobileScrollSyncingRef.current = true
    slide.scrollIntoView({ behavior, inline: "center", block: "nearest" })
    window.setTimeout(() => {
      isMobileScrollSyncingRef.current = false
    }, behavior === "instant" ? 0 : 450)
  }, [])

  const finalizeMobileScroll = useCallback(() => {
    if (isMobileScrollSyncingRef.current) return

    const closestIndex = getClosestIndexFromScroll()
    const startIndex = scrollGestureStartIndexRef.current
    const targetIndex =
      Math.abs(closestIndex - startIndex) > 1
        ? clampToAdjacentIndex(closestIndex, startIndex)
        : closestIndex

    scrollGestureStartIndexRef.current = targetIndex
    setActiveIndex(targetIndex)

    if (targetIndex !== closestIndex) {
      scrollToIndex(targetIndex, "smooth")
    }
  }, [clampToAdjacentIndex, getClosestIndexFromScroll, scrollToIndex])

  const onMobileScrollGestureStart = useCallback(() => {
    if (isMobileScrollSyncingRef.current) return
    scrollGestureStartIndexRef.current = activeIndexRef.current
  }, [])

  const updateFocusedIndexFromScroll = useCallback(() => {
    if (isMobileScrollSyncingRef.current) return

    const closestIndex = getClosestIndexFromScroll()
    const startIndex = scrollGestureStartIndexRef.current
    const nextIndex =
      Math.abs(closestIndex - startIndex) > 1
        ? clampToAdjacentIndex(closestIndex, startIndex)
        : closestIndex

    setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex))
  }, [clampToAdjacentIndex, getClosestIndexFromScroll])

  const onMobileScroll = useCallback(() => {
    if (mobileScrollRafRef.current) return
    mobileScrollRafRef.current = requestAnimationFrame(() => {
      mobileScrollRafRef.current = 0
      updateFocusedIndexFromScroll()

      if (isMobileScrollSyncingRef.current) return

      window.clearTimeout(mobileScrollEndTimerRef.current)
      mobileScrollEndTimerRef.current = window.setTimeout(finalizeMobileScroll, 120)
    })
  }, [finalizeMobileScroll, updateFocusedIndexFromScroll])

  const goTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (count === 0) return
      const nextIndex = ((index % count) + count) % count
      scrollGestureStartIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
      scrollToIndex(nextIndex, behavior)
    },
    [count, scrollToIndex]
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  const onPointerDown = (e: React.PointerEvent) => {
    if (isCarouselInteractiveTarget(e.target)) return

    setIsDragging(true)
    dragStartRef.current = e.clientX
    setDragOffset(0)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setDragOffset(e.clientX - dragStartRef.current)
  }

  const onPointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(dragOffset) > 60) {
      if (dragOffset < 0) goNext()
      else goPrev()
    }

    setDragOffset(0)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev])

  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0)
    }
  }, [activeIndex, count])

  useEffect(() => {
    mobileSlideRefs.current = mobileSlideRefs.current.slice(0, count)
  }, [count])

  useEffect(() => {
    if (count === 0) return
    scrollGestureStartIndexRef.current = 0
    const frame = requestAnimationFrame(() => scrollToIndex(0, "instant"))
    return () => cancelAnimationFrame(frame)
  }, [count, scrollToIndex])

  useEffect(() => {
    return () => {
      window.clearTimeout(mobileScrollEndTimerRef.current)
    }
  }, [])

  if (!count) {
    return (
      <div className="rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
        <p className="text-xl font-semibold text-[#171717]">Learning paths indisponibile momentan.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2 md:gap-0">
      {/* Mobile: hero swipe + fixed bottom card */}
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden md:hidden">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 pt-1 pb-[200px]">
          {activeChapter ? (
            <div className="w-full text-center transition-opacity duration-200">
              <h2 className="text-[1.75rem] font-bold leading-tight tracking-tight text-[#111111]">
                {getLearningPathChapterNavTitle(activeChapter)}
              </h2>
              <p
                className={cn(
                  "mt-1 text-sm font-semibold uppercase tracking-[0.16em]",
                  activeColors.text
                )}
              >
                LEVEL {activeLevel}
              </p>
            </div>
          ) : null}

          <div
            ref={mobileScrollRef}
            className={cn(
              "-mx-4 mt-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-hide",
              MOBILE_CHAPTER_ICON_ROW_HEIGHT_CLASS
            )}
            onScroll={onMobileScroll}
            onTouchStart={onMobileScrollGestureStart}
            onPointerDown={onMobileScrollGestureStart}
          >
            <div aria-hidden className="shrink-0" style={{ width: MOBILE_EDGE_INSET_STYLE }} />

            {chapters.map((chapter, index) => {
              const isFocused = activeIndex === index
              const gapAfterRem = getFixedSlideGapAfterRem(index, count)

              return (
                <div
                  key={chapter.id}
                  ref={(el) => {
                    mobileSlideRefs.current[index] = el
                  }}
                  className={cn(
                    "flex shrink-0 snap-center snap-always items-center justify-center",
                    MOBILE_CHAPTER_ICON_ROW_HEIGHT_CLASS
                  )}
                  style={{
                    width: `${MOBILE_ICON_SLOT_WIDTH_REM}rem`,
                    marginRight: gapAfterRem > 0 ? `${gapAfterRem}rem` : undefined,
                  }}
                >
                  {chapter.icon_url ? (
                    <MobileAspectImage
                      src={chapter.icon_url}
                      alt={chapter.title}
                      frameClassName={cn(
                        isFocused
                          ? MOBILE_CHAPTER_ICON_FOCUSED_CLASS
                          : cn(MOBILE_CHAPTER_ICON_PEEK_CLASS, "opacity-40 transition-opacity duration-200")
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-xl bg-[#f3f3f3] text-[#737373]",
                        isFocused ? MOBILE_CHAPTER_ICON_FOCUSED_CLASS : cn(MOBILE_CHAPTER_ICON_PEEK_CLASS, "opacity-40 transition-opacity duration-200")
                      )}
                    >
                      <BookOpen className={cn(isFocused ? "h-20 w-20" : "h-14 w-14")} />
                    </div>
                  )}
                </div>
              )
            })}

            <div aria-hidden className="shrink-0" style={{ width: MOBILE_EDGE_INSET_STYLE }} />
          </div>

          {count > 1 ? (
            <div className="mt-6 flex items-center gap-[5px]" aria-hidden>
              {chapters.map((chapter, index) => (
                <span
                  key={chapter.id}
                  className={cn(
                    "h-[5px] w-[5px] rounded-full",
                    activeIndex === index ? activeColors.dotActive : "bg-[#d4d4d4]"
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        {activeChapter ? (
          <div
            className={cn(
              "fixed inset-x-0 z-20 px-4 pb-4",
              MOBILE_BOTTOM_NAV_OFFSET_CLASS
            )}
          >
            <article className="rounded-3xl border-2 border-[#d1d5db] bg-white px-4 py-3">
              <LessonPreviewRows lessons={activeLessons} variant="flat" />
              <StartContinueButton
                href={activeHref}
                hasStarted={activeHasStarted}
                colors={activeColors}
                className="!mt-2.5 !py-2.5"
                isLoading={continueLoadingHref === activeHref}
                onContinue={handleContinueClick}
              />
            </article>
          </div>
        ) : null}
      </div>

      {/* Desktop: stacked carousel */}
      <div
        ref={containerRef}
        className="relative hidden w-full select-none overflow-visible md:block"
        style={{ height: 500 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {chapters.map((chapter, index) => {
          const chapterLessons = lessonsByChapter[chapter.id] || []
          const chapterHref = getChapterHref(chapter, chapterLessons, startHrefByChapter)
          const currentLevel = levelByChapter[chapter.id] ?? 1
          const hasStarted = hasStartedByChapter[chapter.id] ?? false

          const offset = (index - activeIndex + count) % count
          const normalizedOffset = offset > Math.floor(count / 2) ? offset - count : offset

          const isActive = normalizedOffset === 0
          const absOffset = Math.abs(normalizedOffset)
          const sign = normalizedOffset > 0 ? 1 : -1

          const scale = isActive ? 1 : Math.max(0.88, 1 - absOffset * 0.06)
          const translateX = isActive ? dragOffset * 0.5 : sign * absOffset * 40
          const translateY = absOffset * 6
          const rotate = isActive ? 0 : sign * absOffset * 2
          const zIndex = 10 - absOffset
          const cardOpacity = absOffset > 2 ? 0 : absOffset === 0 ? 1 : 0.65

          const colors = getChapterTheme(chapter.title)

          return (
            <article
              key={chapter.id}
              className={cn(
                "absolute rounded-3xl border bg-white p-5 sm:p-6 transition-all",
                isDragging ? "duration-0" : "duration-300 ease-out",
                isActive
                  ? `${colors.border} ${colors.shadow}`
                  : "border-[#e5e5e5] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              )}
              style={{
                left: 24,
                right: 24,
                top: 0,
                zIndex,
                opacity: cardOpacity,
                transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                transformOrigin: "center top",
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <h3 className="text-center text-2xl font-bold leading-tight text-[#111111] sm:text-3xl">
                {chapter.title}
              </h3>
              <p className={cn("mt-1 text-center text-sm font-semibold uppercase tracking-[0.16em]", colors.text)}>
                LEVEL {currentLevel}
              </p>

              <div className="mt-4 flex justify-center">
                {chapter.icon_url ? (
                  <img
                    src={chapter.icon_url}
                    alt={chapter.title}
                    className="h-28 w-28 object-contain sm:h-32 sm:w-32"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-[#f3f3f3] text-[#737373] sm:h-32 sm:w-32">
                    <BookOpen className="h-11 w-11" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <LessonPreviewRows lessons={chapterLessons} />
              </div>

              <StartContinueButton
                href={chapterHref}
                hasStarted={hasStarted}
                colors={colors}
                isLoading={continueLoadingHref === chapterHref}
                onContinue={handleContinueClick}
              />
            </article>
          )
        })}
      </div>

      {count > 1 && (
        <div className="hidden items-center gap-4 md:-mt-5 md:flex">
          <button
            type="button"
            aria-label="Previous learning path"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#666] transition-colors hover:border-[#bbb] hover:text-[#333]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {chapters.map((chapter, index) => {
              const colors = getChapterTheme(chapter.title)
              return (
                <button
                  key={chapter.id}
                  type="button"
                  aria-label={`Mergi la learning path ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={cn(
                    "flex h-16 w-24 items-center justify-center rounded-2xl border bg-white p-3 transition-all sm:h-20 sm:w-28",
                    activeIndex === index
                      ? `${colors.accentBorder} ${colors.accentRing} ring-2 shadow-[0_6px_14px_rgba(0,0,0,0.08)]`
                      : "border-[#e5e5e5] hover:border-[#cfcfcf]"
                  )}
                >
                  {chapter.icon_url ? (
                    <img
                      src={chapter.icon_url}
                      alt={chapter.title}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <BookOpen className={cn("h-7 w-7", colors.text)} />
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            aria-label="Next learning path"
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#666] transition-colors hover:border-[#bbb] hover:text-[#333]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

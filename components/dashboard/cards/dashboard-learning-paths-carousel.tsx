"use client"

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LearningPathChapter, LearningPathLesson } from "@/lib/supabase-learning-paths"

interface DashboardLearningPathsCarouselProps {
  chapters: LearningPathChapter[]
  lessonsByChapter: Record<string, LearningPathLesson[]>
}

export function DashboardLearningPathsCarousel({
  chapters,
  lessonsByChapter,
}: DashboardLearningPathsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const count = chapters.length

  const getChapterTheme = useCallback((title: string) => {
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
    }
  }, [])

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActiveIndex(((index % count) + count) % count)
    },
    [count]
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    dragStartRef.current = e.clientX
    setDragOffset(0)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
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

  if (!count) {
    return (
      <div className="rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
        <p className="text-xl font-semibold text-[#171717]">Learning paths indisponibile momentan.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="-mx-4 flex w-[calc(100%+2rem)] snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:hidden scrollbar-hide">
        {chapters.map((chapter) => {
          const chapterLessons = (lessonsByChapter[chapter.id] || []).slice(0, 2)
          const chapterHref = chapter.slug ? `/invata/${chapter.slug}` : "/invata"
          const colors = getChapterTheme(chapter.title)

          return (
            <article
              key={chapter.id}
              className={cn(
                "w-[84vw] min-w-[84vw] snap-center rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
                colors.border
              )}
            >
              <h3 className="text-center text-2xl font-bold leading-tight text-[#111111]">{chapter.title}</h3>
              <p className={cn("mt-1 text-center text-sm font-semibold uppercase tracking-[0.16em]", colors.text)}>
                LEVEL 1
              </p>

              <div className="mt-4 flex justify-center">
                {chapter.icon_url ? (
                  <img
                    src={chapter.icon_url}
                    alt={chapter.title}
                    className="h-28 w-28 object-contain"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-[#f3f3f3] text-[#737373]">
                    <BookOpen className="h-11 w-11" />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {chapterLessons.length > 0 ? (
                  chapterLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] px-3 py-2.5"
                    >
                      {lesson.image_url ? (
                        <img
                          src={lesson.image_url}
                          alt={lesson.title}
                          className="h-9 w-9 rounded-lg object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f1f1] text-[#888888]">
                          <Play className="h-4 w-4" />
                        </div>
                      )}
                      <p className="line-clamp-2 text-sm font-medium text-[#2a2a2a]">{lesson.title}</p>
                      <span className="ml-auto h-3 w-3 shrink-0 rounded-full bg-[#ddd]" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#666666]">Lectiile vor aparea in curand.</p>
                )}
              </div>

              <Link
                href={chapterHref}
                className={cn(
                  "dashboard-start-glow mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white transition-[transform,box-shadow] active:translate-y-1",
                  colors.gradient,
                  colors.buttonShadow,
                  colors.buttonActiveShadow
                )}
                style={{ "--start-glow-tint": colors.buttonGlowTint } as CSSProperties}
              >
                <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                  Start
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </article>
          )
        })}
      </div>

      <div
        ref={containerRef}
        className="relative hidden w-full select-none overflow-visible md:block"
        style={{ height: 520 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {chapters.map((chapter, index) => {
          const chapterLessons = (lessonsByChapter[chapter.id] || []).slice(0, 2)
          const chapterHref = chapter.slug ? `/invata/${chapter.slug}` : "/invata"

          const offset = ((index - activeIndex + count) % count)
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
                LEVEL 1
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

              <div className="mt-4 space-y-2.5">
                {chapterLessons.length > 0 ? (
                  chapterLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] px-3 py-2.5"
                    >
                      {lesson.image_url ? (
                        <img
                          src={lesson.image_url}
                          alt={lesson.title}
                          className="h-9 w-9 rounded-lg object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f1f1] text-[#888888]">
                          <Play className="h-4 w-4" />
                        </div>
                      )}
                      <p className="line-clamp-2 text-sm font-medium text-[#2a2a2a]">{lesson.title}</p>
                      <span className="ml-auto h-3 w-3 shrink-0 rounded-full bg-[#ddd]" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#666666]">Lectiile vor aparea in curand.</p>
                )}
              </div>

              <Link
                href={chapterHref}
                className={cn(
                  "dashboard-start-glow mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white transition-[transform,box-shadow] hover:translate-y-1",
                  colors.gradient,
                  colors.buttonShadow,
                  colors.buttonHoverShadow
                )}
                style={{ "--start-glow-tint": colors.buttonGlowTint } as CSSProperties}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                  Start
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </article>
          )
        })}
      </div>

      {count > 1 && (
        <div className="hidden items-center gap-4 md:flex">
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

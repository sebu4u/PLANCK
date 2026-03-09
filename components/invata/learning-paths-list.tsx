"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent, type TouchEvent } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import type { LearningPathChapter, LearningPathLesson } from "@/lib/supabase-learning-paths"
import type { Problem } from "@/data/problems"

interface LearningPathsListProps {
  chapters: LearningPathChapter[]
  lessonsByChapter: Record<string, LearningPathLesson[]>
  problemsByChapterId?: Record<string, Problem[]>
}

function ElasticLessonsScroller({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [showDesktopButton, setShowDesktopButton] = useState(false)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [isPointerDragging, setIsPointerDragging] = useState(false)
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  })
  const pointerDragRef = useRef({
    isDragging: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    lastX: 0,
    lastTs: 0,
    velocityX: 0,
    hadElasticOverdrag: false,
  })

  const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 640
  const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 640

  const syncScrollerState = useCallback(() => {
    const container = containerRef.current
    if (!container || typeof window === "undefined") return

    const desktop = isDesktop()
    const canScroll = container.scrollWidth - container.clientWidth > 8
    setIsDesktopViewport(desktop)
    setShowDesktopButton(desktop && canScroll)
    setIsAtStart(container.scrollLeft <= 8)
  }, [])

  useEffect(() => {
    syncScrollerState()
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", syncScrollerState, { passive: true })
    window.addEventListener("resize", syncScrollerState)

    return () => {
      container.removeEventListener("scroll", syncScrollerState)
      window.removeEventListener("resize", syncScrollerState)
    }
  }, [syncScrollerState, children])

  const applyTrackOffset = (offsetPx: number, animated: boolean) => {
    const track = trackRef.current
    if (!track) return

    track.style.transition = animated
      ? "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none"
    track.style.transform = `translateX(${offsetPx}px)`
  }

  const stopScrollAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopScrollAnimation()
  }, [stopScrollAnimation])

  const animateScrollTo = useCallback(
    (targetLeft: number, duration = 430) => {
      const container = containerRef.current
      if (!container) return
      stopScrollAnimation()

      const startLeft = container.scrollLeft
      const maxScroll = Math.max(container.scrollWidth - container.clientWidth, 0)
      const clampedTarget = Math.max(0, Math.min(targetLeft, maxScroll))
      const distance = clampedTarget - startLeft
      if (Math.abs(distance) < 1) return

      const startTs = performance.now()
      const easeOutCubic = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)

      const step = (now: number) => {
        const elapsed = now - startTs
        const progress = Math.min(elapsed / duration, 1)
        container.scrollLeft = startLeft + distance * easeOutCubic(progress)

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step)
        } else {
          animationFrameRef.current = null
        }
      }

      animationFrameRef.current = requestAnimationFrame(step)
    },
    [stopScrollAnimation]
  )

  const startMomentumScroll = useCallback(
    (initialVelocity: number) => {
      const container = containerRef.current
      if (!container) return
      stopScrollAnimation()

      let velocity = initialVelocity
      let lastTs = performance.now()

      const step = (now: number) => {
        const currentContainer = containerRef.current
        if (!currentContainer) {
          animationFrameRef.current = null
          return
        }

        const dt = Math.max(now - lastTs, 1)
        lastTs = now

        const maxScroll = Math.max(currentContainer.scrollWidth - currentContainer.clientWidth, 0)
        const nextLeft = currentContainer.scrollLeft + velocity * dt

        if (nextLeft <= 0 || nextLeft >= maxScroll) {
          currentContainer.scrollLeft = Math.max(0, Math.min(nextLeft, maxScroll))
          animationFrameRef.current = null
          return
        }

        currentContainer.scrollLeft = nextLeft

        const friction = Math.pow(0.93, dt / 16)
        velocity *= friction

        if (Math.abs(velocity) < 0.02) {
          animationFrameRef.current = null
          return
        }

        animationFrameRef.current = requestAnimationFrame(step)
      }

      animationFrameRef.current = requestAnimationFrame(step)
    },
    [stopScrollAnimation]
  )

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return
    if ((event.target as HTMLElement)?.closest?.("a")) return
    const container = containerRef.current
    if (!container) return

    dragRef.current.isDragging = true
    dragRef.current.startX = event.touches[0].clientX
    dragRef.current.startScrollLeft = container.scrollLeft
    applyTrackOffset(0, false)
  }

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return
    const container = containerRef.current
    if (!container || !dragRef.current.isDragging) return

    const currentX = event.touches[0].clientX
    const deltaX = currentX - dragRef.current.startX
    const desiredScrollLeft = dragRef.current.startScrollLeft - deltaX
    const maxScroll = Math.max(container.scrollWidth - container.clientWidth, 0)

    let offset = 0
    if (desiredScrollLeft < 0) {
      const overdrag = -desiredScrollLeft
      offset = Math.min(overdrag * 0.34, 72)
    } else if (desiredScrollLeft > maxScroll) {
      const overdrag = desiredScrollLeft - maxScroll
      offset = -Math.min(overdrag * 0.34, 72)
    } else {
      container.scrollLeft = desiredScrollLeft
    }

    if (offset !== 0) {
      event.preventDefault()
    }

    applyTrackOffset(offset, false)
  }

  const releaseElastic = () => {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false
    applyTrackOffset(0, true)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDesktopViewport || event.pointerType === "touch" || event.button !== 0) return
    if ((event.target as HTMLElement)?.closest?.("a")) return
    const container = containerRef.current
    if (!container) return

    stopScrollAnimation()
    pointerDragRef.current.isDragging = true
    pointerDragRef.current.pointerId = event.pointerId
    pointerDragRef.current.startX = event.clientX
    pointerDragRef.current.startScrollLeft = container.scrollLeft
    pointerDragRef.current.lastX = event.clientX
    pointerDragRef.current.lastTs = performance.now()
    pointerDragRef.current.velocityX = 0
    pointerDragRef.current.hadElasticOverdrag = false
    container.setPointerCapture(event.pointerId)
    setIsPointerDragging(true)
    applyTrackOffset(0, false)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container || !pointerDragRef.current.isDragging) return

    const now = performance.now()
    const dt = Math.max(now - pointerDragRef.current.lastTs, 1)
    const stepVelocity = (event.clientX - pointerDragRef.current.lastX) / dt
    pointerDragRef.current.velocityX = pointerDragRef.current.velocityX * 0.6 + stepVelocity * 0.4
    pointerDragRef.current.lastX = event.clientX
    pointerDragRef.current.lastTs = now

    const deltaX = event.clientX - pointerDragRef.current.startX
    const desiredScrollLeft = pointerDragRef.current.startScrollLeft - deltaX
    const maxScroll = Math.max(container.scrollWidth - container.clientWidth, 0)

    let offset = 0
    if (desiredScrollLeft < 0) {
      const overdrag = -desiredScrollLeft
      offset = Math.min(overdrag * 0.34, 72)
      pointerDragRef.current.hadElasticOverdrag = true
    } else if (desiredScrollLeft > maxScroll) {
      const overdrag = desiredScrollLeft - maxScroll
      offset = -Math.min(overdrag * 0.34, 72)
      pointerDragRef.current.hadElasticOverdrag = true
    } else {
      container.scrollLeft = desiredScrollLeft
      pointerDragRef.current.hadElasticOverdrag = false
    }

    applyTrackOffset(offset, false)
    event.preventDefault()
  }

  const releasePointerDrag = () => {
    if (!pointerDragRef.current.isDragging) return
    const hadElasticOverdrag = pointerDragRef.current.hadElasticOverdrag
    const velocityX = pointerDragRef.current.velocityX
    pointerDragRef.current.isDragging = false
    pointerDragRef.current.pointerId = -1
    pointerDragRef.current.velocityX = 0
    pointerDragRef.current.hadElasticOverdrag = false
    setIsPointerDragging(false)

    applyTrackOffset(0, true)
    if (!hadElasticOverdrag) {
      const scrollVelocity = -velocityX
      if (Math.abs(scrollVelocity) > 0.08) {
        startMomentumScroll(scrollVelocity)
      }
    }
  }

  const onScrollButtonClick = () => {
    const container = containerRef.current
    if (!container) return

    if (isAtStart) {
      const maxScroll = Math.max(container.scrollWidth - container.clientWidth, 0)
      const nextPosition = Math.min(container.scrollLeft + container.clientWidth * 0.9, maxScroll)
      animateScrollTo(nextPosition, 460)
      return
    }

    animateScrollTo(0, 420)
  }

  const edgeGradientClass = isAtStart
    ? "right-0 bg-gradient-to-l from-[#f7f7f7] via-[#f7f7f7]/92 to-transparent"
    : "left-0 bg-gradient-to-r from-[#f7f7f7] via-[#f7f7f7]/92 to-transparent"

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`-mx-5 overflow-x-auto scrollbar-hide px-5 pb-2 sm:mx-0 sm:px-0 ${isPointerDragging ? "select-none" : ""}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={releaseElastic}
        onTouchCancel={releaseElastic}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointerDrag}
        onPointerCancel={releasePointerDrag}
      >
        <div ref={trackRef} className="flex min-w-max items-start gap-4 pr-5 sm:gap-5 sm:pr-0">
          {children}
        </div>
      </div>

      {showDesktopButton ? (
        <>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 hidden w-24 sm:block ${edgeGradientClass}`}
          />
          <button
            type="button"
            aria-label={isAtStart ? "Arată mai multe lecții" : "Înapoi la început"}
            onClick={onScrollButtonClick}
            className={`absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#2f2f2f] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:scale-110 sm:flex ${
              isAtStart ? "right-2" : "left-2"
            }`}
          >
            <ArrowRight className={`h-5 w-5 ${isAtStart ? "" : "rotate-180"}`} />
          </button>
        </>
      ) : null}
    </div>
  )
}

export function LearningPathsList({ chapters, lessonsByChapter, problemsByChapterId = {} }: LearningPathsListProps) {
  if (!chapters.length) {
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
    <div className="space-y-10 pb-14">
      {chapters.map((chapter, chapterIndex) => {
        const chapterLessons = lessonsByChapter[chapter.id] || []
        const chapterProblems = problemsByChapterId[chapter.id] || []
        const discoverHref = chapter.problem_category
          ? `/probleme?capitol=${encodeURIComponent(chapter.problem_category)}`
          : "/probleme"

        return (
          <section
            key={chapter.id}
            className={chapterIndex === 0 ? "" : "border-t border-[#ececec] pt-10"}
            aria-label={chapter.title}
          >
            <div className="mb-5 flex items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                {chapter.icon_url ? (
                  <img
                    src={chapter.icon_url}
                    alt={chapter.title}
                    className="h-24 w-24 rounded-xl object-contain sm:h-28 sm:w-28"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#5f5f5f] sm:h-28 sm:w-28">
                    <BookOpen className="h-12 w-12 sm:h-14 sm:w-14" />
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold text-[#111111]">{chapter.title}</h2>
                  {chapter.description ? (
                    <p className="mt-0.5 text-sm text-[#707070]">{chapter.description}</p>
                  ) : null}
                </div>
              </div>

            </div>

            <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
              {chapterLessons.length ? (
                <ElasticLessonsScroller>
                    {chapterLessons.map((lesson, lessonIndex) => {
                      const lessonHref =
                        chapter.slug && lesson.slug
                          ? `/invata/${chapter.slug}/${lesson.slug}`
                          : `/invata/${chapter.id}/${lesson.id}`
                      const cardContent = (
                        <div className="relative flex w-[168px] shrink-0 cursor-pointer flex-col items-center sm:w-[190px]">
                        <div className="flex h-[142px] w-[142px] items-center justify-center rounded-2xl border-[3px] border-[#e6e6e6] border-b-[7px] bg-white p-3 transition-[transform,border-color,border-bottom-width] duration-200 hover:translate-y-1 hover:border-[#cfcfcf] hover:border-b-[4px] sm:h-[162px] sm:w-[162px]">
                          {lesson.image_url ? (
                            <img
                              src={lesson.image_url}
                              alt={lesson.title}
                              className="h-full w-full object-contain"
                              loading="lazy"
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

                      return (
                        <Link key={lesson.id} href={lessonHref} className="block shrink-0">
                          {cardContent}
                        </Link>
                      )
                    })}
                </ElasticLessonsScroller>
              ) : (
                <p className="text-sm text-[#7a7a7a]">Acest capitol nu are încă lecții.</p>
              )}
            </div>

            {chapterProblems.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-[#ececec] bg-white p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {chapterProblems.map((problem) => (
                    <Link
                      key={problem.id}
                      href={`/probleme/${problem.id}`}
                      className="rounded-xl border border-[#ededed] bg-[#fafafa] p-4 transition-colors hover:border-[#dcdcdc] hover:bg-[#f4f4f4]"
                    >
                      <p className="text-xs font-semibold tracking-wide text-[#6d6d6d]">{problem.id}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-[#1f1f1f]">{problem.title}</p>
                      <p className="mt-2 text-xs text-[#6d6d6d]">{problem.difficulty || "Nivel mixt"}</p>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    href={discoverHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Descoperă mai mult
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from "react"
import { ArrowRight } from "lucide-react"

export interface ElasticLessonsScrollerProps {
  children: ReactNode
  /** When false, parent already breaks out to viewport edges (e.g. full-bleed section). */
  bleedMargins?: boolean
}

export function ElasticLessonsScroller({
  children,
  bleedMargins = true,
}: ElasticLessonsScrollerProps) {
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
        className={
          bleedMargins
            ? `-mx-5 overflow-x-auto scrollbar-hide px-5 pb-2 sm:mx-0 sm:px-0 ${isPointerDragging ? "select-none" : ""}`
            : `overflow-x-auto scrollbar-hide px-5 pb-2 ${isPointerDragging ? "select-none" : ""}`
        }
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={releaseElastic}
        onTouchCancel={releaseElastic}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointerDrag}
        onPointerCancel={releasePointerDrag}
      >
        <div
          ref={trackRef}
          className={`flex min-w-max items-start gap-4 sm:gap-5 ${bleedMargins ? "pr-5 sm:pr-0" : "pr-5"}`}
        >
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

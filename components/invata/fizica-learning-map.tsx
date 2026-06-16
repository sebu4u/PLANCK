"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import InsightChatSidebar from "@/components/insight-chat-sidebar"
import { BookOpen, ChevronDown, Clock, FastForward, Map, PenLine, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS, MOBILE_BOTTOM_NAV_OFFSET_CLASS, MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import {
  FIZICA_HUB_CARDS_ENABLED,
  FIZICA_INSIGHT_STARTER_CHIPS,
  FIZICA_LESSON_TYPE_LABEL,
  type FizicaLessonType,
} from "@/lib/invata-fizica-config"
import { computeFizicaMapMinHeight } from "@/lib/fizica-map-layout"
import { FizicaSimulationCards } from "@/components/invata/fizica-simulation-cards"
import { FizicaBacCountdown } from "@/components/invata/fizica-bac-countdown"
import { InvataSubjectSelector } from "@/components/invata/invata-subject-selector"
import { LearningPathUpNextSection } from "@/components/invata/learning-path-up-next-section"
import { INVATA_SUBJECTS, type InvataSubjectId } from "@/lib/invata-config"
import type { FizicaHubCardsData } from "@/lib/supabase-fizica-simulations"
import {
  getFizicaMapHref,
  type FizicaMapLesson,
  type FizicaMapPageData,
} from "@/lib/supabase-fizica-learning-map"

type MapLesson = FizicaMapLesson

function buildFizicaMapInsightContext(mapData: FizicaMapPageData): string {
  const { selectedRoute, selectedChapter, lessons } = mapData
  const parts = [
    "Context: utilizatorul este pe harta lecțiilor de fizică (Planck Academy — /invata/fizica).",
    "Rolul tău: tutor de fizică pentru liceu; răspunde clar, pas cu pas, în română.",
  ]

  if (selectedRoute) {
    parts.push(`Traseu selectat: ${selectedRoute.title}.`)
  }

  if (selectedChapter) {
    parts.push(`Capitol curent: ${selectedChapter.title}.`)
  }

  if (lessons.length > 0) {
    parts.push("", "Lecții în capitolul curent:")
    for (const lesson of lessons) {
      parts.push(
        `- ${lesson.title} (${FIZICA_LESSON_TYPE_LABEL[lesson.type]}, ${lesson.durationMinutes} min, status: ${lesson.status})`,
      )
    }
  }

  return parts.join("\n")
}

function LessonTypeIcon({ type, className }: { type: FizicaLessonType; className?: string }) {
  if (type === "scrie") {
    return <PenLine className={className} aria-hidden />
  }
  return <BookOpen className={className} aria-hidden />
}

function SidebarNav({ mapData }: { mapData: FizicaMapPageData }) {
  const { routes, chapters, selectedRoute, selectedChapter } = mapData

  return (
    <nav className="space-y-4" aria-label="Navigare fizică">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/55">
        Fizică
      </p>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c2f33]/45">
          Trasee
        </p>
        <div className="space-y-1">
          {routes.map((route) => {
            const isActive = selectedRoute?.id === route.id
            const href = `/invata/fizica?traseu=${encodeURIComponent(route.slug)}`

            return (
              <Link
                key={route.id}
                href={href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#2c2f33]/80 transition-colors hover:bg-[#faf9f7] hover:text-[#0b0c0f]",
                  isActive && "bg-[#f5f4f2] text-[#0b0c0f]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-white shadow-sm" : "bg-[#f5f4f2]",
                  )}
                >
                  <Map className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{route.title}</span>
                  <span className="block truncate text-xs text-[#2c2f33]/60">Traseu</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {selectedRoute ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2c2f33]/45">
            Capitole
          </p>
          {chapters.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#0b0c0f]/10 px-3 py-4 text-sm text-[#2c2f33]/60">
              Nu există capitole pentru acest traseu încă.
            </p>
          ) : (
            <div className="space-y-1">
              {chapters.map((chapter) => {
                const isActive = selectedChapter?.id === chapter.id
                return (
                  <Link
                    key={chapter.id}
                    href={getFizicaMapHref(selectedRoute.slug, chapter.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[#2c2f33]/80 transition-colors hover:bg-[#faf9f7] hover:text-[#0b0c0f]",
                      isActive && "bg-[#f5f4f2] text-[#0b0c0f]",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{chapter.title}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </nav>
  )
}

function MobileRouteChapterPicker({ mapData }: { mapData: FizicaMapPageData }) {
  const { routes, chapters, selectedRoute, selectedChapter } = mapData

  if (!selectedRoute) return null

  return (
    <div className="mb-6 space-y-3 lg:hidden">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#2c2f33]/55">
          Traseu
        </span>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-[#0b0c0f]/10 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-[#0b0c0f]"
            value={selectedRoute.slug}
            onChange={(event) => {
              const nextRoute = routes.find((route) => route.slug === event.target.value)
              if (!nextRoute) return
              window.location.href = `/invata/fizica?traseu=${encodeURIComponent(nextRoute.slug)}`
            }}
          >
            {routes.map((route) => (
              <option key={route.id} value={route.slug}>
                {route.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2c2f33]/50" />
        </div>
      </label>

      {chapters.length > 0 ? (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#2c2f33]/55">
            Capitol
          </span>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-[#0b0c0f]/10 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-[#0b0c0f]"
              value={selectedChapter?.slug ?? ""}
              onChange={(event) => {
                window.location.href = getFizicaMapHref(selectedRoute.slug, event.target.value)
              }}
            >
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.slug}>
                  {chapter.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2c2f33]/50" />
          </div>
        </label>
      ) : null}
    </div>
  )
}

function LessonNode({ lesson, isActive }: { lesson: MapLesson; isActive: boolean }) {
  return (
    <div
      data-map-node={lesson.id}
      className={cn(
        "relative z-[3] flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-b-[6px]",
        isActive
          ? "border-[#ffc800] border-b-[#e5a800] bg-[#ffc800] text-[#3d2800]"
          : "border-[#2b5797] border-b-[#1a3d6b] bg-[#2b5797] text-white",
      )}
    >
      <LessonTypeIcon type={lesson.type} className="h-7 w-7" />
    </div>
  )
}

function LessonCard({ lesson, compact = false }: { lesson: MapLesson; compact?: boolean }) {
  const isActive = lesson.status === "active"
  const isLocked = lesson.status === "locked"
  const canStart = !!lesson.href && !isLocked

  const startButtonClassName = cn(
    "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-b-[5px] px-4 py-2 text-sm font-bold",
    isLocked
      ? "cursor-not-allowed border-[#143660] border-b-[#0d2540] bg-[#1a3d6b] text-[#8eb5e0]"
      : "border-[#143660] border-b-[#0d2540] bg-[#1a3d6b] text-[#e8f2ff] hover:bg-[#1f4578]",
  )

  return (
    <article
      data-map-card={lesson.id}
      className={cn(
        "relative z-[3] w-full rounded-2xl border-[3px] border-b-[6px] px-4 py-3.5",
        compact ? "max-w-none" : "w-[min(100%,320px)]",
        isActive
          ? "border-[#ffc800] border-b-[#c68a00] bg-[#ffc800] text-[#2a1f00]"
          : "border-[#2b5797] border-b-[#143660] bg-[#234a7a] text-[#d8e8ff]",
        isLocked && "opacity-55",
      )}
    >
      <h3
        className={cn(
          "text-sm font-bold leading-snug",
          isActive ? "text-[#2a1f00]" : "text-[#e8f2ff]",
        )}
      >
        {lesson.title}
      </h3>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
            isActive ? "bg-[#c68a00] text-white" : "bg-[#1a3d6b] text-[#b8d4f5]",
          )}
        >
          {FIZICA_LESSON_TYPE_LABEL[lesson.type]}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold",
            isActive ? "text-[#4a3500]" : "text-[#a8c8ef]",
          )}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {lesson.durationMinutes}m
        </span>
      </div>

      {isActive ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-label="Salt rapid"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[3px] border-b-[5px] border-[#c68a00] border-b-[#9a6800] bg-[#e5a800] text-white"
          >
            <FastForward className="h-4 w-4" aria-hidden />
          </button>
          {canStart && lesson.href ? (
            <Link
              href={lesson.href}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border-[3px] border-b-[5px] border-[#c68a00] border-b-[#9a6800] bg-[#e5a800] px-4 text-sm font-bold text-white"
            >
              Continuă
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border-[3px] border-b-[5px] border-[#c68a00] border-b-[#9a6800] bg-[#e5a800] px-4 text-sm font-bold text-white"
            >
              Continuă
            </button>
          )}
        </div>
      ) : canStart && lesson.href ? (
        <Link href={lesson.href} className={startButtonClassName}>
          <Play className="h-4 w-4" aria-hidden />
          Începe
        </Link>
      ) : (
        <button type="button" disabled={isLocked} className={startButtonClassName}>
          <Play className="h-4 w-4" aria-hidden />
          Începe
        </button>
      )}
    </article>
  )
}

const NODE_RADIUS = 36
const CARD_CLEARANCE = 20
const PATH_DASH = 10
const PATH_GAP = 10

type OrthogonalPath = { d: string }

function rectRelativeTo(rect: DOMRect, containerRect: DOMRect) {
  return {
    left: rect.left - containerRect.left,
    right: rect.right - containerRect.left,
    top: rect.top - containerRect.top,
    bottom: rect.bottom - containerRect.top,
  }
}

function buildMobileZigzagPath(
  fromNode: DOMRect,
  toNode: DOMRect,
  fromCard: DOMRect | null,
  toCard: DOMRect | null,
  containerRect: DOMRect,
): OrthogonalPath {
  const ax = fromNode.left + fromNode.width / 2 - containerRect.left
  const ay = fromNode.top + fromNode.height / 2 - containerRect.top
  const bx = toNode.left + toNode.width / 2 - containerRect.left
  const by = toNode.top + toNode.height / 2 - containerRect.top

  const startY = ay + NODE_RADIUS
  const endY = by - NODE_RADIUS
  let midY = (startY + endY) / 2

  const horizontalMinX = Math.min(ax, bx)
  const horizontalMaxX = Math.max(ax, bx)

  for (const card of [fromCard, toCard]) {
    if (!card) continue
    const cardRect = rectRelativeTo(card, containerRect)
    const intersectsHorizontalBand =
      midY >= cardRect.top - CARD_CLEARANCE && midY <= cardRect.bottom + CARD_CLEARANCE
    const intersectsHorizontalSpan =
      horizontalMaxX >= cardRect.left - CARD_CLEARANCE &&
      horizontalMinX <= cardRect.right + CARD_CLEARANCE

    if (intersectsHorizontalBand && intersectsHorizontalSpan) {
      midY = Math.max(midY, cardRect.bottom + CARD_CLEARANCE)
    }
  }

  const minMidY = startY + CARD_CLEARANCE
  const maxMidY = endY - CARD_CLEARANCE
  midY = Math.min(Math.max(midY, minMidY), maxMidY)

  return {
    d: `M ${ax} ${startY} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${endY}`,
  }
}

function buildOrthogonalSegments(
  fromNode: DOMRect,
  toNode: DOMRect,
  fromCard: DOMRect | null,
  toCard: DOMRect | null,
  _fromCardBelow: boolean,
  toCardBelow: boolean,
  containerRect: DOMRect,
): OrthogonalPath[] {
  const ax = fromNode.left + fromNode.width / 2 - containerRect.left
  const ay = fromNode.top + fromNode.height / 2 - containerRect.top
  const bx = toNode.left + toNode.width / 2 - containerRect.left
  const by = toNode.top + toNode.height / 2 - containerRect.top

  const sameColumn = Math.abs(ax - bx) < 48

  if (sameColumn) {
    const goingDown = by > ay
    const startY = ay + (goingDown ? NODE_RADIUS : -NODE_RADIUS)
    const endY = by + (goingDown ? -NODE_RADIUS : NODE_RADIUS)
    return [{ d: `M ${ax} ${startY} L ${ax} ${endY}` }]
  }

  const goingRight = bx > ax
  const direction = goingRight ? 1 : -1
  const fromCardRect = fromCard ? rectRelativeTo(fromCard, containerRect) : null
  const toCardRect = toCard ? rectRelativeTo(toCard, containerRect) : null

  const startX = ax + direction * NODE_RADIUS
  const targetSideX = bx - direction * NODE_RADIUS

  const fromOuterEdge = fromCardRect
    ? goingRight
      ? fromCardRect.right
      : fromCardRect.left
    : ax
  const toOuterEdge = toCardRect
    ? goingRight
      ? toCardRect.left
      : toCardRect.right
    : bx

  const fromLaneX = fromOuterEdge + direction * CARD_CLEARANCE
  const toLaneLimitX = toOuterEdge - direction * CARD_CLEARANCE
  const hasClearLane = goingRight ? fromLaneX <= toLaneLimitX : fromLaneX >= toLaneLimitX
  const laneX =
    hasClearLane || !fromCardRect || !toCardRect
      ? fromLaneX
      : (fromOuterEdge + toOuterEdge) / 2

  const endY = !toCardBelow ? by : by - NODE_RADIUS

  return [
    {
      d: [
        `M ${startX} ${ay}`,
        `L ${laneX} ${ay}`,
        `L ${laneX} ${endY}`,
        `L ${targetSideX} ${endY}`,
      ].join(" "),
    },
  ]
}

function MobileMapPath({
  containerRef,
  lessons,
  selectedLessonId,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  lessons: MapLesson[]
  selectedLessonId: string | null
}) {
  const [paths, setPaths] = useState<OrthogonalPath[]>([])
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  const updatePaths = useCallback(() => {
    const container = containerRef.current
    if (!container || lessons.length < 2) {
      setPaths([])
      return
    }

    const containerRect = container.getBoundingClientRect()
    setSvgSize({ width: containerRect.width, height: containerRect.height })

    const nextPaths: OrthogonalPath[] = []

    for (let i = 0; i < lessons.length - 1; i++) {
      const from = lessons[i]
      const to = lessons[i + 1]
      const fromNode = container.querySelector<HTMLElement>(`[data-map-node="${from.id}"]`)
      const toNode = container.querySelector<HTMLElement>(`[data-map-node="${to.id}"]`)
      if (!fromNode || !toNode) continue

      const fromCard = container.querySelector<HTMLElement>(`[data-map-card="${from.id}"]`)
      const toCard = container.querySelector<HTMLElement>(`[data-map-card="${to.id}"]`)

      nextPaths.push(
        buildMobileZigzagPath(
          fromNode.getBoundingClientRect(),
          toNode.getBoundingClientRect(),
          fromCard?.getBoundingClientRect() ?? null,
          toCard?.getBoundingClientRect() ?? null,
          containerRect,
        ),
      )
    }

    setPaths(nextPaths)
  }, [containerRef, lessons, selectedLessonId])

  useEffect(() => {
    updatePaths()
    const raf = window.requestAnimationFrame(updatePaths)

    const container = containerRef.current
    if (!container) return () => window.cancelAnimationFrame(raf)

    const resizeObserver = new ResizeObserver(() => updatePaths())
    resizeObserver.observe(container)

    window.addEventListener("resize", updatePaths)
    window.addEventListener("scroll", updatePaths, { passive: true })

    return () => {
      window.cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePaths)
      window.removeEventListener("scroll", updatePaths)
    }
  }, [containerRef, updatePaths])

  if (paths.length === 0 || svgSize.width === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      width={svgSize.width}
      height={svgSize.height}
      aria-hidden
    >
      {paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill="none"
          stroke="#3d6fa8"
          strokeWidth={4.5}
          strokeDasharray={`${PATH_DASH} ${PATH_GAP}`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

function MapPath({
  containerRef,
  lessons,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  lessons: MapLesson[]
}) {
  const [paths, setPaths] = useState<OrthogonalPath[]>([])
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  const updatePaths = useCallback(() => {
    const container = containerRef.current
    if (!container || lessons.length < 2) {
      setPaths([])
      return
    }

    const containerRect = container.getBoundingClientRect()
    setSvgSize({ width: containerRect.width, height: containerRect.height })

    const nextPaths: OrthogonalPath[] = []

    for (let i = 0; i < lessons.length - 1; i++) {
      const from = lessons[i]
      const to = lessons[i + 1]
      const fromNode = container.querySelector<HTMLElement>(`[data-map-node="${from.id}"]`)
      const toNode = container.querySelector<HTMLElement>(`[data-map-node="${to.id}"]`)
      if (!fromNode || !toNode) continue

      const fromCard = container.querySelector<HTMLElement>(`[data-map-card="${from.id}"]`)
      const toCard = container.querySelector<HTMLElement>(`[data-map-card="${to.id}"]`)

      nextPaths.push(
        ...buildOrthogonalSegments(
          fromNode.getBoundingClientRect(),
          toNode.getBoundingClientRect(),
          fromCard?.getBoundingClientRect() ?? null,
          toCard?.getBoundingClientRect() ?? null,
          from.cardPosition === "below",
          to.cardPosition === "below",
          containerRect,
        ),
      )
    }

    setPaths(nextPaths)
  }, [containerRef, lessons])

  useEffect(() => {
    updatePaths()
    const raf = window.requestAnimationFrame(updatePaths)

    const container = containerRef.current
    if (!container) return () => window.cancelAnimationFrame(raf)

    const resizeObserver = new ResizeObserver(() => updatePaths())
    resizeObserver.observe(container)

    window.addEventListener("resize", updatePaths)
    window.addEventListener("scroll", updatePaths, { passive: true })

    return () => {
      window.cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePaths)
      window.removeEventListener("scroll", updatePaths)
    }
  }, [containerRef, updatePaths])

  if (paths.length === 0 || svgSize.width === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      width={svgSize.width}
      height={svgSize.height}
      aria-hidden
    >
      {paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill="none"
          stroke="#3d6fa8"
          strokeWidth={4.5}
          strokeDasharray={`${PATH_DASH} ${PATH_GAP}`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

function DesktopMap({ lessons }: { lessons: MapLesson[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const minHeight = computeFizicaMapMinHeight(lessons)

  if (lessons.length === 0) {
    return (
      <div className="hidden rounded-2xl border border-dashed border-[#0b0c0f]/10 bg-white/70 px-6 py-16 text-center lg:block">
        <p className="text-base font-semibold text-[#0b0c0f]">Nu există lecții în acest capitol.</p>
        <p className="mt-2 text-sm text-[#2c2f33]/65">
          Adaugă lecții din admin pentru a le afișa pe hartă.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden lg:block"
      style={{ minHeight }}
    >
      <MapPath containerRef={containerRef} lessons={lessons} />
      {lessons.map((lesson) => (
        <DesktopLessonMarker key={lesson.id} lesson={lesson} />
      ))}
    </div>
  )
}

function DesktopLessonMarker({ lesson }: { lesson: MapLesson }) {
  const isActive = lesson.status === "active"
  const cardAbove = lesson.cardPosition === "above"

  return (
    <div
      className="absolute z-[2] flex -translate-x-1/2 flex-col items-center"
      style={{
        left: `${lesson.xPercent}%`,
        top: lesson.y,
      }}
    >
      {cardAbove ? (
        <>
          <div className="mb-3">
            <LessonCard lesson={lesson} />
          </div>
          <LessonNode lesson={lesson} isActive={isActive} />
        </>
      ) : (
        <>
          <LessonNode lesson={lesson} isActive={isActive} />
          <div className="mt-3">
            <LessonCard lesson={lesson} />
          </div>
        </>
      )}
    </div>
  )
}

function isMobileLeftSide(index: number): boolean {
  return index % 2 === 0
}

function MobileLessonMarker({
  lesson,
  index,
  isSelected,
  onSelect,
}: {
  lesson: MapLesson
  index: number
  isSelected: boolean
  onSelect: () => void
}) {
  const isLeft = isMobileLeftSide(index)

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-3",
        isSelected && "z-[4]",
        isLeft ? "flex-row justify-start pl-2 pr-3" : "flex-row-reverse justify-start pr-2 pl-3",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative z-[5] shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc800]/60 focus-visible:ring-offset-2"
        aria-pressed={isSelected}
        aria-label={lesson.title}
      >
        <LessonNode lesson={lesson} isActive={isSelected} />
      </button>
      {isSelected ? (
        <div className="relative z-[5] min-w-0 flex-1 pt-0.5">
          <LessonCard lesson={lesson} compact />
        </div>
      ) : null}
    </div>
  )
}

function MobileMap({ lessons, chapterKey }: { lessons: MapLesson[]; chapterKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultSelectedId = useMemo(() => {
    return (
      lessons.find((lesson) => lesson.status === "active")?.id ??
      lessons.find((lesson) => lesson.status === "available")?.id ??
      lessons[0]?.id ??
      null
    )
  }, [lessons])

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId)

  useEffect(() => {
    setSelectedId(defaultSelectedId)
  }, [chapterKey, defaultSelectedId])

  const activeSelectedId = selectedId ?? defaultSelectedId

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#0b0c0f]/10 bg-white/70 px-6 py-12 text-center lg:hidden">
        <p className="text-base font-semibold text-[#0b0c0f]">Nu există lecții în acest capitol.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative py-2 lg:hidden">
      <MobileMapPath
        containerRef={containerRef}
        lessons={lessons}
        selectedLessonId={activeSelectedId}
      />
      <div className="relative z-[2] flex flex-col gap-y-14">
        {lessons.map((lesson, index) => (
          <MobileLessonMarker
            key={lesson.id}
            lesson={lesson}
            index={index}
            isSelected={lesson.id === activeSelectedId}
            onSelect={() => setSelectedId(lesson.id)}
          />
        ))}
      </div>
    </div>
  )
}

export function FizicaLearningMap({
  hubCards,
  mapData,
}: {
  hubCards: FizicaHubCardsData
  mapData: FizicaMapPageData
}) {
  const router = useRouter()
  const [isOpeningNextChapter, setIsOpeningNextChapter] = useState(false)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [chatPanelMounted, setChatPanelMounted] = useState(false)
  const [chatPanelOpen, setChatPanelOpen] = useState(false)
  const {
    lessons,
    selectedRoute,
    selectedChapter,
    nextChapter,
    isCurrentChapterComplete,
  } = mapData
  const showHubCards =
    FIZICA_HUB_CARDS_ENABLED &&
    (hubCards.preparations.length > 0 || hubCards.nextSimulation !== null)

  useEffect(() => {
    const sync = () => setIsDesktopViewport(typeof window !== "undefined" && window.innerWidth >= 1024)
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  const chatContext = useMemo(() => buildFizicaMapInsightContext(mapData), [mapData])
  const chatProblemId = useMemo(() => {
    const routeSlug = selectedRoute?.slug ?? "default"
    const chapterSlug = selectedChapter?.slug ?? "default"
    return `invata-fizica-map:${routeSlug}:${chapterSlug}`
  }, [selectedChapter?.slug, selectedRoute?.slug])

  const embedChatOnDesktop = chatPanelMounted && isDesktopViewport

  const openChat = useCallback(() => {
    setChatPanelMounted(true)
    setChatPanelOpen(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setChatPanelOpen(true)
      })
    })
  }, [])

  const closeChat = useCallback(() => {
    setChatPanelOpen(false)
  }, [])

  const finalizeChatClose = useCallback(() => {
    setChatPanelMounted(false)
    setChatPanelOpen(false)
  }, [])

  const handleJumpToNextChapter = useCallback(() => {
    if (!nextChapter || !selectedRoute || isOpeningNextChapter || !isCurrentChapterComplete) return
    setIsOpeningNextChapter(true)
    router.push(getFizicaMapHref(selectedRoute.slug, nextChapter.slug))
  }, [isCurrentChapterComplete, isOpeningNextChapter, nextChapter, router, selectedRoute])

  const handleSubjectSelect = useCallback(
    (id: InvataSubjectId) => {
      const subject = INVATA_SUBJECTS.find((entry) => entry.id === id)
      if (subject) {
        router.push(subject.href)
      }
    },
    [router],
  )

  return (
    <div className="flex h-full min-h-0 flex-row">
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[300px] bg-white lg:block">
        <div className="catalog-sidebar-scroll flex h-full flex-col overflow-y-auto px-5 py-5">
          <SidebarNav mapData={mapData} />
          <div className="mt-auto pt-8">
            <FizicaBacCountdown />
            <InvataSubjectSelector
              selectedId="fizica"
              onSelect={handleSubjectSelect}
              variant="sidebar"
            />
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "relative min-w-0 flex-1 lg:ml-[300px] h-full transition-[margin] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          embedChatOnDesktop && "lg:mr-[25vw]",
        )}
      >
        <div className="absolute inset-0 top-0 overflow-hidden bg-white lg:inset-[3px] lg:rounded-xl lg:bg-[#f5f4f2]">
          <div
            className={cn(
              "catalog-problems-scroll h-full overflow-y-auto",
              showHubCards ? "pb-36 sm:pb-32" : "pb-12",
              MOBILE_BOTTOM_NAV_PADDING_CLASS,
              "burger:pb-12",
            )}
          >
            <div className="px-5 pb-12 pt-5 sm:px-8 lg:px-10 xl:px-12">
              <MobileRouteChapterPicker mapData={mapData} />
              <DesktopMap lessons={lessons} />
              <MobileMap
                lessons={lessons}
                chapterKey={selectedChapter?.id ?? selectedRoute?.slug ?? "default"}
              />

              {nextChapter && selectedRoute ? (
                <LearningPathUpNextSection
                  heading="Următorul"
                  ariaLabel="Următorul capitol"
                  title={nextChapter.title}
                  description="Continuă traseul cu următorul capitol."
                  isCurrentLessonComplete={isCurrentChapterComplete}
                  isOpening={isOpeningNextChapter}
                  onJumpAhead={handleJumpToNextChapter}
                  incompleteMessage="Îți recomandăm să termini tot capitolul curent înainte să treci la următorul."
                  className="pb-4 lg:pb-8"
                />
              ) : null}
            </div>
          </div>

          {showHubCards ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 pt-6 sm:px-6 lg:px-8",
                MOBILE_BOTTOM_NAV_OFFSET_CLASS,
              )}
            >
              <div className="pointer-events-auto w-full max-w-3xl">
                <FizicaSimulationCards
                  preparations={hubCards.preparations}
                  nextSimulation={hubCards.nextSimulation}
                  overlay
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!chatPanelMounted ? (
        <button
          type="button"
          onClick={openChat}
          aria-label="Deschide asistent AI"
          className={cn(
            "fixed bottom-6 right-5 z-[90] flex h-24 w-24 items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95",
            "lg:bottom-8 lg:right-8",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0c0f]/20 focus-visible:ring-offset-2",
            MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS,
          )}
        >
          <img
            src="/streak-icon.png"
            alt=""
            className="h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(11,12,15,0.28)]"
            width={96}
            height={96}
          />
        </button>
      ) : null}

      {chatPanelMounted ? (
        <InsightChatSidebar
          isOpen={chatPanelOpen}
          onClose={closeChat}
          problemId={chatProblemId}
          problemStatement={chatContext}
          persona="problem_tutor"
          embedOnDesktop={embedChatOnDesktop}
          problemLightTheme
          lightChromeWhenSlideOver={false}
          showCloseWhenDesktopEmbedded={embedChatOnDesktop}
          embedDesktopTopClass="top-16"
          embedDesktopHeightClass="h-[calc(100dvh-4rem)]"
          onExitAnimationComplete={finalizeChatClose}
          starterQuestionChips={FIZICA_INSIGHT_STARTER_CHIPS}
          disableEntranceAnimations
          panelSlideTransitionClass="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        />
      ) : null}
    </div>
  )
}

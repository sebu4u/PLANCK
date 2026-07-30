"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { cn } from "@/lib/utils"
import {
  buildTrophyRoadMapLayouts,
  computeTrophyRoadMapMinHeight,
  isMobileLeftSide,
  type TrophyRoadMapLayout,
} from "@/lib/trophy-road/map-layout"
import {
  getMilestoneState,
  getNextMilestone,
} from "@/lib/trophy-road/milestones"
import {
  TrophyRoadCircleNode,
  TrophyRoadRewardCard,
} from "./trophy-road-reward-node"

const PATH_STROKE = "#9ca3af"
const NODE_RADIUS_MOBILE = 36
const NODE_RADIUS_DESKTOP = 52
const CARD_CLEARANCE = 18
const POP_STAGGER_MS = 40

interface PathSegment {
  d: string
  pairIndex: number
}

function rectRelativeTo(rect: DOMRect, container: DOMRect) {
  return {
    left: rect.left - container.left,
    right: rect.right - container.left,
    top: rect.top - container.top,
    bottom: rect.bottom - container.top,
  }
}

function buildMobileZigzagPath(
  fromNode: DOMRect,
  toNode: DOMRect,
  fromCard: DOMRect | null,
  toCard: DOMRect | null,
  containerRect: DOMRect,
  nodeRadius: number,
): { d: string } {
  const ax = fromNode.left + fromNode.width / 2 - containerRect.left
  const ay = fromNode.top + fromNode.height / 2 - containerRect.top
  const bx = toNode.left + toNode.width / 2 - containerRect.left
  const by = toNode.top + toNode.height / 2 - containerRect.top

  const startY = ay + nodeRadius
  const endY = by - nodeRadius
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
  toCardBelow: boolean,
  containerRect: DOMRect,
  nodeRadius: number,
): { d: string }[] {
  const ax = fromNode.left + fromNode.width / 2 - containerRect.left
  const ay = fromNode.top + fromNode.height / 2 - containerRect.top
  const bx = toNode.left + toNode.width / 2 - containerRect.left
  const by = toNode.top + toNode.height / 2 - containerRect.top

  const sameColumn = Math.abs(ax - bx) < 48

  if (sameColumn) {
    const goingDown = by > ay
    const startY = ay + (goingDown ? nodeRadius : -nodeRadius)
    const endY = by + (goingDown ? -nodeRadius : nodeRadius)
    return [{ d: `M ${ax} ${startY} L ${ax} ${endY}` }]
  }

  const goingRight = bx > ax
  const direction = goingRight ? 1 : -1
  const fromCardRect = fromCard ? rectRelativeTo(fromCard, containerRect) : null
  const toCardRect = toCard ? rectRelativeTo(toCard, containerRect) : null

  const startX = ax + direction * nodeRadius
  const targetSideX = bx - direction * nodeRadius

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

  const endY = !toCardBelow ? by : by - nodeRadius

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

function useMapPathLayout(
  containerRef: RefObject<HTMLDivElement | null>,
  updatePaths: () => void,
  nodeCount: number,
) {
  useEffect(() => {
    const timeouts: number[] = []
    const schedule = (delay: number) => {
      timeouts.push(window.setTimeout(updatePaths, delay))
    }

    updatePaths()
    const raf = window.requestAnimationFrame(() => {
      updatePaths()
      window.requestAnimationFrame(updatePaths)
    })

    schedule(50)
    schedule(Math.max(0, nodeCount - 1) * POP_STAGGER_MS + 200)

    const container = containerRef.current
    if (!container) {
      return () => {
        window.cancelAnimationFrame(raf)
        timeouts.forEach(clearTimeout)
      }
    }

    const resizeObserver = new ResizeObserver(updatePaths)
    resizeObserver.observe(container)
    container.querySelectorAll("[data-map-node], [data-map-card]").forEach((el) => {
      resizeObserver.observe(el)
    })

    window.addEventListener("resize", updatePaths)

    return () => {
      window.cancelAnimationFrame(raf)
      timeouts.forEach(clearTimeout)
      resizeObserver.disconnect()
      window.removeEventListener("resize", updatePaths)
    }
  }, [containerRef, updatePaths, nodeCount])
}

function MapPathSvg({
  containerRef,
  layouts,
  mode,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  layouts: TrophyRoadMapLayout[]
  mode: "desktop" | "mobile"
}) {
  const [paths, setPaths] = useState<PathSegment[]>([])
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })

  const updatePaths = useCallback(() => {
    const container = containerRef.current
    if (!container || layouts.length < 2) {
      setPaths([])
      return
    }

    const containerRect = container.getBoundingClientRect()
    setSvgSize({
      width: container.scrollWidth || containerRect.width,
      height: container.scrollHeight || containerRect.height,
    })

    const nextPaths: PathSegment[] = []

    const nodeRadius = mode === "mobile" ? NODE_RADIUS_MOBILE : NODE_RADIUS_DESKTOP

    for (let i = 0; i < layouts.length - 1; i++) {
      const from = layouts[i]
      const to = layouts[i + 1]
      const fromNode = container.querySelector<HTMLElement>(`[data-map-node="${from.id}"]`)
      const toNode = container.querySelector<HTMLElement>(`[data-map-node="${to.id}"]`)
      if (!fromNode || !toNode) continue

      const fromCard = container.querySelector<HTMLElement>(`[data-map-card="${from.id}"]`)
      const toCard = container.querySelector<HTMLElement>(`[data-map-card="${to.id}"]`)

      if (mode === "mobile") {
        nextPaths.push({
          ...buildMobileZigzagPath(
            fromNode.getBoundingClientRect(),
            toNode.getBoundingClientRect(),
            fromCard?.getBoundingClientRect() ?? null,
            toCard?.getBoundingClientRect() ?? null,
            containerRect,
            nodeRadius,
          ),
          pairIndex: i,
        })
      } else {
        nextPaths.push(
          ...buildOrthogonalSegments(
            fromNode.getBoundingClientRect(),
            toNode.getBoundingClientRect(),
            fromCard?.getBoundingClientRect() ?? null,
            toCard?.getBoundingClientRect() ?? null,
            to.cardPosition === "below",
            containerRect,
            nodeRadius,
          ).map((segment) => ({ ...segment, pairIndex: i })),
        )
      }
    }

    setPaths(nextPaths)
  }, [containerRef, layouts, mode])

  useMapPathLayout(containerRef, updatePaths, layouts.length)

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
          key={`${path.pairIndex}-${index}`}
          d={path.d}
          fill="none"
          stroke={PATH_STROKE}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="fizica-map-path-dashed"
        />
      ))}
    </svg>
  )
}

function DesktopMarker({
  layout,
  userElo,
  trophiesNeeded,
}: {
  layout: TrophyRoadMapLayout
  userElo: number
  trophiesNeeded?: number
}) {
  const state = getMilestoneState(layout.threshold, userElo)
  const cardAbove = layout.cardPosition === "above"
  const node = <TrophyRoadCircleNode milestone={layout} state={state} size="lg" />
  const card = (
    <TrophyRoadRewardCard
      milestone={layout}
      state={state}
      trophiesNeeded={state === "current" ? trophiesNeeded : undefined}
      size="lg"
    />
  )

  return (
    <div
      data-trophy-road-marker={layout.id}
      data-threshold={layout.threshold}
      className={cn(
        "absolute flex -translate-x-1/2 scroll-my-28 flex-col items-center",
        state === "current" ? "z-[4]" : "z-[2]",
      )}
      style={{
        left: `${layout.xPercent}%`,
        top: layout.y,
        contentVisibility: "auto",
        containIntrinsicSize: "340px 300px",
      }}
    >
      <div
        className="fizica-map-item-pop flex flex-col items-center"
        style={{ animationDelay: `${layout.index * POP_STAGGER_MS}ms` }}
      >
        {cardAbove ? (
          <>
            <div className="mb-4">{card}</div>
            {node}
          </>
        ) : (
          <>
            {node}
            <div className="mt-4">{card}</div>
          </>
        )}
      </div>
    </div>
  )
}

function MobileMarker({
  layout,
  userElo,
  trophiesNeeded,
}: {
  layout: TrophyRoadMapLayout
  userElo: number
  trophiesNeeded?: number
}) {
  const state = getMilestoneState(layout.threshold, userElo)
  const isLeft = isMobileLeftSide(layout.index)

  return (
    <div
      data-trophy-road-marker={layout.id}
      data-threshold={layout.threshold}
      className={cn(
        "relative flex w-full scroll-my-20 items-start gap-3",
        state === "current" ? "z-[4]" : "z-[2]",
        isLeft ? "flex-row justify-start pl-2 pr-3" : "flex-row-reverse justify-start pr-2 pl-3",
      )}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "100% 120px",
      }}
    >
      <div
        className={cn(
          "fizica-map-item-pop flex w-full items-start gap-3",
          isLeft ? "flex-row justify-start" : "flex-row-reverse justify-start",
        )}
        style={{ animationDelay: `${Math.min(layout.index, 12) * POP_STAGGER_MS}ms` }}
      >
        <div className="relative z-[5] shrink-0">
          <TrophyRoadCircleNode milestone={layout} state={state} />
        </div>
        <div className="relative z-[5] min-w-0 flex-1 pt-0.5">
          <TrophyRoadRewardCard
            milestone={layout}
            state={state}
            trophiesNeeded={state === "current" ? trophiesNeeded : undefined}
            compact
          />
        </div>
      </div>
    </div>
  )
}

interface TrophyRoadMapProps {
  userElo: number
  className?: string
}

export function TrophyRoadMap({ userElo, className }: TrophyRoadMapProps) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const layouts = useMemo(() => buildTrophyRoadMapLayouts(), [])
  const minHeight = computeTrophyRoadMapMinHeight(layouts)
  const next = getNextMilestone(userElo)
  const trophiesNeeded = next ? Math.max(0, next.threshold - userElo) : undefined

  return (
    <div className={cn("relative w-full bg-white", className)}>
      {/* Desktop zigzag map */}
      <div
        ref={desktopRef}
        className="relative mx-auto hidden max-w-5xl burger:block"
        style={{ minHeight }}
      >
        <MapPathSvg containerRef={desktopRef} layouts={layouts} mode="desktop" />
        {layouts.map((layout) => (
          <DesktopMarker
            key={layout.id}
            layout={layout}
            userElo={userElo}
            trophiesNeeded={trophiesNeeded}
          />
        ))}
      </div>

      {/* Mobile alternating map */}
      <div ref={mobileRef} className="relative py-2 burger:hidden">
        <MapPathSvg containerRef={mobileRef} layouts={layouts} mode="mobile" />
        <div className="relative z-[2] flex flex-col gap-y-24 px-1 pb-8 pt-2">
          {layouts.map((layout) => (
            <MobileMarker
              key={layout.id}
              layout={layout}
              userElo={userElo}
              trophiesNeeded={trophiesNeeded}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

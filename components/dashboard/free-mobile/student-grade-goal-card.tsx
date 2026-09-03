"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import {
  buildStudentDashboardGradeSeries,
  findGoalReachedIndex,
  formatGrade,
  formatGrowthPercent,
  formatMonthTick,
  formatShortDate,
  getStudentGradeChartRange,
  growthPercent,
  MAX_GRADE,
  MIN_GRADE,
  pickChartMonthTicks,
  type StudentGradeChartPoint,
} from "@/lib/parent/grade-estimate"
import { cn } from "@/lib/utils"

interface StudentGradeGoalCardProps {
  currentGrade: number
  targetGrade: number | null
  /** Narrow layout for desktop sidebars (e.g. /exerseaza). */
  compact?: boolean
  className?: string
}

const CHART_WIDTH = 520
const CHART_HEIGHT = 228
const PADDING = { top: 16, right: 18, bottom: 58, left: 42 }
const DEFAULT_UNSET_TARGET_GRADE = 9.5
const LONG_PRESS_MS = 400
const MOVE_CANCEL_PX = 12

const NOTE_BLUE = "#3B6FF5"
const NOTE_BLUE_SOFT = "#E7EEFF"
const NOTE_FILL = "rgba(59, 111, 245, 0.16)"
const TARGET_AMBER = "#E0A03A"
const TARGET_SOFT = "#FFF6E0"
const TARGET_TEXT = "#B45309"
const EXAM_SOFT = "#E4F6F1"
const EXAM_TEXT = "#1F6F64"
const STAR_FILL = "#F0C24A"
const GRID = "#D9D4CC"
const MUTED = "#8A8580"

function resolveDisplayedTargetGrade(currentGrade: number, targetGrade: number | null): number {
  if (targetGrade != null) return targetGrade
  if (currentGrade < DEFAULT_UNSET_TARGET_GRADE) return DEFAULT_UNSET_TARGET_GRADE
  return MAX_GRADE
}

function pointsToSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function starPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const parts: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const cmd = i === 0 ? "M" : "L"
    parts.push(`${cmd} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`)
  }
  return `${parts.join(" ")} Z`
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.58 + 2
}

function clampPillX(x: number, width: number, min = 4, max = CHART_WIDTH - 4): number {
  return Math.min(max - width, Math.max(min, x))
}

interface PlotPoint extends StudentGradeChartPoint {
  x: number
  y: number
  lowY: number
  highY: number
}

function SvgPill({
  x,
  y,
  text,
  fill,
  color,
  fontSize,
  anchor = "middle",
}: {
  x: number
  y: number
  text: string
  fill: string
  color: string
  fontSize: number
  anchor?: "start" | "middle" | "end"
}) {
  const padX = fontSize * 1.05
  const height = fontSize + 11
  const width = estimateTextWidth(text, fontSize) + padX * 2
  let rectX = x - width / 2
  if (anchor === "start") rectX = x
  if (anchor === "end") rectX = x - width
  rectX = clampPillX(rectX, width)

  return (
    <g>
      <rect x={rectX} y={y} width={width} height={height} rx={height / 2} fill={fill} />
      <text
        x={rectX + width / 2}
        y={y + height / 2 + fontSize * 0.35}
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontWeight={650}
      >
        {text}
      </text>
    </g>
  )
}

/**
 * Read-only variant of the parent dashboard's grade chart, adapted for the
 * student's own free-plan mobile dashboard (no edit affordance).
 */
export function StudentGradeGoalCard({
  currentGrade,
  targetGrade,
  compact = false,
  className,
}: StudentGradeGoalCardProps) {
  const resolvedTarget = resolveDisplayedTargetGrade(currentGrade, targetGrade)
  const rootRef = useRef<HTMLElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const longPressTimer = useRef<number | null>(null)
  const pointerStart = useRef({ x: 0, y: 0 })
  const activePointerId = useRef<number | null>(null)
  const activatedRef = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)

  const chartData = useMemo(() => {
    const now = new Date()
    const range = getStudentGradeChartRange(now)
    const series = buildStudentDashboardGradeSeries(currentGrade, resolvedTarget, now)
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const yRange = MAX_GRADE - MIN_GRADE
    const span = Math.max(1, range.exam.getTime() - range.start.getTime())

    const toX = (date: Date) =>
      PADDING.left + ((date.getTime() - range.start.getTime()) / span) * plotWidth
    const toY = (grade: number) =>
      PADDING.top + plotHeight - ((grade - MIN_GRADE) / yRange) * plotHeight

    const linePoints: PlotPoint[] = series.map((point) => ({
      ...point,
      x: toX(point.date),
      y: toY(point.grade),
      lowY: toY(point.bandLow),
      highY: toY(point.bandHigh),
    }))

    const todayIndex = linePoints.findIndex((point) => point.isToday)
    const pastPoints = linePoints.slice(0, Math.max(1, todayIndex + 1))
    const futurePoints = linePoints.slice(Math.max(0, todayIndex))
    const solidPath = pointsToSmoothPath(pastPoints)
    const dashedPath = pointsToSmoothPath(futurePoints)

    const bandHighPath = pointsToSmoothPath(futurePoints.map((point) => ({ x: point.x, y: point.highY })))
    const bandLowReversed = [...futurePoints]
      .reverse()
      .map((point) => ({ x: point.x, y: point.lowY }))
    const bandLowPath = pointsToSmoothPath(bandLowReversed).replace(/^M/, "L")
    const bandPath =
      futurePoints.length > 1 ? `${bandHighPath} ${bandLowPath} Z` : ""

    const goalIndex = findGoalReachedIndex(series, resolvedTarget)
    const monthTicks = pickChartMonthTicks(range.start, range.exam).map((date) => ({
      date,
      x: toX(date),
      label: formatMonthTick(date),
    }))

    return {
      linePoints,
      solidPath,
      dashedPath,
      bandPath,
      todayIndex: Math.max(0, todayIndex),
      goalIndex,
      monthTicks,
      targetY: toY(resolvedTarget),
      plotBottom: PADDING.top + plotHeight,
      toY,
    }
  }, [currentGrade, resolvedTarget])

  const selected = selectedIndex != null ? chartData.linePoints[selectedIndex] : null

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const svg = svgRef.current
      if (!svg || chartData.linePoints.length === 0) return 0
      const rect = svg.getBoundingClientRect()
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * CHART_WIDTH
      let best = 0
      let bestDist = Number.POSITIVE_INFINITY
      chartData.linePoints.forEach((point, index) => {
        const dist = Math.abs(point.x - x)
        if (dist < bestDist) {
          best = index
          bestDist = dist
        }
      })
      return best
    },
    [chartData.linePoints],
  )

  const selectAtClientX = useCallback(
    (clientX: number) => {
      setSelectedIndex(indexFromClientX(clientX))
    },
    [indexFromClientX],
  )

  const dismiss = useCallback(() => {
    clearLongPress()
    activatedRef.current = false
    setPinned(false)
    setScrubbing(false)
    setSelectedIndex(null)
  }, [clearLongPress])

  useEffect(() => {
    if (!pinned) return

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        dismiss()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [dismiss, pinned])

  useEffect(() => () => clearLongPress(), [clearLongPress])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !scrubbing) return

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault()
    }

    svg.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => svg.removeEventListener("touchmove", onTouchMove)
  }, [scrubbing])

  const capturePointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    activePointerId.current = event.pointerId
    if (event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY }
    activePointerId.current = event.pointerId

    if (event.pointerType !== "touch" || pinned) {
      activatedRef.current = true
      capturePointer(event)
      setScrubbing(event.pointerType === "touch")
      setPinned(event.pointerType === "touch" || pinned)
      selectAtClientX(event.clientX)
      return
    }

    activatedRef.current = false
    longPressTimer.current = window.setTimeout(() => {
      activatedRef.current = true
      setPinned(true)
      setScrubbing(true)
      selectAtClientX(event.clientX)
      const svg = svgRef.current
      if (svg && activePointerId.current != null) {
        try {
          svg.setPointerCapture(activePointerId.current)
        } catch {
          // Capture can fail if the pointer was already released.
        }
      }
      navigator.vibrate?.(12)
    }, LONG_PRESS_MS)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "touch") {
      selectAtClientX(event.clientX)
      return
    }

    const dx = event.clientX - pointerStart.current.x
    const dy = event.clientY - pointerStart.current.y
    if (!activatedRef.current) {
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        clearLongPress()
      }
      return
    }

    selectAtClientX(event.clientX)
  }

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    clearLongPress()
    setScrubbing(false)

    if (event.pointerType === "touch" && !activatedRef.current && pinned) {
      dismiss()
      return
    }

    if (event.pointerType !== "touch") {
      activatedRef.current = false
    }
  }

  const handlePointerLeave = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "touch" && !pinned) {
      setSelectedIndex(null)
    }
  }

  const pillSize = compact ? 10 : 12
  const todayPoint = chartData.linePoints[chartData.todayIndex]
  const goalPoint = chartData.linePoints[chartData.goalIndex]
  const examPoint = chartData.linePoints[chartData.linePoints.length - 1]
  const showStar = Boolean(goalPoint)
  const starAtToday = showStar && chartData.goalIndex === chartData.todayIndex
  const percent = selected ? growthPercent(selected.grade, currentGrade) : 0
  const selectedDateLabel = selected
    ? selected.isToday || !selected.isFuture
      ? "Azi"
      : formatShortDate(selected.date)
    : ""
  const showMinLabel = !selected || Math.abs(selected.grade - MIN_GRADE) > 0.35
  const showMaxLabel = !selected || Math.abs(selected.grade - MAX_GRADE) > 0.35
  const selectedAxisLabel = selected ? formatGrade(selected.grade) : ""
  const selectedAxisWidth = selected
    ? Math.max(32, estimateTextWidth(selectedAxisLabel, 12) + 14)
    : 0

  return (
    <section ref={rootRef} className={cn(compact ? "px-0" : "px-1", className)}>
      <div className={cn("flex flex-wrap items-start justify-between", compact ? "gap-2" : "gap-4")}>
        <div>
          <p
            className={cn(
              "font-medium uppercase tracking-[0.12em] text-[#6b6b6b]",
              compact ? "text-[10px]" : "text-[11px]",
            )}
          >
            Nota ta estimată
          </p>
          <p
            className={cn(
              "mt-1 font-bold leading-none tabular-nums text-[#121212]",
              compact ? "text-2xl" : "text-4xl",
            )}
          >
            {formatGrade(currentGrade)}
          </p>
        </div>

        <div className="text-right">
          <p
            className={cn(
              "font-medium uppercase tracking-[0.12em] text-[#6b6b6b]",
              compact ? "text-[10px]" : "text-[11px]",
            )}
          >
            Nota dorită
          </p>
          <p
            className={cn(
              "mt-1 font-bold leading-none tabular-nums text-[#121212]",
              compact ? "text-2xl" : "text-4xl",
            )}
          >
            {formatGrade(resolvedTarget)}
          </p>
        </div>
      </div>

      <div className="relative mt-3">
        <span className="sr-only">Ține apăsat pe grafic pentru nota din acel punct.</span>

        {selected ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_10px_28px_rgba(28,25,23,0.12)]">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "font-bold leading-none tabular-nums text-[#1c1917]",
                    compact ? "text-xl" : "text-[1.65rem]",
                  )}
                >
                  {formatGrade(selected.grade)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                    percent < 0 ? "bg-[#fde8e8] text-[#b42318]" : "bg-[#e4f6f1] text-[#1f6f64]",
                    compact ? "text-[10px]" : "text-xs",
                  )}
                >
                  {percent < 0 ? (
                    <TrendingDown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
                  ) : (
                    <TrendingUp className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
                  )}
                  {formatGrowthPercent(percent)}
                </span>
              </div>
              <div className="shrink-0 text-right leading-tight">
                <p className={cn("font-semibold text-[#1c1917]", compact ? "text-xs" : "text-sm")}>
                  {selectedDateLabel}
                </p>
                <p className={cn("text-[#9a9590]", compact ? "text-[10px]" : "text-xs")}>Nota ta</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-semibold",
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
            )}
            style={{ backgroundColor: NOTE_BLUE_SOFT, color: NOTE_BLUE }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NOTE_BLUE }} />
            Nota ta
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-semibold",
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
            )}
            style={{ backgroundColor: TARGET_SOFT, color: TARGET_TEXT }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TARGET_AMBER }} />
            Țintă
          </span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className={cn("w-full select-none", compact ? "h-[188px]" : "h-[210px]")}
          style={{ touchAction: scrubbing ? "none" : "pan-y", WebkitTouchCallout: "none" }}
          role="img"
          aria-label="Proiecție notă estimată până la examen"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(event) => event.preventDefault()}
        >
          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={chartData.toY(MAX_GRADE)}
            y2={chartData.toY(MAX_GRADE)}
            stroke={GRID}
            strokeWidth={1}
            strokeDasharray="3 5"
          />
          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={chartData.toY(MIN_GRADE)}
            y2={chartData.toY(MIN_GRADE)}
            stroke={GRID}
            strokeWidth={1}
            strokeDasharray="3 5"
          />

          {showMinLabel ? (
            <text
              x={PADDING.left - 8}
              y={chartData.toY(MIN_GRADE) + 3}
              textAnchor="end"
              fill={MUTED}
              fontSize={13}
            >
              {MIN_GRADE}
            </text>
          ) : null}
          {showMaxLabel ? (
            <text
              x={PADDING.left - 8}
              y={chartData.toY(MAX_GRADE) + 3}
              textAnchor="end"
              fill={MUTED}
              fontSize={13}
            >
              {MAX_GRADE}
            </text>
          ) : null}

          {selected ? (
            <>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={selected.y}
                y2={selected.y}
                stroke={GRID}
                strokeWidth={1}
                strokeDasharray="3 5"
              />
              <rect
                x={PADDING.left - selectedAxisWidth - 6}
                y={selected.y - 11}
                width={selectedAxisWidth}
                height={22}
                rx={11}
                fill="#eceae6"
              />
              <text
                x={PADDING.left - 6 - selectedAxisWidth / 2}
                y={selected.y + 4.5}
                textAnchor="middle"
                fill="#57534e"
                fontSize={12}
                fontWeight={650}
              >
                {selectedAxisLabel}
              </text>
              <line
                x1={selected.x}
                x2={selected.x}
                y1={PADDING.top}
                y2={chartData.plotBottom}
                stroke="#c4bfb8"
                strokeWidth={1.25}
                strokeDasharray="3 4"
              />
            </>
          ) : null}

          {chartData.bandPath ? <path d={chartData.bandPath} fill={NOTE_FILL} /> : null}

          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={chartData.targetY}
            y2={chartData.targetY}
            stroke={TARGET_AMBER}
            strokeWidth={2}
          />

          <path
            d={chartData.solidPath}
            fill="none"
            stroke={NOTE_BLUE}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={chartData.dashedPath}
            fill="none"
            stroke={NOTE_BLUE}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 6"
            opacity={0.85}
          />

          {todayPoint && !starAtToday ? (
            <>
              <line
                x1={todayPoint.x}
                x2={todayPoint.x}
                y1={todayPoint.y}
                y2={chartData.plotBottom + 2}
                stroke="#c4bfb8"
                strokeWidth={1.2}
                strokeDasharray="3 4"
              />
              <circle cx={todayPoint.x} cy={todayPoint.y} r={6} fill={NOTE_BLUE} />
              <circle cx={todayPoint.x} cy={todayPoint.y} r={3} fill="white" />
            </>
          ) : null}

          {goalPoint && showStar ? (
            <>
              <line
                x1={goalPoint.x}
                x2={goalPoint.x}
                y1={goalPoint.y}
                y2={chartData.plotBottom - 2}
                stroke={TARGET_AMBER}
                strokeWidth={1.3}
                strokeDasharray="3 4"
                opacity={0.85}
              />
              <circle cx={goalPoint.x} cy={goalPoint.y} r={11} fill={STAR_FILL} />
              <path d={starPath(goalPoint.x, goalPoint.y, 6.2, 2.7)} fill="white" />
            </>
          ) : null}

          {todayPoint ? (
            <SvgPill
              x={todayPoint.x}
              y={chartData.plotBottom + 5}
              text="Azi"
              fill={NOTE_BLUE_SOFT}
              color={NOTE_BLUE}
              fontSize={pillSize}
            />
          ) : null}

          {goalPoint && !starAtToday && Math.abs(goalPoint.x - (todayPoint?.x ?? 0)) > 72 ? (
            <SvgPill
              x={goalPoint.x}
              y={chartData.plotBottom - 18}
              text="Obiectiv atins"
              fill={TARGET_SOFT}
              color={TARGET_TEXT}
              fontSize={pillSize}
              anchor={goalPoint.x > CHART_WIDTH * 0.62 ? "end" : "middle"}
            />
          ) : null}

          {examPoint ? (
            <SvgPill
              x={examPoint.x}
              y={CHART_HEIGHT - 36}
              text="Bac"
              fill={EXAM_SOFT}
              color={EXAM_TEXT}
              fontSize={pillSize}
              anchor="end"
            />
          ) : null}

          {chartData.monthTicks.map((tick, index) => (
            <text
              key={`${tick.label}-${index}`}
              x={tick.x}
              y={CHART_HEIGHT - 8}
              textAnchor={
                index === 0 ? "start" : index === chartData.monthTicks.length - 1 ? "end" : "middle"
              }
              fill={MUTED}
              fontSize={13}
            >
              {tick.label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  )
}

"use client"

import { useMemo } from "react"
import { buildWavyGradeProjection, formatGrade, MAX_GRADE, MIN_GRADE } from "@/lib/parent/grade-estimate"
import { cn } from "@/lib/utils"

interface StudentGradeGoalCardProps {
  currentGrade: number
  targetGrade: number | null
  /** Narrow layout for desktop sidebars (e.g. /exerseaza). */
  compact?: boolean
  className?: string
}

const CHART_WIDTH = 520
const CHART_HEIGHT = 180
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 }
const DEFAULT_UNSET_TARGET_GRADE = 9.5

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

function formatWeekLabel(week: number): string {
  return week === 0 ? "Azi" : `Săpt. ${week}`
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

  const projection = useMemo(
    () => buildWavyGradeProjection(currentGrade, resolvedTarget, 4),
    [currentGrade, resolvedTarget],
  )

  const chartData = useMemo(() => {
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const minY = MIN_GRADE
    const maxY = MAX_GRADE
    const yRange = maxY - minY
    const lastIndex = Math.max(1, projection.length - 1)

    const toX = (index: number) => PADDING.left + (index / lastIndex) * plotWidth
    const toY = (grade: number) => PADDING.top + plotHeight - ((grade - minY) / yRange) * plotHeight

    const linePoints = projection.map((point, index) => ({
      x: toX(index),
      y: toY(point.grade),
      label: point.label,
      grade: point.grade,
      monthIndex: point.monthIndex,
    }))

    const linePath = pointsToSmoothPath(linePoints)
    const first = linePoints[0]
    const last = linePoints[linePoints.length - 1]
    const baselineY = PADDING.top + plotHeight
    const curveRest = linePath.replace(/^M [-\d.]+ [-\d.]+/, "").trim()
    const areaPath =
      first && last
        ? `M ${first.x} ${baselineY} L ${first.x} ${first.y} ${curveRest} L ${last.x} ${baselineY} Z`
        : ""
    const targetY = toY(resolvedTarget)
    const xLabelIndices = [0, 1, 2, 3, 4].map((week) => {
      let bestIndex = 0
      let bestDist = Number.POSITIVE_INFINITY
      linePoints.forEach((point, index) => {
        const dist = Math.abs(point.monthIndex - week)
        if (dist < bestDist) {
          bestIndex = index
          bestDist = dist
        }
      })
      return bestIndex
    })

    return { areaPath, linePath, linePoints, targetY, xLabelIndices }
  }, [projection, resolvedTarget])

  return (
    <section className={cn(compact ? "px-0" : "px-1", className)}>
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

      <div className={cn("mt-3 flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-[#f0ebff] font-semibold text-[#6e4ef2]",
            compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-[#6e4ef2]" />
          Nota ta
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-[#fff9e8] font-semibold text-[#b45309]",
            compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
          Țintă
        </span>
      </div>

      <div className={cn("mt-3", compact ? "overflow-hidden" : "overflow-x-auto")}>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className={cn("w-full", compact ? "h-[170px]" : "h-[150px] min-w-[300px]")}
          role="img"
          aria-label="Proiecție notă estimată pe patru săptămâni"
        >
          <path d={chartData.areaPath} fill="rgba(110, 78, 242, 0.12)" />
          <path
            d={chartData.linePath}
            fill="none"
            stroke="#6e4ef2"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={chartData.targetY}
            y2={chartData.targetY}
            stroke="#f59e0b"
            strokeWidth={2}
          />

          {chartData.linePoints[0] ? (
            <circle cx={chartData.linePoints[0].x} cy={chartData.linePoints[0].y} r={5} fill="#6e4ef2" />
          ) : null}
          {chartData.linePoints.length > 1 ? (
            <circle
              cx={chartData.linePoints[chartData.linePoints.length - 1]?.x}
              cy={chartData.linePoints[chartData.linePoints.length - 1]?.y}
              r={5}
              fill="#f59e0b"
            />
          ) : null}

          {chartData.xLabelIndices.map((index) => {
            const point = chartData.linePoints[index]
            if (!point) return null
            return (
              <text
                key={`label-${index}`}
                x={point.x}
                y={CHART_HEIGHT - 10}
                textAnchor="middle"
                className={cn(
                  "fill-[#6b7280] text-[10px]",
                  index === 0 && "font-semibold text-[#6e4ef2]",
                )}
              >
                {formatWeekLabel(Math.round(point.monthIndex))}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

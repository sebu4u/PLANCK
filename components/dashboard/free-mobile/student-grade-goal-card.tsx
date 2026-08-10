"use client"

import { useMemo } from "react"
import { buildGradeProjection, formatGrade, MAX_GRADE, MIN_GRADE } from "@/lib/parent/grade-estimate"
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
  const resolvedTarget = targetGrade ?? Math.min(MAX_GRADE, currentGrade + 1)

  const projection = useMemo(
    () => buildGradeProjection(currentGrade, resolvedTarget, 12),
    [currentGrade, resolvedTarget],
  )

  const chartData = useMemo(() => {
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const minY = MIN_GRADE
    const maxY = MAX_GRADE
    const yRange = maxY - minY

    const toX = (index: number) => PADDING.left + (index / (projection.length - 1)) * plotWidth
    const toY = (grade: number) => PADDING.top + plotHeight - ((grade - minY) / yRange) * plotHeight

    const linePoints = projection.map((point, index) => ({
      x: toX(index),
      y: toY(point.grade),
      label: point.label,
      grade: point.grade,
    }))

    const areaPath = [
      `M ${linePoints[0]?.x ?? 0} ${PADDING.top + plotHeight}`,
      ...linePoints.map((point) => `L ${point.x} ${point.y}`),
      `L ${linePoints[linePoints.length - 1]?.x ?? 0} ${PADDING.top + plotHeight}`,
      "Z",
    ].join(" ")

    const linePath = linePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
    const targetY = toY(resolvedTarget)
    const xLabelIndices = [0, 3, 6, 9, 12]

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
          aria-label="Proiecție notă estimată pe 12 luni"
        >
          <path d={chartData.areaPath} fill="rgba(110, 78, 242, 0.12)" />
          <path d={chartData.linePath} fill="none" stroke="#6e4ef2" strokeWidth={2.5} strokeDasharray="6 4" />

          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={chartData.targetY}
            y2={chartData.targetY}
            stroke="#f59e0b"
            strokeWidth={2}
          />

          {chartData.linePoints.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {index === 0 ? <circle cx={point.x} cy={point.y} r={5} fill="#6e4ef2" /> : null}
              {chartData.xLabelIndices.includes(index) ? (
                <text
                  x={point.x}
                  y={CHART_HEIGHT - 10}
                  textAnchor="middle"
                  className={cn(
                    "fill-[#6b7280] text-[10px]",
                    index === 0 && "font-semibold text-[#6e4ef2]",
                  )}
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}

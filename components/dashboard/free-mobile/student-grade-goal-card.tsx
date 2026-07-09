"use client"

import { useMemo } from "react"
import { buildGradeProjection, formatGrade, MAX_GRADE, MIN_GRADE } from "@/lib/parent/grade-estimate"
import { cn } from "@/lib/utils"

interface StudentGradeGoalCardProps {
  currentGrade: number
  targetGrade: number | null
}

const CHART_WIDTH = 520
const CHART_HEIGHT = 180
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 }

/**
 * Read-only variant of the parent dashboard's grade chart, adapted for the
 * student's own free-plan mobile dashboard (no edit affordance).
 */
export function StudentGradeGoalCard({ currentGrade, targetGrade }: StudentGradeGoalCardProps) {
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
    <section className="px-1">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b6b6b]">
            Nota ta estimată
          </p>
          <p className="mt-1 text-4xl font-bold leading-none tabular-nums text-[#121212]">
            {formatGrade(currentGrade)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b6b6b]">
            Nota dorită
          </p>
          <p className="mt-1 text-4xl font-bold leading-none tabular-nums text-[#121212]">
            {formatGrade(resolvedTarget)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ebff] px-3 py-1 text-xs font-semibold text-[#6e4ef2]">
          <span className="h-2 w-2 rounded-full bg-[#6e4ef2]" />
          Nota ta
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff9e8] px-3 py-1 text-xs font-semibold text-[#b45309]">
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
          Țintă
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-[150px] w-full min-w-[300px]"
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

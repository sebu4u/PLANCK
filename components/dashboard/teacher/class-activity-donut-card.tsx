"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { TeacherClassroomOverview } from "@/lib/teacher/server"

const CLASS_COLORS = [
  { active: "#6366f1", inactive: "#c7d2fe" },
  { active: "#ec4899", inactive: "#fbcfe8" },
  { active: "#14b8a6", inactive: "#99f6e4" },
  { active: "#f59e0b", inactive: "#fde68a" },
  { active: "#ef4444", inactive: "#fecaca" },
  { active: "#8b5cf6", inactive: "#ddd6fe" },
  { active: "#06b6d4", inactive: "#a5f3fc" },
  { active: "#22c55e", inactive: "#bbf7d0" },
]

const SIZE = 240
const CENTER = SIZE / 2
const OUTER_RADIUS = 92
const INNER_RADIUS = 58

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

function describeArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle)
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle)
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle)
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ")
}

interface ClassActivityDonutCardProps {
  overview: TeacherClassroomOverview[]
}

export function ClassActivityDonutCard({ overview }: ClassActivityDonutCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const segments = useMemo(() => {
    const classroomsWithStudents = overview.filter((item) => item.class_stats.student_count > 0)
    const totalStudents = classroomsWithStudents.reduce(
      (sum, item) => sum + item.class_stats.student_count,
      0,
    )

    if (totalStudents === 0) return []

    let cursor = 0
    return classroomsWithStudents.map((item, index) => {
      const studentCount = item.class_stats.student_count
      const activeCount = Math.min(item.class_stats.active_last_7_days, studentCount)
      const inactiveCount = studentCount - activeCount
      const sliceAngle = (studentCount / totalStudents) * 360
      const startAngle = cursor
      const endAngle = cursor + sliceAngle
      cursor = endAngle

      const activeAngle = studentCount > 0 ? (activeCount / studentCount) * sliceAngle : 0
      const colors = CLASS_COLORS[index % CLASS_COLORS.length]

      return {
        classroomName: item.classroom.name,
        studentCount,
        activeCount,
        inactiveCount,
        startAngle,
        endAngle,
        activeStart: startAngle,
        activeEnd: startAngle + activeAngle,
        inactiveStart: startAngle + activeAngle,
        inactiveEnd: endAngle,
        colors,
        index,
      }
    })
  }, [overview])

  const totals = useMemo(() => {
    const studentCount = overview.reduce((sum, item) => sum + item.class_stats.student_count, 0)
    const activeCount = overview.reduce((sum, item) => sum + item.class_stats.active_last_7_days, 0)
    return { studentCount, activeCount, inactiveCount: Math.max(0, studentCount - activeCount) }
  }, [overview])

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[#e5e5e5] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.02)] sm:p-5 lg:aspect-square">
      <div className="shrink-0">
        <h2 className="text-base font-semibold text-[#111827]">Activitate elevi</h2>
        <p className="mt-0.5 text-sm text-[#6b7280]">Activi vs. inactivi (ultimele 7 zile)</p>
      </div>

      <div className="relative mt-2 flex w-full items-center justify-center overflow-hidden max-lg:flex-none max-lg:py-1 lg:min-h-0 lg:flex-1">
        {segments.length === 0 ? (
          <p className="text-sm text-[#9ca3af]">Nu există elevi în clasele tale încă.</p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="aspect-square w-full max-w-[200px] sm:max-w-[220px] lg:h-auto lg:w-auto lg:max-h-full lg:max-w-full"
              role="img"
              aria-label="Grafic activitate elevi pe clase"
            >
              {segments.flatMap((segment) => {
                const paths = []
                const isHovered = hoveredIndex === segment.index
                const transform = isHovered ? `translate(${CENTER}, ${CENTER}) scale(1.04) translate(${-CENTER}, ${-CENTER})` : undefined

                if (segment.activeCount > 0 && segment.activeEnd > segment.activeStart) {
                  paths.push(
                    <path
                      key={`${segment.index}-active`}
                      d={describeArc(
                        CENTER,
                        CENTER,
                        OUTER_RADIUS,
                        INNER_RADIUS,
                        segment.activeStart,
                        segment.activeEnd,
                      )}
                      fill={segment.colors.active}
                      className="transition-all duration-200"
                      style={{ transform, transformOrigin: `${CENTER}px ${CENTER}px` }}
                      onMouseEnter={() => setHoveredIndex(segment.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />,
                  )
                }

                if (segment.inactiveCount > 0 && segment.inactiveEnd > segment.inactiveStart) {
                  paths.push(
                    <path
                      key={`${segment.index}-inactive`}
                      d={describeArc(
                        CENTER,
                        CENTER,
                        OUTER_RADIUS,
                        INNER_RADIUS,
                        segment.inactiveStart,
                        segment.inactiveEnd,
                      )}
                      fill={segment.colors.inactive}
                      className="transition-all duration-200"
                      style={{ transform, transformOrigin: `${CENTER}px ${CENTER}px` }}
                      onMouseEnter={() => setHoveredIndex(segment.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />,
                  )
                }

                return paths
              })}
            </svg>

            {hoveredIndex != null && segments[hoveredIndex] ? (
              <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border border-[#eceff3] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#111827] shadow-sm">
                {segments[hoveredIndex].classroomName} — {segments[hoveredIndex].activeCount}/
                {segments[hoveredIndex].studentCount} activi în ultimele 7 zile
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-semibold text-[#111827]">{totals.activeCount}</p>
                <p className="text-xs text-[#6b7280]">activi</p>
              </div>
            </div>
          </>
        )}
      </div>

      {segments.length > 0 ? (
        <div className="mt-2 shrink-0 space-y-1 overflow-hidden lg:max-h-[38%] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-0.5 lg:dashboard-scrollbar">
          {segments.map((segment) => (
            <div
              key={segment.classroomName}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-1.5 py-0.5 text-xs transition-colors",
                hoveredIndex === segment.index ? "bg-[#f8fafc]" : "",
              )}
              onMouseEnter={() => setHoveredIndex(segment.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.colors.active }}
                  aria-hidden
                />
                <span className="truncate font-medium text-[#374151]">{segment.classroomName}</span>
              </div>
              <span className="shrink-0 text-[#6b7280]">
                {segment.activeCount}/{segment.studentCount}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

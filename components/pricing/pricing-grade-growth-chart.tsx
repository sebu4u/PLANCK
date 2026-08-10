"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { buildGradeProjection, formatGrade } from "@/lib/parent/grade-estimate"

const CHART_WIDTH = 480
const CHART_HEIGHT = 220
const PADDING = { top: 20, right: 16, bottom: 28, left: 16 }

const START_GRADE = 6
const TARGET_GRADE = 9.5
const MONTHS = 9

export function PricingGradeGrowthChart() {
  const shouldReduceMotion = useReducedMotion()

  const projection = useMemo(
    () => buildGradeProjection(START_GRADE, TARGET_GRADE, MONTHS),
    []
  )

  const chartData = useMemo(() => {
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const minY = 4
    const maxY = 10
    const yRange = maxY - minY

    const toX = (index: number) =>
      PADDING.left + (index / (projection.length - 1)) * plotWidth
    const toY = (grade: number) =>
      PADDING.top + plotHeight - ((grade - minY) / yRange) * plotHeight

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

    const linePath = linePoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ")

    const last = linePoints[linePoints.length - 1]
    const first = linePoints[0]

    return { areaPath, linePath, linePoints, first, last, plotWidth, plotHeight }
  }, [projection])

  return (
    <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)] backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B47D6]">
            Nota ta
          </p>
          <p className="mt-0.5 text-sm text-gray-500">Progres estimat pe Planck</p>
        </div>
        <motion.span
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : 1.1, duration: 0.4 }}
          className="rounded-full bg-[#7C5CFC] px-3 py-1 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(124,92,252,0.6)]"
        >
          {formatGrade(TARGET_GRADE)}
        </motion.span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label={`Nota estimată crește de la ${formatGrade(START_GRADE)} la ${formatGrade(TARGET_GRADE)} în ${MONTHS} luni`}
      >
        <defs>
          <linearGradient id="pricingGradeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[4, 6, 8, 10].map((value) => {
          const y =
            PADDING.top +
            chartData.plotHeight -
            ((value - 4) / 6) * chartData.plotHeight
          return (
            <line
              key={value}
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={y}
              y2={y}
              stroke="#e5e0fb"
              strokeDasharray="4 5"
            />
          )
        })}

        <motion.path
          d={chartData.areaPath}
          fill="url(#pricingGradeArea)"
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.4, duration: 0.8 }}
        />

        <motion.path
          d={chartData.linePath}
          fill="none"
          stroke="#7C5CFC"
          strokeWidth={3}
          strokeLinecap="round"
          initial={shouldReduceMotion ? undefined : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: 1.1, ease: "easeOut" }}
        />

        {chartData.first ? (
          <circle cx={chartData.first.x} cy={chartData.first.y} r={5} fill="#7C5CFC" />
        ) : null}

        {chartData.last ? (
          <motion.circle
            cx={chartData.last.x}
            cy={chartData.last.y}
            r={6}
            fill="#7C5CFC"
            initial={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 1.2, duration: 0.35, ease: "easeOut" }}
            style={{ transformOrigin: `${chartData.last.x}px ${chartData.last.y}px` }}
          />
        ) : null}

        <text
          x={chartData.first?.x ?? 0}
          y={CHART_HEIGHT - 8}
          textAnchor="start"
          className="fill-[#9ca3af] text-[11px]"
        >
          Azi
        </text>
        <text
          x={chartData.last?.x ?? 0}
          y={CHART_HEIGHT - 8}
          textAnchor="end"
          className="fill-[#9ca3af] text-[11px]"
        >
          {MONTHS} luni
        </text>
      </svg>
    </div>
  )
}

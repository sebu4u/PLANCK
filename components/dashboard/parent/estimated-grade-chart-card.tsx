"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pencil, X } from "lucide-react"
import {
  buildGradeProjection,
  clampGrade,
  formatGrade,
  MAX_GRADE,
  MIN_GRADE,
} from "@/lib/parent/grade-estimate"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"

interface EstimatedGradeChartCardProps {
  childId: string
  estimatedGrade: number
  targetGrade: number
  onTargetGradeChange: (value: number) => void
}

const CHART_WIDTH = 520
const CHART_HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 36, left: 36 }

export function EstimatedGradeChartCard({
  childId,
  estimatedGrade,
  targetGrade,
  onTargetGradeChange,
}: EstimatedGradeChartCardProps) {
  const [editingTarget, setEditingTarget] = useState(false)
  const [draftTarget, setDraftTarget] = useState(String(targetGrade))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editingTarget) {
      setDraftTarget(String(targetGrade))
    }
  }, [targetGrade, editingTarget])

  useEffect(() => {
    if (editingTarget) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editingTarget])

  const projection = useMemo(
    () => buildGradeProjection(estimatedGrade, targetGrade, 12),
    [estimatedGrade, targetGrade],
  )

  const chartData = useMemo(() => {
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const minY = MIN_GRADE
    const maxY = MAX_GRADE
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

    const linePath = linePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

    const targetY = toY(targetGrade)
    const gridLines = Array.from({ length: maxY - minY + 1 }, (_, index) => minY + index).map(
      (value) => ({
        value,
        y: toY(value),
      }),
    )

    const xLabelIndices = [0, 3, 6, 9, 12]

    return {
      areaPath,
      linePath,
      linePoints,
      targetY,
      gridLines,
      plotWidth,
      plotHeight,
      xLabelIndices,
      toX,
    }
  }, [projection, targetGrade])

  const saveTargetGrade = useCallback(async () => {
    const parsed = Number.parseFloat(draftTarget.replace(",", "."))
    if (!Number.isFinite(parsed)) {
      setDraftTarget(String(targetGrade))
      setEditingTarget(false)
      return
    }

    const normalized = clampGrade(parsed)
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error("no_session")

      const response = await fetch(`/api/parent/children/${childId}/target-grade`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_grade: normalized }),
      })

      if (!response.ok) throw new Error("save_failed")

      const payload = await response.json()
      onTargetGradeChange(
        typeof payload.target_grade === "number" ? payload.target_grade : normalized,
      )
      setEditingTarget(false)
    } catch {
      setDraftTarget(String(targetGrade))
      setEditingTarget(false)
    } finally {
      setSaving(false)
    }
  }, [childId, draftTarget, onTargetGradeChange, targetGrade])

  const handleTargetKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      void saveTargetGrade()
    }
    if (event.key === "Escape") {
      setDraftTarget(String(targetGrade))
      setEditingTarget(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6b6b6b]">
            Notă estimată
          </p>
          <p className="mt-1 text-5xl font-bold leading-none tabular-nums text-[#121212]">
            {formatGrade(estimatedGrade)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#6b6b6b]">
            Țintă
          </p>
          <div className="mt-1 flex items-center justify-end gap-2">
            {editingTarget ? (
              <>
                <Input
                  ref={inputRef}
                  type="number"
                  min={MIN_GRADE}
                  max={MAX_GRADE}
                  step={0.1}
                  value={draftTarget}
                  disabled={saving}
                  onChange={(event) => setDraftTarget(event.target.value)}
                  onKeyDown={handleTargetKeyDown}
                  className="h-10 w-20 text-right text-lg font-bold tabular-nums"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  disabled={saving}
                  onClick={() => {
                    setDraftTarget(String(targetGrade))
                    setEditingTarget(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-full px-4"
                  disabled={saving}
                  onClick={() => void saveTargetGrade()}
                >
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <p className="text-5xl font-bold leading-none tabular-nums text-[#121212]">
                  {formatGrade(targetGrade)}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 rounded-full text-[#9e9e9e] hover:text-[#121212]"
                  onClick={() => setEditingTarget(true)}
                  aria-label="Editează ținta"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ebff] px-3 py-1 text-xs font-semibold text-[#6e4ef2]">
          <span className="h-2 w-2 rounded-full bg-[#6e4ef2]" />
          Nota ta
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff9e8] px-3 py-1 text-xs font-semibold text-[#b45309]">
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
          Țintă
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-[220px] w-full min-w-[320px]"
          role="img"
          aria-label="Proiecție notă estimată pe 12 luni"
        >
          {chartData.gridLines.map((line) => (
            <g key={line.value}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={line.y}
                y2={line.y}
                stroke="#eceff3"
                strokeDasharray="4 4"
              />
              <text
                x={PADDING.left - 8}
                y={line.y + 4}
                textAnchor="end"
                className="fill-[#9ca3af] text-[10px]"
              >
                {line.value}
              </text>
            </g>
          ))}

          <path d={chartData.areaPath} fill="rgba(110, 78, 242, 0.12)" />
          <path
            d={chartData.linePath}
            fill="none"
            stroke="#6e4ef2"
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />

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
              {index === 0 ? (
                <>
                  <circle cx={point.x} cy={point.y} r={6} fill="#6e4ef2" />
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    className="fill-[#6e4ef2] text-[10px] font-semibold"
                  >
                    Azi
                  </text>
                </>
              ) : null}
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

      <p className="mt-2 text-xs text-[#6b7280]">
        Proiecție orientativă pe următoarele 12 luni, pe baza progresului actual.
      </p>
    </section>
  )
}

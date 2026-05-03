"use client"

import React, { useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import type { Problem, ProblemValueSubpoint } from "@/data/problems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import "katex/dist/katex.min.css"
import { InlineMath } from "react-katex"

interface ProblemAnswerCardProps {
  problem: Problem
  onCanMarkSolvedChange: (canMarkSolved: boolean) => void
  onSolvedCorrectly?: () => void
  isSolved: boolean
  /** When true, show a "Hint" button (no border) that opens AI chat with the problem. Used on mobile. */
  showHintButton?: boolean
  onHintClick?: () => void
}

function getProblemElo(problem: Problem): number | null {
  const eloFromProblem = (problem as any)?.elo_gain ?? (problem as any)?.elo ?? null

  if (typeof eloFromProblem === "number" && Number.isFinite(eloFromProblem) && eloFromProblem > 0) {
    return Math.round(eloFromProblem)
  }

  switch (problem.difficulty) {
    case "Ușor":
      return 200
    case "Mediu":
      return 300
    case "Avansat":
      return 450
    default:
      return 200
  }
}

function renderInlineMath(value: string) {
  if (!value || !value.includes("$")) return value
  return value.split(/(\$[^$]+\$)/g).map((part, idx) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={idx} math={part.slice(1, -1)} />
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

function parseNumericInput(raw: string): number | null {
  if (!raw.trim()) return null
  const normalized = raw.trim().replace(",", ".")
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function isWithinTolerance(userValue: number, correctValue: number): boolean {
  if (correctValue === 0) {
    return Math.abs(userValue) <= 0.001
  }

  const tolerance = Math.abs(correctValue) * 0.05
  return Math.abs(userValue - correctValue) <= tolerance
}

function getSubpointLabel(index: number, configuredLabel?: string): string {
  if (configuredLabel && configuredLabel.trim()) return configuredLabel.trim()
  return String.fromCharCode(97 + index)
}

function normalizeValueSubpoints(problem: Problem): ProblemValueSubpoint[] {
  if (!Array.isArray(problem.value_subpoints)) return []

  return problem.value_subpoints
    .map((subpoint) => ({
      label: String(subpoint.label ?? "").trim(),
      text_before: String(subpoint.text_before ?? ""),
      text_after: String(subpoint.text_after ?? ""),
      correct_value: Number(subpoint.correct_value),
    }))
    .filter((subpoint) => Number.isFinite(subpoint.correct_value))
    .slice(0, 3)
}

function normalizeGrilaOptions(problem: Problem): string[] {
  if (!Array.isArray(problem.grila_options)) return []
  return problem.grila_options.map((option) => String(option ?? "").trim()).slice(0, 3)
}

function ValueAnswerCard({
  subpoints,
  onCanMarkSolvedChange,
  onSolvedCorrectly,
  isSolved,
  eloReward,
  showHintButton,
  onHintClick,
}: {
  subpoints: ProblemValueSubpoint[]
  onCanMarkSolvedChange: (canMarkSolved: boolean) => void
  onSolvedCorrectly?: () => void
  isSolved: boolean
  eloReward?: number | null
  showHintButton?: boolean
  onHintClick?: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const hasFinished = currentIndex >= subpoints.length

  useEffect(() => {
    onCanMarkSolvedChange(isSolved || hasFinished)
  }, [hasFinished, isSolved, onCanMarkSolvedChange])

  const currentSubpoint = subpoints[currentIndex]

  const handleCheckAnswer = () => {
    if (!currentSubpoint) return

    const parsedValue = parseNumericInput(inputValue)
    if (parsedValue === null) {
      setIsError(true)
      setFeedback("Introdu o valoare numerică validă.")
      return
    }

    const isCorrect = isWithinTolerance(parsedValue, currentSubpoint.correct_value)
    if (!isCorrect) {
      setIsError(true)
      setFeedback("Răspuns incorect. Încearcă din nou.")
      return
    }

    const nextIndex = currentIndex + 1
    if (nextIndex >= subpoints.length) {
      setIsError(false)
      setFeedback("Perfect! Ai rezolvat toate subpunctele.")
      setCurrentIndex(nextIndex)
      onSolvedCorrectly?.()
      return
    }

    setCurrentIndex(nextIndex)
    setInputValue("")
    setIsError(false)
    setFeedback(`Corect! Treci la subpunctul ${getSubpointLabel(nextIndex, subpoints[nextIndex].label)}).`)
  }

  if (subpoints.length === 0) {
    return (
      <div className="rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5">
        <p className="text-sm text-[#2C2F33]/70">Configurația răspunsului numeric lipsește.</p>
      </div>
    )
  }

  if (isSolved) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5">
        <div className="space-y-3">
          {subpoints.map((subpoint, index) => (
            <div key={index} className="space-y-2">
              {subpoints.length > 1 && (
                <p className="text-sm font-semibold text-emerald-800">
                  Subpunctul {getSubpointLabel(index, subpoint.label)})
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-base font-semibold text-[#0b0d10]">{renderInlineMath(subpoint.text_before)}</span>
                <Input
                  type="text"
                  value={String(subpoint.correct_value)}
                  readOnly
                  disabled
                  className="h-12 w-[240px] bg-white text-center text-base font-semibold"
                />
                <span className="text-base font-semibold text-[#0b0d10]">{renderInlineMath(subpoint.text_after)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-emerald-800">Problema a fost rezolvată</p>
      </div>
    )
  }

  if (hasFinished) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <h2 className="text-lg font-semibold text-emerald-800">Toate subpunctele sunt corecte</h2>
            <p className="mt-1 text-sm text-emerald-700">Se salvează rezolvarea...</p>
          </div>
        </div>
      </div>
    )
  }

  const progressLabel = `${currentIndex + 1}/${subpoints.length}`

  return (
    <div className="rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)] lg:p-4">
      <div className="text-sm text-[#2C2F33]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {subpoints.length > 1 && (
            <span className="w-fit rounded-full border border-[#0b0d10]/10 bg-[#f6f5f4] px-2.5 py-1 text-xs font-semibold text-[#2C2F33]/70 lg:shrink-0">
              {progressLabel}
            </span>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 lg:flex-1 lg:flex-nowrap lg:justify-start">
            <span className="text-base font-semibold text-[#0b0d10] lg:min-w-0">
              {renderInlineMath(currentSubpoint.text_before)}
            </span>
            <Input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="..."
              className="h-12 w-[240px] bg-white text-center text-base font-semibold lg:h-11 lg:w-[120px] lg:shrink-0"
            />
            <span className="shrink-0 text-base font-semibold text-[#0b0d10]">{renderInlineMath(currentSubpoint.text_after)}</span>
          </div>
        </div>
      </div>

      {feedback && (
        <p className={`mt-3 text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap lg:mt-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleCheckAnswer}
            className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
          >
            Verifică răspunsul
          </Button>
          {showHintButton && onHintClick && (
            <button
              type="button"
              onClick={onHintClick}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#2C2F33]/80 hover:text-[#0b0d10] hover:bg-[#0b0d10]/5 transition-colors"
            >
              Hint
            </button>
          )}
        </div>
        {typeof eloReward === "number" && eloReward > 0 && (
          <span className="text-sm font-semibold text-emerald-600">+{eloReward} ELO</span>
        )}
      </div>
    </div>
  )
}

function GrilaAnswerCard({
  options,
  correctIndex,
  onCanMarkSolvedChange,
  onSolvedCorrectly,
  isSolved,
  eloReward,
  showHintButton,
  onHintClick,
}: {
  options: string[]
  correctIndex: number
  onCanMarkSolvedChange: (canMarkSolved: boolean) => void
  onSolvedCorrectly?: () => void
  isSolved: boolean
  eloReward?: number | null
  showHintButton?: boolean
  onHintClick?: () => void
}) {
  const [selectedValue, setSelectedValue] = useState<string>("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    onCanMarkSolvedChange(isSolved || isCorrect)
  }, [isCorrect, isSolved, onCanMarkSolvedChange])

  const handleCheck = () => {
    if (!selectedValue) {
      setIsError(true)
      setFeedback("Selectează una dintre cele 3 variante.")
      return
    }

    const selectedIndex = Number(selectedValue)
    const solved = selectedIndex === correctIndex
    setIsCorrect(solved)
    setIsError(!solved)
    setFeedback(solved ? "Corect! Poți marca problema ca rezolvată." : "Răspuns incorect. Încearcă din nou.")
    if (solved) onSolvedCorrectly?.()
  }

  if (options.length !== 3 || correctIndex < 0 || correctIndex > 2) {
    return (
      <div className="rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5">
        <p className="text-sm text-[#2C2F33]/70">Configurația grilei este invalidă.</p>
      </div>
    )
  }

  if (isSolved) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5">
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className={`rounded-xl border px-3 py-3 text-sm ${
                index === correctIndex
                  ? "border-emerald-400 bg-white font-semibold text-emerald-900"
                  : "border-[#0b0d10]/10 bg-white/70 text-[#2C2F33]/70"
              }`}
            >
              {renderInlineMath(option)}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-emerald-800">Problema a fost rezolvată</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)]">
      <h2 className="text-lg font-semibold text-[#0b0d10]">Alege răspunsul corect</h2>
      <p className="mt-1 text-sm text-[#2C2F33]/70">Problema are o singură variantă corectă.</p>

      <RadioGroup
        value={selectedValue}
        onValueChange={(value) => {
          setSelectedValue(value)
          if (feedback) setFeedback(null)
        }}
        className="mt-4 gap-3"
      >
        {options.map((option, index) => (
          <label
            key={index}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#0b0d10]/10 bg-white px-3 py-3 text-sm text-[#2C2F33] hover:bg-[#f6f5f4]"
          >
            <RadioGroupItem value={String(index)} className="mt-0.5" />
            <span>{renderInlineMath(option)}</span>
          </label>
        ))}
      </RadioGroup>

      {feedback && (
        <p className={`mt-3 text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleCheck}
            className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
          >
            Verifică răspunsul
          </Button>
          {showHintButton && onHintClick && (
            <button
              type="button"
              onClick={onHintClick}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#2C2F33]/80 hover:text-[#0b0d10] hover:bg-[#0b0d10]/5 transition-colors"
            >
              Hint
            </button>
          )}
        </div>
        {typeof eloReward === "number" && eloReward > 0 && (
          <span className="text-sm font-semibold text-emerald-600">+{eloReward} ELO</span>
        )}
      </div>
    </div>
  )
}

export function ProblemAnswerCard({ problem, onCanMarkSolvedChange, onSolvedCorrectly, isSolved, showHintButton, onHintClick }: ProblemAnswerCardProps) {
  const normalizedType = problem.answer_type ?? null

  const valueSubpoints = useMemo(() => normalizeValueSubpoints(problem), [problem])
  const grilaOptions = useMemo(() => normalizeGrilaOptions(problem), [problem])
  const grilaCorrectIndex = Number(problem.grila_correct_index)
  const eloReward = useMemo(() => getProblemElo(problem), [problem])

  if (normalizedType === "value") {
    return (
      <ValueAnswerCard
        subpoints={valueSubpoints}
        onCanMarkSolvedChange={onCanMarkSolvedChange}
        onSolvedCorrectly={onSolvedCorrectly}
        isSolved={isSolved}
        eloReward={eloReward}
        showHintButton={showHintButton}
        onHintClick={onHintClick}
      />
    )
  }

  if (normalizedType === "grila") {
    return (
      <GrilaAnswerCard
        options={grilaOptions}
        correctIndex={grilaCorrectIndex}
        onCanMarkSolvedChange={onCanMarkSolvedChange}
        onSolvedCorrectly={onSolvedCorrectly}
        isSolved={isSolved}
        eloReward={eloReward}
        showHintButton={showHintButton}
        onHintClick={onHintClick}
      />
    )
  }

  return null
}

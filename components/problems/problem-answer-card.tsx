"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import type { Problem, ProblemValueSubpoint } from "@/data/problems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import "katex/dist/katex.min.css"
import { InlineMath } from "react-katex"
import { supabase } from "@/lib/supabaseClient"
import type { ProblemWrongAnswerPenalty } from "@/components/problems/problem-wrong-answer-elo-card"
import { cn } from "@/lib/utils"

interface ProblemAnswerCardProps {
  problem: Problem
  onCanMarkSolvedChange: (canMarkSolved: boolean) => void
  onSolvedCorrectly?: () => void
  isSolved: boolean
  /** When true, show a "Hint" button (no border) that opens AI chat with the problem. Used on mobile. */
  showHintButton?: boolean
  onHintClick?: () => void
  userId?: string | null
  /** Wrong substantive answer after „Verifică răspunsul” (not invalid empty/format). */
  onWrongAnswerPenalty?: (penalty: ProblemWrongAnswerPenalty) => void
  /** `bottomBar` = fixed mobile answer dock; default in-page card (desktop). */
  layout?: "card" | "bottomBar"
  /** Mobile bottom-bar maximised/minimised (for chat orb offset). */
  onMobileMaximisedChange?: (maximised: boolean) => void
}

function useMobileAnswerBarChrome(
  enabled: boolean,
  onMaximisedChange?: (maximised: boolean) => void,
) {
  const [isMaximised, setIsMaximised] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) {
      onMaximisedChange?.(false)
      return
    }
    onMaximisedChange?.(isMaximised)
  }, [enabled, isMaximised, onMaximisedChange])

  useEffect(() => {
    if (!enabled || !isMaximised) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target || !rootRef.current) return
      if (!rootRef.current.contains(target)) {
        setIsMaximised(false)
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [enabled, isMaximised])

  return { isMaximised, setIsMaximised, rootRef }
}

function MobileAnswerActionsPanel({
  maximised,
  children,
}: {
  maximised: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-[max-height,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        maximised ? "max-h-72 opacity-100" : "max-h-0 opacity-0",
      )}
      aria-hidden={!maximised}
    >
      <div
        className={cn(
          "origin-bottom pt-3 will-change-transform transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none",
          maximised ? "translate-y-0" : "translate-y-3",
        )}
      >
        {children}
      </div>
    </div>
  )
}

async function fetchWrongAnswerPenalty(userId: string | null | undefined): Promise<ProblemWrongAnswerPenalty> {
  if (!userId) return { kind: "anonymous" }

  const { data, error } = await supabase.rpc("deduct_elo_wrong_problem_answer")

  if (error) {
    console.error("deduct_elo_wrong_problem_answer:", error)
    return { kind: "anonymous" }
  }

  const row = (Array.isArray(data) ? data[0] : data) as {
    previous_elo?: number
    new_elo?: number
    deducted?: number
  } | null

  if (!row) return { kind: "anonymous" }

  return {
    kind: "deducted",
    previousElo: Number(row.previous_elo ?? 0),
    newElo: Number(row.new_elo ?? 0),
    deducted: Number(row.deducted ?? 0),
  }
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
  userId,
  onWrongAnswerPenalty,
  layout = "card",
  onMobileMaximisedChange,
}: {
  subpoints: ProblemValueSubpoint[]
  onCanMarkSolvedChange: (canMarkSolved: boolean) => void
  onSolvedCorrectly?: () => void
  isSolved: boolean
  eloReward?: number | null
  showHintButton?: boolean
  onHintClick?: () => void
  userId?: string | null
  onWrongAnswerPenalty?: (penalty: ProblemWrongAnswerPenalty) => void
  layout?: "card" | "bottomBar"
  onMobileMaximisedChange?: (maximised: boolean) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputValue, setInputValue] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const isBottomBar = layout === "bottomBar"
  const { isMaximised, setIsMaximised, rootRef } = useMobileAnswerBarChrome(
    isBottomBar,
    onMobileMaximisedChange,
  )

  const hasFinished = currentIndex >= subpoints.length

  useEffect(() => {
    onCanMarkSolvedChange(isSolved || hasFinished)
  }, [hasFinished, isSolved, onCanMarkSolvedChange])

  useEffect(() => {
    if (isSolved || hasFinished) setIsMaximised(false)
  }, [hasFinished, isSolved, setIsMaximised])

  const currentSubpoint = subpoints[currentIndex]

  const handleCheckAnswer = () => {
    if (!currentSubpoint) return

    const parsedValue = parseNumericInput(inputValue)
    if (parsedValue === null) {
      setIsMaximised(true)
      setIsError(true)
      setFeedback("Introdu o valoare numerică validă.")
      return
    }

    const isCorrect = isWithinTolerance(parsedValue, currentSubpoint.correct_value)
    if (!isCorrect) {
      void fetchWrongAnswerPenalty(userId).then((penalty) => {
        onWrongAnswerPenalty?.(penalty)
      })
      setIsMaximised(true)
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
    setIsMaximised(true)
    setFeedback(`Corect! Treci la subpunctul ${getSubpointLabel(nextIndex, subpoints[nextIndex].label)}).`)
  }

  const shellClass = isBottomBar
    ? cn(
        "border-t border-[#0b0d10]/10 bg-white px-3 shadow-[0_-10px_30px_-16px_rgba(11,13,16,0.35)]",
        "pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] pt-2.5",
      )
    : "rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)] lg:p-4"

  if (subpoints.length === 0) {
    return (
      <div className={isBottomBar ? shellClass : "rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5"}>
        <p className="text-sm text-[#2C2F33]/70">Configurația răspunsului numeric lipsește.</p>
      </div>
    )
  }

  if (isSolved) {
    return (
      <div
        ref={isBottomBar ? rootRef : undefined}
        className={
          isBottomBar
            ? shellClass
            : "rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5"
        }
      >
        {isBottomBar ? (
          <p className="text-center text-sm font-semibold text-emerald-700">Problema a fost rezolvată</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    )
  }

  if (hasFinished) {
    return (
      <div
        ref={isBottomBar ? rootRef : undefined}
        className={
          isBottomBar
            ? shellClass
            : "rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5"
        }
      >
        {isBottomBar ? (
          <p className="text-center text-sm font-semibold text-emerald-700">Se salvează rezolvarea...</p>
        ) : (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
            <div>
              <h2 className="text-lg font-semibold text-emerald-800">Toate subpunctele sunt corecte</h2>
              <p className="mt-1 text-sm text-emerald-700">Se salvează rezolvarea...</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const progressLabel = `${currentIndex + 1}/${subpoints.length}`

  return (
    <div ref={isBottomBar ? rootRef : undefined} className={shellClass}>
      <div className="text-sm text-[#2C2F33]">
        <div
          className={cn(
            "flex flex-col",
            isBottomBar ? "gap-1.5" : "gap-3 lg:flex-row lg:items-center",
          )}
        >
          {subpoints.length > 1 && (
            <span className="w-fit rounded-full border border-[#0b0d10]/10 bg-[#f6f5f4] px-2.5 py-1 text-xs font-semibold text-[#2C2F33]/70 lg:shrink-0">
              {progressLabel}
            </span>
          )}
          <div
            className={cn(
              "flex items-center gap-2",
              isBottomBar
                ? "flex-nowrap justify-start"
                : "flex-wrap justify-center gap-3 lg:flex-1 lg:flex-nowrap lg:justify-start",
            )}
          >
            {currentSubpoint.text_before ? (
              <span
                className={cn(
                  "font-semibold text-[#0b0d10]",
                  isBottomBar ? "max-w-[34%] shrink truncate text-sm" : "text-base lg:min-w-0",
                )}
              >
                {renderInlineMath(currentSubpoint.text_before)}
              </span>
            ) : null}
            <Input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onFocus={() => {
                if (isBottomBar) setIsMaximised(true)
              }}
              placeholder={isBottomBar ? "Scrie răspunsul..." : "..."}
              className={cn(
                "bg-white text-center font-semibold",
                isBottomBar
                  ? "h-10 min-w-0 flex-1 text-base"
                  : "h-12 w-[240px] text-base lg:h-11 lg:w-[120px] lg:shrink-0",
              )}
            />
            {currentSubpoint.text_after ? (
              <span
                className={cn(
                  "shrink-0 font-semibold text-[#0b0d10]",
                  isBottomBar ? "text-sm" : "text-base",
                )}
              >
                {renderInlineMath(currentSubpoint.text_after)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {isBottomBar ? (
        <MobileAnswerActionsPanel maximised={isMaximised}>
          {feedback ? (
            <p className={`mb-2 text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleCheckAnswer}
                className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
              >
                Verifică
              </Button>
              {showHintButton && onHintClick ? (
                <button
                  type="button"
                  onClick={onHintClick}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#2C2F33]/80 transition-colors hover:bg-[#0b0d10]/5 hover:text-[#0b0d10]"
                >
                  Hint
                </button>
              ) : null}
            </div>
            {typeof eloReward === "number" && eloReward > 0 ? (
              <span className="text-sm font-semibold text-emerald-600">+{eloReward} ELO</span>
            ) : null}
          </div>
        </MobileAnswerActionsPanel>
      ) : (
        <>
          {feedback ? (
            <p className={`mt-2 text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 lg:mt-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleCheckAnswer}
                className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
              >
                Verifică răspunsul
              </Button>
              {showHintButton && onHintClick ? (
                <button
                  type="button"
                  onClick={onHintClick}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#2C2F33]/80 transition-colors hover:bg-[#0b0d10]/5 hover:text-[#0b0d10]"
                >
                  Hint
                </button>
              ) : null}
            </div>
            {typeof eloReward === "number" && eloReward > 0 ? (
              <span className="text-sm font-semibold text-emerald-600">+{eloReward} ELO</span>
            ) : null}
          </div>
        </>
      )}
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
  userId,
  onWrongAnswerPenalty,
  layout = "card",
  onMobileMaximisedChange,
}: {
  options: string[]
  correctIndex: number
  onCanMarkSolvedChange: (canMarkSolved: boolean) => void
  onSolvedCorrectly?: () => void
  isSolved: boolean
  eloReward?: number | null
  showHintButton?: boolean
  onHintClick?: () => void
  userId?: string | null
  onWrongAnswerPenalty?: (penalty: ProblemWrongAnswerPenalty) => void
  layout?: "card" | "bottomBar"
  onMobileMaximisedChange?: (maximised: boolean) => void
}) {
  const [selectedValue, setSelectedValue] = useState<string>("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const isBottomBar = layout === "bottomBar"
  const { isMaximised, setIsMaximised, rootRef } = useMobileAnswerBarChrome(
    isBottomBar,
    onMobileMaximisedChange,
  )

  useEffect(() => {
    onCanMarkSolvedChange(isSolved || isCorrect)
  }, [isCorrect, isSolved, onCanMarkSolvedChange])

  useEffect(() => {
    if (isSolved) setIsMaximised(false)
  }, [isSolved, setIsMaximised])

  const handleCheck = () => {
    if (!selectedValue) {
      setIsMaximised(true)
      setIsError(true)
      setFeedback("Selectează una dintre cele 3 variante.")
      return
    }

    const selectedIndex = Number(selectedValue)
    const solved = selectedIndex === correctIndex
    setIsCorrect(solved)
    setIsError(!solved)
    setIsMaximised(true)
    setFeedback(solved ? "Corect! Poți marca problema ca rezolvată." : "Răspuns incorect. Încearcă din nou.")
    if (!solved) {
      void fetchWrongAnswerPenalty(userId).then((penalty) => {
        onWrongAnswerPenalty?.(penalty)
      })
    }
    if (solved) onSolvedCorrectly?.()
  }

  const shellClass = isBottomBar
    ? cn(
        "border-t border-[#0b0d10]/10 bg-white px-3 shadow-[0_-10px_30px_-16px_rgba(11,13,16,0.35)]",
        "pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] pt-2.5",
      )
    : "rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)]"

  if (options.length !== 3 || correctIndex < 0 || correctIndex > 2) {
    return (
      <div className={isBottomBar ? shellClass : "rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5"}>
        <p className="text-sm text-[#2C2F33]/70">Configurația grilei este invalidă.</p>
      </div>
    )
  }

  if (isSolved) {
    return (
      <div
        ref={isBottomBar ? rootRef : undefined}
        className={
          isBottomBar
            ? shellClass
            : "rounded-3xl border border-emerald-500/30 bg-emerald-50 p-5"
        }
      >
        {isBottomBar ? (
          <p className="text-center text-sm font-semibold text-emerald-700">Problema a fost rezolvată</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    )
  }

  if (!isBottomBar) {
    return (
      <div className={shellClass}>
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

        {feedback ? (
          <p className={`mt-2 text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleCheck}
              className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
            >
              Verifică răspunsul
            </Button>
            {showHintButton && onHintClick ? (
              <button
                type="button"
                onClick={onHintClick}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#2C2F33]/80 transition-colors hover:bg-[#0b0d10]/5 hover:text-[#0b0d10]"
              >
                Hint
              </button>
            ) : null}
          </div>
          {typeof eloReward === "number" && eloReward > 0 ? (
            <span className="text-sm font-semibold text-emerald-600">+{eloReward} ELO</span>
          ) : null}
        </div>
      </div>
    )
  }

  const selectedPreview =
    selectedValue !== "" ? options[Number(selectedValue)] ?? null : null

  return (
    <div ref={rootRef} className={shellClass}>
      <button
        type="button"
        onClick={() => setIsMaximised(true)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#0b0d10]/10 bg-[#f7f7f7] px-3 text-left text-sm font-semibold text-[#2C2F33]/80"
      >
        <span className="min-w-0 truncate">
          {selectedPreview ? renderInlineMath(selectedPreview) : "Alege răspunsul..."}
        </span>
      </button>

      <MobileAnswerActionsPanel maximised={isMaximised}>
        <RadioGroup
          value={selectedValue}
          onValueChange={(value) => {
            setSelectedValue(value)
            setIsMaximised(true)
            if (feedback) setFeedback(null)
          }}
          className="gap-2"
        >
          {options.map((option, index) => (
            <label
              key={index}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#0b0d10]/10 bg-white px-2.5 py-2 text-sm text-[#2C2F33] hover:bg-[#f6f5f4]"
            >
              <RadioGroupItem value={String(index)} className="mt-0.5" />
              <span>{renderInlineMath(option)}</span>
            </label>
          ))}
        </RadioGroup>

        {feedback ? (
          <p className={`mt-2 text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleCheck}
              className="rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
            >
              Verifică
            </Button>
            {showHintButton && onHintClick ? (
              <button
                type="button"
                onClick={onHintClick}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#2C2F33]/80 transition-colors hover:bg-[#0b0d10]/5 hover:text-[#0b0d10]"
              >
                Hint
              </button>
            ) : null}
          </div>
          {typeof eloReward === "number" && eloReward > 0 ? (
            <span className="text-sm font-semibold text-emerald-600">+{eloReward} ELO</span>
          ) : null}
        </div>
      </MobileAnswerActionsPanel>
    </div>
  )
}

export function ProblemAnswerCard({
  problem,
  onCanMarkSolvedChange,
  onSolvedCorrectly,
  isSolved,
  showHintButton,
  onHintClick,
  userId,
  onWrongAnswerPenalty,
  layout = "card",
  onMobileMaximisedChange,
}: ProblemAnswerCardProps) {
  const normalizedType = problem.answer_type ?? null

  const valueSubpoints = useMemo(() => normalizeValueSubpoints(problem), [problem])
  const grilaOptions = useMemo(() => normalizeGrilaOptions(problem), [problem])
  const grilaCorrectIndex = Number(problem.grila_correct_index)
  const eloReward = useMemo(() => getProblemElo(problem), [problem])

  const content =
    normalizedType === "value" ? (
      <ValueAnswerCard
        subpoints={valueSubpoints}
        onCanMarkSolvedChange={onCanMarkSolvedChange}
        onSolvedCorrectly={onSolvedCorrectly}
        isSolved={isSolved}
        eloReward={eloReward}
        showHintButton={showHintButton}
        onHintClick={onHintClick}
        userId={userId}
        onWrongAnswerPenalty={onWrongAnswerPenalty}
        layout={layout}
        onMobileMaximisedChange={onMobileMaximisedChange}
      />
    ) : normalizedType === "grila" ? (
      <GrilaAnswerCard
        options={grilaOptions}
        correctIndex={grilaCorrectIndex}
        onCanMarkSolvedChange={onCanMarkSolvedChange}
        onSolvedCorrectly={onSolvedCorrectly}
        isSolved={isSolved}
        eloReward={eloReward}
        showHintButton={showHintButton}
        onHintClick={onHintClick}
        userId={userId}
        onWrongAnswerPenalty={onWrongAnswerPenalty}
        layout={layout}
        onMobileMaximisedChange={onMobileMaximisedChange}
      />
    ) : null

  if (!content) return null

  if (layout === "bottomBar") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[90] max-h-[min(70dvh,32rem)] overflow-y-auto lg:hidden contain-layout">
        {content}
      </div>
    )
  }

  return content
}

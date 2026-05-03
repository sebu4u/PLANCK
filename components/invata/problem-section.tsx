"use client"

import React, { useCallback, useMemo, useState } from "react"
import { InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import type { Problem, ProblemValueSubpoint } from "@/data/problems"
import { ProblemFeedbackBar } from "@/components/invata/problem-feedback-bar"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toYoutubeEmbedUrl } from "@/lib/youtube-utils"
import { cn } from "@/lib/utils"
import { useLearningPathItemCompletion } from "@/hooks/use-learning-path-item-completion"
import { useLearningPathCorrectAnswerElo } from "@/hooks/use-learning-path-correct-answer-elo"
import { useStuckTrigger } from "@/hooks/engagement/use-stuck-trigger"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"
import { useLearningPathExplainChat } from "@/components/invata/learning-path-explain-chat-context"
import {
  formatProblemLearningPathContext,
  LEARNING_PATH_EXPLAIN_INITIAL_PROMPT,
} from "@/lib/learning-path-insight-context"

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean)
  }
  if (typeof tags === "string" && tags.trim()) {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

function renderInlineMath(value?: string | null) {
  if (!value) return null
  if (!value.includes("$")) return value
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

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const playTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = "sine"
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    playTone(523.25, 0, 0.12, 0.12)
    playTone(659.25, 0.08, 0.12, 0.1)
    playTone(783.99, 0.16, 0.2, 0.08)
  } catch {
    // Ignore
  }
}

const difficultyColors: Record<string, string> = {
  Ușor: "border-emerald-400 bg-emerald-50 text-emerald-800",
  Mediu: "border-amber-400 bg-amber-50 text-amber-800",
  Avansat: "border-rose-400 bg-rose-50 text-rose-800",
}

interface ProblemSectionProps {
  problem: Problem
  nextItemHref: string
  itemIndex: number
  lessonId: string
  currentItemId: string
  isLastItem: boolean
}

export function ProblemSection({
  problem,
  nextItemHref,
  itemIndex,
  lessonId,
  currentItemId,
  isLastItem,
}: ProblemSectionProps) {
  const tags = useMemo(() => normalizeTags(problem.tags), [problem.tags])
  const valueSubpoints = useMemo(() => normalizeValueSubpoints(problem), [problem])
  const grilaOptions = useMemo(() => normalizeGrilaOptions(problem), [problem])
  const grilaCorrectIndex = Number(problem.grila_correct_index ?? -1)
  const answerType = problem.answer_type ?? null

  const [verified, setVerified] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [valueInput, setValueInput] = useState("")
  const [grilaSelected, setGrilaSelected] = useState<string>("")
  const [valueSubpointIndex, setValueSubpointIndex] = useState(0)
  const [eloAward, setEloAward] = useState<LearningPathEloAward | null>(null)
  const explainChat = useLearningPathExplainChat()
  const { pushHint, registerFailure, resetFailures } = useStuckTrigger({ surface: "invata" })

  const hasVideo =
    typeof problem.youtube_url === "string" && problem.youtube_url.trim() !== ""
  const embedUrl = toYoutubeEmbedUrl(problem.youtube_url)

  const currentSubpoint = valueSubpoints[valueSubpointIndex]
  const hasValueAnswer = valueSubpoints.length > 0
  const hasGrilaAnswer =
    grilaOptions.length === 3 &&
    grilaCorrectIndex >= 0 &&
    grilaCorrectIndex <= 2

  const hasAnswer = useMemo(() => {
    if (answerType === "value" && hasValueAnswer) {
      return parseNumericInput(valueInput) !== null
    }
    if (answerType === "grila" && hasGrilaAnswer) {
      return grilaSelected !== ""
    }
    return false
  }, [answerType, hasValueAnswer, hasGrilaAnswer, valueInput, grilaSelected])

  const barState = !verified ? "verify" : isCorrect ? "correct" : "incorrect"
  const onContinue = useLearningPathItemCompletion({
    itemId: currentItemId,
    lessonId,
    isLastItem,
  })
  const awardCorrectAnswerElo = useLearningPathCorrectAnswerElo({
    itemId: currentItemId,
    lessonId,
    isLastItem,
  })

  const onVerify = useCallback(async () => {
    if (answerType === "value" && hasValueAnswer && currentSubpoint) {
      const parsed = parseNumericInput(valueInput)
      if (parsed === null) return
      const correct = isWithinTolerance(parsed, currentSubpoint.correct_value)
      if (correct) {
        const nextIndex = valueSubpointIndex + 1
        if (nextIndex >= valueSubpoints.length) {
          playSuccessSound()
          fireLearningPathCorrectConfetti()
          const award = await awardCorrectAnswerElo()
          setEloAward(award?.awarded ? award : null)
          setVerified(true)
          setIsCorrect(true)
          resetFailures()
        } else {
          setValueSubpointIndex(nextIndex)
          setValueInput("")
        }
      } else {
        setVerified(true)
        setIsCorrect(false)
        registerFailure()
      }
      return
    }
    if (answerType === "grila" && hasGrilaAnswer) {
      const selectedIndex = Number(grilaSelected)
      const correct = selectedIndex === grilaCorrectIndex
      if (correct) {
        playSuccessSound()
        fireLearningPathCorrectConfetti()
        const award = await awardCorrectAnswerElo()
        setEloAward(award?.awarded ? award : null)
        resetFailures()
      } else {
        registerFailure()
      }
      setVerified(true)
      setIsCorrect(correct)
    }
  }, [
    answerType,
    hasValueAnswer,
    hasGrilaAnswer,
    valueInput,
    grilaSelected,
    currentSubpoint,
    valueSubpointIndex,
    valueSubpoints.length,
    grilaCorrectIndex,
    awardCorrectAnswerElo,
    registerFailure,
    resetFailures,
  ])

  const onRetry = useCallback(() => {
    setVerified(false)
    setIsCorrect(null)
    setValueInput("")
    setGrilaSelected("")
    setValueSubpointIndex(0)
    setEloAward(null)
  }, [])

  const answerSlot = useMemo(() => {
    if (answerType === "value" && hasValueAnswer && currentSubpoint) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {valueSubpoints.length > 1 && (
            <span className="shrink-0 text-sm font-medium text-[#6f657b]">
              {String.fromCharCode(97 + valueSubpointIndex)})
            </span>
          )}
          <span className="shrink-0 text-sm font-medium text-[#2C2F33]">
            {renderInlineMath(currentSubpoint.text_before)}
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            placeholder="..."
            className="h-11 min-w-[120px] max-w-[180px] flex-1 rounded-lg border-2 border-[#2a2a2a]/20 bg-[#fafafa] py-2.5 text-center text-base font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:border-[#8b5cf6] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/20"
          />
          <span className="shrink-0 text-sm font-medium text-[#2C2F33]">
            {renderInlineMath(currentSubpoint.text_after)}
          </span>
        </div>
      )
    }
    if (answerType === "grila" && hasGrilaAnswer) {
      return (
        <RadioGroup
          value={grilaSelected}
          onValueChange={setGrilaSelected}
          className="flex flex-wrap items-center gap-2"
        >
          {grilaOptions.map((option, index) => (
            <label
              key={index}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                grilaSelected === String(index)
                  ? "border-[#8b5cf6] bg-[#f5f3ff]"
                  : "border-[#e8e8e8] bg-white hover:bg-[#fafafa]",
              )}
            >
              <RadioGroupItem value={String(index)} />
              <span>{renderInlineMath(option)}</span>
            </label>
          ))}
        </RadioGroup>
      )
    }
    return (
      <p className="text-sm text-[#777777]">
        Această problemă nu are răspuns configurat.
      </p>
    )
  }, [
    answerType,
    hasValueAnswer,
    hasGrilaAnswer,
    currentSubpoint,
    valueSubpointIndex,
    valueSubpoints.length,
    valueInput,
    grilaSelected,
    grilaOptions,
  ])

  const canShowVerifyBar = hasValueAnswer || hasGrilaAnswer

  // Sub lg: înălțime în viewport ca scroll-ul să includă enunț + video; fără verify scădem ~6rem (bara Continuă din shell).
  const mobileScrollHeightClass = canShowVerifyBar
    ? "max-lg:h-[calc(100dvh-3.5rem)] max-lg:min-h-0"
    : "max-lg:h-[calc(100dvh-3.5rem-6rem)] max-lg:min-h-0"

  return (
    <>
      <div
        className={cn(
          "flex flex-col overflow-y-auto px-4 pt-4 pb-4 sm:pt-6 sm:pb-6 lg:h-[calc(100vh-3.5rem)] lg:min-h-0 lg:items-center lg:justify-center",
          mobileScrollHeightClass,
        )}
        style={{
          paddingBottom: canShowVerifyBar
            ? "calc(6rem + env(safe-area-inset-bottom, 0px))"
            : "max(16px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="mx-auto my-auto flex w-full max-w-4xl flex-col items-center py-3 sm:py-4 lg:my-0 lg:py-0">
          <h1 className="hidden w-full shrink-0 pb-4 text-center text-3xl font-bold tracking-tight md:block md:pb-6 md:text-4xl">
            <span className="text-[#6f657b]">#{itemIndex}</span>
            <span className="ml-2 text-[#2C2F33]">Problema rezolvată</span>
          </h1>
          <div className="flex w-full flex-col lg:flex-row lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[#ebe4f1] lg:bg-white lg:shadow-[0_18px_50px_rgba(76,44,114,0.08)]">
            <div className="min-h-0 min-w-0 flex-1 py-2 sm:p-6 lg:overflow-y-auto">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="rounded border border-[#e8e8e8] bg-[#fafafa] px-1.5 py-0.5 text-[10px] font-semibold text-[#555555] sm:rounded-md sm:px-2.5 sm:py-1 sm:text-xs">
                  #{problem.id.slice(0, 8)}
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-[#e8e8e8] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#555555] sm:rounded-md sm:px-2.5 sm:py-1 sm:text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {problem.difficulty && (
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-semibold sm:rounded-md sm:px-2.5 sm:py-1 sm:text-xs",
                      difficultyColors[problem.difficulty] ??
                        "border-[#e8e8e8] bg-[#fafafa] text-[#555555]",
                    )}
                  >
                    {problem.difficulty}
                  </span>
                )}
              </div>
              <div className="mt-4 whitespace-pre-wrap text-lg font-semibold leading-relaxed text-[#2C2F33] sm:text-xl lg:text-lg">
                {renderInlineMath(problem.statement)}
              </div>
              {problem.image_url && (
                <div className="mt-4 flex justify-start">
                  <img
                    src={problem.image_url.replace(/^@/, "")}
                    alt="Ilustrație problemă"
                    className="max-h-48 max-w-full rounded-xl border border-[#e8e8e8] bg-white object-contain shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Video player în același card */}
            {hasVideo && embedUrl && (
              <div className="shrink-0 border-t border-[#ebe4f1] lg:w-[min(50%,420px)] lg:border-t-0 lg:border-l">
                <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={embedUrl}
                    title="Rezolvare video"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {canShowVerifyBar && (
        <ProblemFeedbackBar
          state={barState}
          hasAnswer={hasAnswer}
          nextItemHref={nextItemHref}
          onVerify={onVerify}
          onRetry={onRetry}
          onContinue={onContinue}
          onExplain={() => {
            pushHint("manual")
            const statement =
              answerType === "value" && currentSubpoint
                ? formatProblemLearningPathContext({
                    problem,
                    answerType,
                    valueInput,
                    valueSubpointLabel: currentSubpoint.label,
                    valueCorrectValue: currentSubpoint.correct_value,
                    wasCorrect: isCorrect,
                  })
                : answerType === "grila" && hasGrilaAnswer
                  ? formatProblemLearningPathContext({
                      problem,
                      answerType,
                      grilaOptions,
                      grilaSelectedIndex:
                        grilaSelected === "" ? undefined : Number(grilaSelected),
                      grilaCorrectIndex,
                      wasCorrect: isCorrect,
                    })
                  : formatProblemLearningPathContext({
                      problem,
                      answerType,
                      wasCorrect: isCorrect,
                    })
            explainChat?.openExplainChat({
              problemStatement: statement,
              problemContextPreamble: "",
              initialUserMessage: LEARNING_PATH_EXPLAIN_INITIAL_PROMPT,
            })
          }}
          eloAward={eloAward}
          answerSlot={answerSlot}
        />
      )}
    </>
  )
}

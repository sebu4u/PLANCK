"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { PollFeedbackBar } from "@/components/invata/poll-feedback-bar"
import type { LessonPollOption } from "@/components/invata/lesson-poll"
import { useLearningPathItemCompletion } from "@/hooks/use-learning-path-item-completion"
import { useLearningPathCorrectAnswerElo } from "@/hooks/use-learning-path-correct-answer-elo"
import { useStuckTrigger } from "@/hooks/engagement/use-stuck-trigger"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import { playErrorSound } from "@/lib/platform-sounds"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"
import { useLearningPathExplainChat } from "@/components/invata/learning-path-explain-chat-context"
import {
  formatPollLearningPathContext,
  LEARNING_PATH_EXPLAIN_INITIAL_PROMPT,
} from "@/lib/learning-path-insight-context"
import { useRegisterLearningPathFixedBottomBar } from "@/components/invata/learning-path-item-chrome-context"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import type { LearningPathFlashcardBridge } from "@/lib/learning-path-flashcard-bridge"

export type PollBarState = "verify" | "correct" | "incorrect"

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

interface PollStateContextValue {
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  verified: boolean
  isCorrect: boolean | null
  displayText: string
  question: string
  correctAnswerId: string
  options: LessonPollOption[]
  onVerify: () => void
}

const PollStateContext = createContext<PollStateContextValue | null>(null)

export function usePollState() {
  const ctx = useContext(PollStateContext)
  if (!ctx) return null
  return ctx
}

interface PollSectionProps {
  question: string
  correctAnswerId: string
  options: LessonPollOption[]
  nextItemHref: string
  lessonId: string
  currentItemId: string
  isLastItem: boolean
  chapterSlug: string
  lessonSlug: string
  chapterId?: string | null
  itemTitle?: string | null
  children: React.ReactNode
}

export function PollSection({
  question,
  correctAnswerId,
  options,
  nextItemHref,
  lessonId,
  currentItemId,
  isLastItem,
  chapterSlug,
  lessonSlug,
  chapterId,
  itemTitle,
  children,
}: PollSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [displayText, setDisplayText] = useState(question)
  const [eloAward, setEloAward] = useState<LearningPathEloAward | null>(null)
  const explainChat = useLearningPathExplainChat()
  const { pushHint, registerFailure, resetFailures, consumeStruggledBeforeSuccess } =
    useStuckTrigger({ surface: "poll" })
  const awardCorrectAnswerElo = useLearningPathCorrectAnswerElo({
    itemId: currentItemId,
    lessonId,
    isLastItem,
  })

  const onVerify = useCallback(async () => {
    if (selectedId === null) return
    const selectedOption = options.find((o) => o.id === selectedId)
    if (!selectedOption) return
    const correct = selectedId === correctAnswerId
    if (correct) {
      playSuccessSound()
      fireLearningPathCorrectConfetti()
      const award = await awardCorrectAnswerElo()
      setEloAward(award?.awarded ? award : null)
      resetFailures()
    } else {
      playErrorSound()
      registerFailure()
    }
    setDisplayText(selectedOption.feedback)
    setVerified(true)
    setIsCorrect(correct)
  }, [selectedId, correctAnswerId, options, awardCorrectAnswerElo, registerFailure, resetFailures])

  const onRetry = useCallback(() => {
    setSelectedId(null)
    setVerified(false)
    setIsCorrect(null)
    setDisplayText(question)
    setEloAward(null)
  }, [question])

  const barState: PollBarState = !verified ? "verify" : isCorrect ? "correct" : "incorrect"
  const onContinue = useLearningPathItemCompletion({
    itemId: currentItemId,
    lessonId,
    isLastItem,
  })

  const flashcardBridge = useMemo<LearningPathFlashcardBridge>(
    () => ({
      meta: {
        itemId: currentItemId,
        lessonId,
        chapterId,
        chapterSlug,
        lessonSlug,
        itemType: "poll",
        itemTitle,
      },
      getContext: () =>
        formatPollLearningPathContext({
          question,
          options: options.map((o) => ({ id: o.id, label: o.label })),
          selectedId,
          correctAnswerId,
          displayTextAfterVerify: displayText,
          wasCorrect: isCorrect,
        }),
      consumeStruggledBeforeSuccess,
    }),
    [
      chapterId,
      chapterSlug,
      consumeStruggledBeforeSuccess,
      correctAnswerId,
      currentItemId,
      displayText,
      isCorrect,
      itemTitle,
      lessonId,
      lessonSlug,
      options,
      question,
      selectedId,
    ]
  )

  useRegisterLearningPathFixedBottomBar(
    () => (
      <PollFeedbackBar
        state={barState}
        hasSelection={selectedId !== null}
        nextItemHref={nextItemHref}
        onVerify={onVerify}
        onRetry={onRetry}
        onContinue={onContinue}
        onExplain={() => {
          pushHint("manual")
          explainChat?.openExplainChat({
            problemStatement: formatPollLearningPathContext({
              question,
              options: options.map((o) => ({ id: o.id, label: o.label })),
              selectedId,
              correctAnswerId,
              displayTextAfterVerify: displayText,
              wasCorrect: isCorrect,
            }),
            problemContextPreamble: "",
            initialUserMessage: LEARNING_PATH_EXPLAIN_INITIAL_PROMPT,
          })
        }}
        eloAward={eloAward}
        flashcardBridge={flashcardBridge}
      />
    ),
    [barState, selectedId, nextItemHref, eloAward, displayText, isCorrect, verified, flashcardBridge]
  )

  return (
    <PollStateContext.Provider
      value={{
        selectedId,
        setSelectedId,
        verified,
        isCorrect,
        displayText,
        question,
        correctAnswerId,
        options,
        onVerify,
      }}
    >
      <div className="flex min-h-[calc(100dvh-3.5rem-8rem)] w-full flex-col items-center justify-center px-1 sm:min-h-[calc(100dvh-3.5rem-7.5rem)]">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center text-lg font-bold leading-snug text-[#111111] md:text-xl md:leading-snug">
            <LatexRichText
              content={displayText}
              className="break-words [&_.katex]:text-[#111111] [&_p]:mx-auto"
            />
          </div>
          {children}
        </div>
      </div>
    </PollStateContext.Provider>
  )
}

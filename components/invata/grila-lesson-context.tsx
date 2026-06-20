"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AnswerKey, QuizQuestion } from "@/lib/types/quiz-questions"
import { markQuestionAsSolved } from "@/lib/supabase-quiz"
import { playErrorSound } from "@/lib/platform-sounds"
import { isMultiSelectQuizQuestion, verifyQuizSelection } from "@/lib/quiz-question-utils"
import { recordLearningMistake } from "@/lib/learning-mistakes/client"
import {
  buildQuizQuestionMistakeContext,
  getCorrectQuizAnswers,
  getQuizQuestionMistakeTags,
} from "@/lib/learning-mistakes/context"
import type { LearningMistakeRecordInput } from "@/lib/learning-mistakes/types"

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

const ANSWER_KEYS_ORDER: AnswerKey[] = ["A", "B", "C", "D", "E", "F"]

type GrilaLessonMistakeContext = Omit<
  LearningMistakeRecordInput,
  "surface" | "quizQuestionId" | "submittedAnswer" | "correctAnswer" | "promptContext"
>

type GrilaLessonContextValue = {
  selectedAnswers: AnswerKey[]
  toggleAnswer: (key: AnswerKey) => void
  isVerified: boolean
  /** După verificare: true/false; înainte de verificare null */
  isCorrect: boolean | null
  verify: () => Promise<boolean | null>
  reset: () => void
}

const GrilaLessonContext = createContext<GrilaLessonContextValue | null>(null)

export function useGrilaLesson() {
  return useContext(GrilaLessonContext)
}

export function GrilaLessonProvider({
  question,
  mistakeContext,
  children,
}: {
  question: QuizQuestion
  mistakeContext?: GrilaLessonMistakeContext
  children: ReactNode
}) {
  const multiSelect = isMultiSelectQuizQuestion(question)
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerKey[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const toggleAnswer = useCallback(
    (key: AnswerKey) => {
      if (isVerified) return

      setSelectedAnswers((prev) => {
        if (!multiSelect) {
          return [key]
        }
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        return ANSWER_KEYS_ORDER.filter((answerKey) => next.has(answerKey))
      })
    },
    [isVerified, multiSelect],
  )

  const verify = useCallback(async () => {
    if (selectedAnswers.length === 0 || isVerified) return null
    const correct = verifyQuizSelection(selectedAnswers, question)
    setIsVerified(true)
    setIsCorrect(correct)
    if (correct) {
      playSuccessSound()
      await markQuestionAsSolved(question.id)
    } else {
      playErrorSound()
      void recordLearningMistake({
        ...mistakeContext,
        surface: "learning_path_grila",
        quizQuestionId: question.id,
        itemType: mistakeContext?.itemType ?? "grila",
        subject: mistakeContext?.subject ?? question.materie ?? null,
        conceptTags: mistakeContext?.conceptTags?.length
          ? mistakeContext.conceptTags
          : getQuizQuestionMistakeTags(question),
        submittedAnswer: { selectedAnswers },
        correctAnswer: { correctAnswers: getCorrectQuizAnswers(question) },
        promptContext: buildQuizQuestionMistakeContext(question),
      })
    }
    return correct
  }, [selectedAnswers, isVerified, question, mistakeContext])

  const reset = useCallback(() => {
    setSelectedAnswers([])
    setIsVerified(false)
    setIsCorrect(null)
  }, [])

  const value = useMemo(
    () => ({
      selectedAnswers,
      toggleAnswer,
      isVerified,
      isCorrect,
      verify,
      reset,
    }),
    [selectedAnswers, isVerified, isCorrect, verify, reset, toggleAnswer],
  )

  return (
    <GrilaLessonContext.Provider value={value}>{children}</GrilaLessonContext.Provider>
  )
}

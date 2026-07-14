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
import {
  getCorrectAnswerKeys,
  isMultiSelectQuizQuestion,
  verifyQuizSelection,
} from "@/lib/quiz-question-utils"

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

type GrilaLessonContextValue = {
  selectedAnswers: AnswerKey[]
  disabledWrongAnswers: AnswerKey[]
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
  children,
}: {
  question: QuizQuestion
  children: ReactNode
}) {
  const multiSelect = isMultiSelectQuizQuestion(question)
  const correctAnswerKeys = useMemo(() => new Set(getCorrectAnswerKeys(question)), [question])
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerKey[]>([])
  const [disabledWrongAnswers, setDisabledWrongAnswers] = useState<AnswerKey[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const toggleAnswer = useCallback(
    (key: AnswerKey) => {
      if (isVerified || disabledWrongAnswers.includes(key)) return

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
    [disabledWrongAnswers, isVerified, multiSelect],
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
    }
    return correct
  }, [selectedAnswers, isVerified, question])

  const reset = useCallback(() => {
    if (isCorrect === false && selectedAnswers.length > 0) {
      const wrongSelected = selectedAnswers.filter((key) => !correctAnswerKeys.has(key))
      if (wrongSelected.length > 0) {
        setDisabledWrongAnswers((prev) =>
          ANSWER_KEYS_ORDER.filter((key) => new Set([...prev, ...wrongSelected]).has(key)),
        )
      }
    }
    setSelectedAnswers([])
    setIsVerified(false)
    setIsCorrect(null)
  }, [correctAnswerKeys, isCorrect, selectedAnswers])

  const value = useMemo(
    () => ({
      selectedAnswers,
      disabledWrongAnswers,
      toggleAnswer,
      isVerified,
      isCorrect,
      verify,
      reset,
    }),
    [
      selectedAnswers,
      disabledWrongAnswers,
      isVerified,
      isCorrect,
      verify,
      reset,
      toggleAnswer,
    ],
  )

  return (
    <GrilaLessonContext.Provider value={value}>{children}</GrilaLessonContext.Provider>
  )
}

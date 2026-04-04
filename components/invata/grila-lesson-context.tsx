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

type GrilaLessonContextValue = {
  selectedAnswer: AnswerKey | null
  setSelectedAnswer: (key: AnswerKey | null) => void
  isVerified: boolean
  /** După verificare: true/false; înainte de verificare null */
  isCorrect: boolean | null
  verify: () => Promise<void>
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
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const verify = useCallback(async () => {
    if (selectedAnswer === null || isVerified) return
    const correct = selectedAnswer === question.correct_answer
    setIsVerified(true)
    setIsCorrect(correct)
    if (correct) {
      playSuccessSound()
      await markQuestionAsSolved(question.id)
    }
  }, [selectedAnswer, isVerified, question.correct_answer, question.id])

  const reset = useCallback(() => {
    setSelectedAnswer(null)
    setIsVerified(false)
    setIsCorrect(null)
  }, [])

  const value = useMemo(
    () => ({
      selectedAnswer,
      setSelectedAnswer,
      isVerified,
      isCorrect,
      verify,
      reset,
    }),
    [selectedAnswer, isVerified, isCorrect, verify, reset],
  )

  return (
    <GrilaLessonContext.Provider value={value}>{children}</GrilaLessonContext.Provider>
  )
}

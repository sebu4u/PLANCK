"use client"

import { useCallback } from "react"
import { fetchAndShuffleQuestions } from "@/lib/supabase-quiz"
import type { GradeLevel } from "@/lib/types/quiz-questions"
import { useQuiz } from "./quiz-context"
import { useGrileSubject } from "./grile-subject-context"

export function useGrileClassSelect() {
  const { materie } = useGrileSubject()
  const { classLevel, isLoading, setClassLevel, setQuestions, setLoading } = useQuiz()

  const handleClassSelect = useCallback(
    async (level: GradeLevel) => {
      setClassLevel(level)
      setLoading(true)

      try {
        const shuffledQuestions = await fetchAndShuffleQuestions(level, { materie })
        setQuestions(shuffledQuestions)
      } catch (error) {
        console.error("Error fetching questions:", error)
      } finally {
        setLoading(false)
      }
    },
    [materie, setClassLevel, setLoading, setQuestions],
  )

  return { classLevel, isLoading, handleClassSelect }
}

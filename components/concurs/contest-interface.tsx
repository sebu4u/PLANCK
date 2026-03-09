"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, TimerOff } from "lucide-react"

import { ContestProblem } from "@/components/concurs/contest-problem"
import { ContestSidebar } from "@/components/concurs/contest-sidebar"
import { ContestTimer } from "@/components/concurs/contest-timer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  ContestAnswer,
  ContestProblem as ContestProblemItem,
  ContestSubmission,
  ContestSummary
} from "@/lib/contest-utils"
import { supabase } from "@/lib/supabaseClient"

interface ContestInterfaceProps {
  contest: ContestSummary
  grade: string
  contestCode?: string
  initialProblems: ContestProblemItem[]
  initialSubmissions: ContestSubmission[]
  initialRemainingSeconds: number
}

export function ContestInterface({
  contest,
  grade,
  contestCode,
  initialProblems,
  initialSubmissions,
  initialRemainingSeconds
}: ContestInterfaceProps) {
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, ContestAnswer>>(() =>
    initialSubmissions.reduce<Record<string, ContestAnswer>>((accumulator, submission) => {
      accumulator[submission.problem_id] = submission.answer
      return accumulator
    }, {})
  )
  const [lastSavedAtByProblem, setLastSavedAtByProblem] = useState<Record<string, string>>(() =>
    initialSubmissions.reduce<Record<string, string>>((accumulator, submission) => {
      accumulator[submission.problem_id] = submission.submitted_at
      return accumulator
    }, {})
  )
  const [savingProblemIds, setSavingProblemIds] = useState<string[]>([])
  const [isTimeUp, setIsTimeUp] = useState(initialRemainingSeconds <= 0)
  const saveTimersRef = useRef<Record<string, number>>({})
  const timeUpToastShownRef = useRef(false)

  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const currentProblem = initialProblems[currentIndex]
  const answeredCount = useMemo(
    () => initialProblems.filter((problem) => answers[problem.id]).length,
    [answers, initialProblems]
  )

  const markProblemSaving = (problemId: string, saving: boolean) => {
    setSavingProblemIds((current) => {
      if (saving) {
        return current.includes(problemId) ? current : [...current, problemId]
      }

      return current.filter((id) => id !== problemId)
    })
  }

  const saveAnswer = useCallback(
    async (problemId: string, answer: ContestAnswer) => {
      if (isTimeUp) {
        return
      }

      markProblemSaving(problemId, true)

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token

        if (!accessToken) {
          throw new Error("Sesiune expirată. Reautentifică-te pentru a continua.")
        }

        const response = await fetch("/api/contest/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            contest_id: contest.id,
            problem_id: problemId,
            answer
          })
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.code === "CONTEST_NOT_ACTIVE") {
            setIsTimeUp(true)
          }

          throw new Error(data.error || "Nu am putut salva răspunsul.")
        }

        setLastSavedAtByProblem((current) => ({
          ...current,
          [problemId]: data.submitted_at
        }))
      } catch (error) {
        toast({
          title: "Salvarea a eșuat",
          description:
            error instanceof Error ? error.message : "Nu am putut salva răspunsul pentru această problemă.",
          variant: "destructive"
        })
      } finally {
        markProblemSaving(problemId, false)
      }
    },
    [contest.id, isTimeUp, toast]
  )

  const handleAnswerChange = (answer: ContestAnswer) => {
    if (!currentProblem || isTimeUp) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [currentProblem.id]: answer
    }))

    const existingTimer = saveTimersRef.current[currentProblem.id]
    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }

    saveTimersRef.current[currentProblem.id] = window.setTimeout(() => {
      void saveAnswer(currentProblem.id, answer)
    }, 450)
  }

  const handleExpire = () => {
    setIsTimeUp(true)

    if (!timeUpToastShownRef.current) {
      timeUpToastShownRef.current = true
      toast({
        title: "Timpul a expirat",
        description: "Nu mai poți trimite alte răspunsuri. Poți doar să revezi ce ai completat."
      })
    }
  }

  const goToProblemById = (problemId: string) => {
    const nextIndex = initialProblems.findIndex((problem) => problem.id === problemId)
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex)
    }
  }

  if (!currentProblem) {
    return (
      <Card className="rounded-3xl border-gray-200">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <TimerOff className="h-10 w-10 text-gray-400" />
          <div>
            <p className="text-lg font-semibold text-gray-900">Nu există probleme încărcate</p>
            <p className="text-gray-500">
              Concursul este configurat, dar subiectele pentru clasa ta nu au fost adăugate încă.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gray-900 text-white hover:bg-gray-900">Clasa {grade}</Badge>
              {contestCode ? (
                <Badge variant="outline" className="border-gray-300 bg-white text-gray-700">
                  Cod concurs: {contestCode}
                </Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contest.name}</h1>
              <p className="mt-1 text-gray-600">
                30 de probleme, răspunsuri grilă, salvare automată în timp real.
              </p>
            </div>
          </div>

          <ContestTimer
            initialSeconds={initialRemainingSeconds}
            label="Timp rămas"
            onExpire={handleExpire}
            className="w-full justify-center lg:w-auto"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {answeredCount} / {initialProblems.length} răspunsuri completate
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Validarea timpului și salvarea se fac exclusiv pe server
          </span>
          {isTimeUp ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
              <TimerOff className="h-4 w-4" />
              Timp expirat
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ContestSidebar
            problems={initialProblems}
            currentProblemId={currentProblem.id}
            answers={answers}
            savingProblemIds={savingProblemIds}
            onSelectProblem={goToProblemById}
          />
        </div>

        <div className="space-y-5">
          <ContestProblem
            problem={currentProblem}
            selectedAnswer={answers[currentProblem.id]}
            onAnswerChange={handleAnswerChange}
            disabled={isTimeUp}
            isSaving={savingProblemIds.includes(currentProblem.id)}
            lastSavedAt={lastSavedAtByProblem[currentProblem.id]}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
              disabled={currentIndex === 0}
              className="h-12 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              Problema anterioară
            </Button>

            <p className="text-center text-sm text-gray-500">
              Problema {currentIndex + 1} din {initialProblems.length}
            </p>

            <Button
              type="button"
              onClick={() =>
                setCurrentIndex((current) => Math.min(initialProblems.length - 1, current + 1))
              }
              disabled={currentIndex === initialProblems.length - 1}
              className="h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
            >
              Problema următoare
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

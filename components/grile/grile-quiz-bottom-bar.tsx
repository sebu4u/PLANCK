"use client"

import React from "react"
import { ArrowLeft, ArrowRight, CheckCircle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserAnswer } from "@/lib/types/quiz-questions"
import { playGrileClickSound } from "@/lib/grile-quiz-audio"

export interface GrileQuizBottomBarProps {
  currentAnswer: UserAnswer | null
  canGoNext: boolean
  canGoPrevious: boolean
  onVerify: () => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onReset: () => void
  isLastQuestion: boolean
  /** When Insight e dockat pe desktop, bara se retrage ca pe learning paths */
  insightDesktopOpen: boolean
}

export function GrileQuizBottomBar({
  currentAnswer,
  canGoNext,
  canGoPrevious,
  onVerify,
  onNext,
  onPrevious,
  onSkip,
  onReset,
  isLastQuestion,
  insightDesktopOpen,
}: GrileQuizBottomBarProps) {
  const hasSelectedAnswer = currentAnswer?.selectedAnswer !== null
  const isVerified = currentAnswer?.isVerified ?? false
  const isCorrect = currentAnswer?.isCorrect === true

  const barTone = !isVerified
    ? "border-[#eee7f3] bg-white/95 backdrop-blur-sm"
    : isCorrect
      ? "border-emerald-200 bg-emerald-50"
      : "border-gray-200 bg-gray-100"

  const outlineBtn =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#4d4d4d] shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"

  const verifyBtnEnabled =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#050505] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#050505]"

  const nextBtn =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-violet-500 hover:shadow-[0_1px_0_#5b21b6] disabled:cursor-not-allowed disabled:opacity-40"

  const newTestBtn =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_1px_0_#047857]"

  const click = playGrileClickSound

  const rightAction = (() => {
    if (isLastQuestion && isVerified) {
      return (
        <button
          type="button"
          onClick={() => {
            click()
            onReset()
          }}
          className={newTestBtn}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Nou test
        </button>
      )
    }
    if (isVerified) {
      return (
        <button
          type="button"
          onClick={() => {
            click()
            onNext()
          }}
          disabled={!canGoNext}
          className={nextBtn}
        >
          Următoarea
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )
    }
    if (hasSelectedAnswer) {
      return (
        <button
          type="button"
          onClick={() => {
            click()
            onVerify()
          }}
          className={verifyBtnEnabled}
        >
          <CheckCircle className="h-4 w-4" aria-hidden />
          Verifică
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={() => {
          click()
          onSkip()
        }}
        className={outlineBtn}
      >
        Skip
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    )
  })()

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[300] border-t px-4 py-2.5 sm:px-6 sm:py-4",
        insightDesktopOpen && "lg:right-[25vw]",
        barTone,
      )}
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            click()
            onPrevious()
          }}
          disabled={!canGoPrevious}
          className={outlineBtn}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Înapoi
        </button>
        {rightAction}
      </div>
    </div>
  )
}

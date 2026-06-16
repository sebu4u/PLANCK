"use client"

import React from "react"
import { ArrowLeft, ArrowRight, CheckCircle, ChevronRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserAnswer } from "@/lib/types/quiz-questions"
import { playGrileClickSound } from "@/lib/grile-quiz-audio"

type GrileBarState = "verify" | "correct" | "incorrect"

export interface GrileQuizBottomBarProps {
  currentAnswer: UserAnswer | null
  canGoNext: boolean
  canGoPrevious: boolean
  onVerify: () => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onReset: () => void
  onExplain?: () => void
  isLastQuestion: boolean
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
  onExplain,
  isLastQuestion,
  insightDesktopOpen,
}: GrileQuizBottomBarProps) {
  const hasSelectedAnswer = (currentAnswer?.selectedAnswers.length ?? 0) > 0
  const isVerified = currentAnswer?.isVerified ?? false
  const isCorrect = currentAnswer?.isCorrect === true

  const barState: GrileBarState = !isVerified ? "verify" : isCorrect ? "correct" : "incorrect"

  const outlineBtn =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#4d4d4d] shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"

  const verifyBtnEnabled =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#050505] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#050505]"

  const nextBtn =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_1px_0_#047857] disabled:cursor-not-allowed disabled:opacity-40"

  const newTestBtn =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_1px_0_#047857]"

  const click = playGrileClickSound

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[310] border-t px-4 py-2.5 sm:px-6 sm:py-4",
        "lg:left-[calc(300px+3px)] lg:bottom-[3px] lg:rounded-b-xl",
        insightDesktopOpen ? "lg:right-[calc(25vw+3px)]" : "lg:right-[3px]",
        barState === "verify" && "border-[#eee7f3] bg-white/95 backdrop-blur-sm",
        barState === "incorrect" && "border-gray-200 bg-gray-100",
        barState === "correct" && "border-emerald-200 bg-emerald-50",
      )}
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))" }}
    >
      {barState === "verify" && (
        <>
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 lg:hidden">
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
            {hasSelectedAnswer ? (
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
            ) : (
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
            )}
          </div>

          <div className="mx-auto hidden w-full max-w-2xl flex-1 flex-col items-stretch gap-2 lg:flex lg:flex-row lg:items-center lg:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  click()
                  onPrevious()
                }}
                disabled={!canGoPrevious}
                className={cn(outlineBtn, "hidden sm:inline-flex")}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Înapoi
              </button>
              <span className="text-sm font-medium text-[#6f657b]">
                Răspunsul se selectează în chenarele de mai sus.
              </span>
            </div>
            {hasSelectedAnswer ? (
              <button
                type="button"
                onClick={() => {
                  click()
                  onVerify()
                }}
                className={cn(verifyBtnEnabled, "w-full sm:w-auto")}
              >
                <CheckCircle className="h-4 w-4" aria-hidden />
                Verifică
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  click()
                  onSkip()
                }}
                className={cn(outlineBtn, "w-full sm:w-auto")}
              >
                Skip
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </>
      )}

      {barState !== "verify" && (
        <div className="mx-auto flex w-full max-w-2xl animate-in flex-col items-center justify-center gap-2 px-2 text-center fade-in slide-in-from-bottom-4 duration-300 sm:flex-row sm:gap-6 sm:px-4 sm:text-left">
          <div className="flex items-center gap-2 sm:gap-3">
            {isCorrect ? (
              <>
                <span className="text-xl sm:text-3xl" aria-hidden>
                  🎉
                </span>
                <span className="text-base font-bold text-[#111111] sm:text-xl">Corect!</span>
              </>
            ) : (
              <>
                <span className="text-xl sm:text-3xl" aria-hidden>
                  🎯
                </span>
                <span className="text-base font-bold text-[#111111] sm:text-xl">Incorect</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
            {onExplain ? (
              <button
                type="button"
                onClick={() => {
                  click()
                  onExplain()
                }}
                className="rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 sm:px-4 sm:py-2.5 sm:text-base"
              >
                De ce?
              </button>
            ) : null}

            {isCorrect ? (
              isLastQuestion ? (
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
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    click()
                    onNext()
                  }}
                  disabled={!canGoNext}
                  className={cn(nextBtn, "inline-flex items-center gap-1.5")}
                >
                  Următoarea
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              )
            ) : !isLastQuestion && canGoNext ? (
              <button
                type="button"
                onClick={() => {
                  click()
                  onNext()
                }}
                className={cn(nextBtn, "inline-flex items-center gap-1.5")}
              >
                Următoarea
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

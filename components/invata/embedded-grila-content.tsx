"use client"

import React, { useState } from "react"
import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import type { QuizQuestion, AnswerKey, QuizAnswers } from "@/lib/types/quiz-questions"
import { difficultyLabels } from "@/lib/types/quiz-questions"
import { markQuestionAsSolved } from "@/lib/supabase-quiz"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmbeddedGrilaContentProps {
  question: QuizQuestion
}

const answerKeys: AnswerKey[] = ["A", "B", "C", "D", "E", "F"]

const difficultyColors: Record<1 | 2 | 3, string> = {
  1: "border-emerald-500/40 bg-emerald-50 text-emerald-700",
  2: "border-amber-500/40 bg-amber-50 text-amber-700",
  3: "border-rose-500/40 bg-rose-50 text-rose-700",
}

function LatexContent({ content }: { content: string }) {
  if (!content) return null
  const hasBlockMath = content.includes("$$")
  const hasInlineMath = content.includes("$")

  if (!hasBlockMath && !hasInlineMath) {
    return <span>{content}</span>
  }

  if (hasBlockMath) {
    const parts = content.split(/(\$\$[^$]+\$\$)/g)
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            return <BlockMath key={idx} math={part.slice(2, -2)} />
          }
          return <InlineLatexContent key={idx} content={part} />
        })}
      </>
    )
  }

  return <InlineLatexContent content={content} />
}

function InlineLatexContent({ content }: { content: string }) {
  const parts = content.split(/(\$[^$]+\$)/g)
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={idx} math={part.slice(1, -1)} />
        }
        return <span key={idx}>{part}</span>
      })}
    </>
  )
}

function getAnswerEntries(answers: QuizAnswers): [AnswerKey, string][] {
  return answerKeys
    .map((key) => [key, answers[key]] as [AnswerKey, string])
    .filter(([, text]) => text != null && String(text).trim() !== "")
}

export function EmbeddedGrilaContent({ question }: EmbeddedGrilaContentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const answerEntries = getAnswerEntries(question.answers)
  const isCorrect = isVerified && selectedAnswer === question.correct_answer

  const handleVerify = async () => {
    if (selectedAnswer === null || isVerified) return
    setIsVerified(true)
    if (selectedAnswer === question.correct_answer) {
      await markQuestionAsSolved(question.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
            difficultyColors[question.difficulty]
          )}
        >
          {difficultyLabels[question.difficulty]}
        </span>
        {question.question_id && (
          <span className="inline-flex rounded-full border border-[#e5e5e5] bg-[#f5f5f5] px-3 py-1 font-mono text-xs text-[#666666]">
            {question.question_id}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-[#e8e8e8] bg-[#fafafa] p-5 sm:p-6">
        <div className="text-base leading-relaxed text-[#2C2F33] md:text-lg">
          <LatexContent content={question.statement} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {answerEntries.map(([key, text]) => {
          const state = !isVerified
            ? selectedAnswer === key
              ? "selected"
              : "default"
            : key === question.correct_answer
              ? "correct"
              : selectedAnswer === key
                ? "incorrect"
                : "disabled"

          return (
            <button
              key={key}
              type="button"
              onClick={() => !isVerified && setSelectedAnswer(key)}
              disabled={isVerified}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                state === "default" &&
                  "border-[#e5e5e5] bg-white hover:border-[#8b5cf6]/40 hover:bg-[#faf5ff]",
                state === "selected" &&
                  "border-[#8b5cf6]/60 bg-[#8b5cf6]/10",
                state === "correct" &&
                  "border-emerald-500/60 bg-emerald-50",
                state === "incorrect" &&
                  "border-rose-500/60 bg-rose-50",
                state === "disabled" &&
                  "border-[#e5e5e5] bg-[#f9f9f9] opacity-60",
                isVerified && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                  state === "default" && "bg-[#e5e5e5] text-[#666666]",
                  state === "selected" && "bg-[#8b5cf6]/30 text-[#7c3aed]",
                  state === "correct" && "bg-emerald-500/30 text-emerald-700",
                  state === "incorrect" && "bg-rose-500/30 text-rose-700",
                  state === "disabled" && "bg-[#e5e5e5] text-[#999999]"
                )}
              >
                {state === "correct" ? (
                  <Check className="h-4 w-4" />
                ) : state === "incorrect" ? (
                  <X className="h-4 w-4" />
                ) : (
                  key
                )}
              </div>
              <div
                className={cn(
                  "flex-1 pt-0.5 text-sm leading-relaxed sm:text-base",
                  state === "default" && "text-[#4d4d4d]",
                  state === "selected" && "text-[#111111]",
                  state === "correct" && "text-emerald-800",
                  state === "incorrect" && "text-rose-800",
                  state === "disabled" && "text-[#999999]"
                )}
              >
                <LatexContent content={text} />
              </div>
            </button>
          )
        })}
      </div>

      {!isVerified && selectedAnswer !== null && (
        <button
          type="button"
          onClick={handleVerify}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]"
        >
          <Check className="h-4 w-4" />
          Verifică
        </button>
      )}

      {isVerified && (
        <p
          className={cn(
            "text-sm font-semibold",
            isCorrect ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {isCorrect ? "Corect! Felicitări." : "Răspuns incorect. Încearcă din nou la următoarea lecție."}
        </p>
      )}
    </div>
  )
}

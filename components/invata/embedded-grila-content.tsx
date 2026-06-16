"use client"

import React from "react"
import Image from "next/image"
import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import type { QuizQuestion, AnswerKey, QuizAnswers } from "@/lib/types/quiz-questions"
import { useGrilaLesson } from "@/components/invata/grila-lesson-context"
import { Check, ExternalLink, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { hasMixedLatexDelimiters, splitMixedLatex } from "@/lib/parse-mixed-latex"
import { getActiveAnswerEntries, getCorrectAnswerKeys } from "@/lib/quiz-question-utils"

interface EmbeddedGrilaContentProps {
  question: QuizQuestion
}

function LatexContent({ content }: { content: string }) {
  if (!content) return null
  if (!hasMixedLatexDelimiters(content)) {
    return <span>{content}</span>
  }

  const pieces = splitMixedLatex(content)
  return (
    <>
      {pieces.map((part, idx) => {
        if (part.type === "text") {
          return <span key={idx}>{part.value}</span>
        }
        if (part.type === "inline") {
          return <InlineMath key={idx} math={part.value} />
        }
        return <BlockMath key={idx} math={part.value} />
      })}
    </>
  )
}

export function EmbeddedGrilaContent({ question }: EmbeddedGrilaContentProps) {
  const ctx = useGrilaLesson()
  if (!ctx) {
    throw new Error("EmbeddedGrilaContent must be used inside GrilaLessonProvider")
  }

  const { selectedAnswers, toggleAnswer, isVerified } = ctx
  const selectedSet = new Set(selectedAnswers)
  const correctSet = new Set(getCorrectAnswerKeys(question))
  const answerEntries = getActiveAnswerEntries(question.answers)
  const displayTitle = question.title?.trim() || question.question_id

  return (
    <div className="space-y-8">
      {question.title?.trim() ? (
        <p className="text-sm font-semibold uppercase tracking-wide text-[#6d6d6d]">{displayTitle}</p>
      ) : null}

      {question.description?.trim() ? (
        <p className="text-sm leading-relaxed text-[#6d6d6d]">{question.description.trim()}</p>
      ) : null}

      {question.image_url?.trim() ? (
        <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-[#fafafa]">
          <Image
            src={question.image_url.trim()}
            alt={displayTitle}
            width={960}
            height={540}
            className="h-auto w-full object-contain"
            unoptimized
          />
        </div>
      ) : null}

      <div className="text-lg font-bold leading-snug text-[#111111] md:text-xl md:leading-snug">
        <LatexContent content={question.statement} />
      </div>

      {question.video_url?.trim() ? (
        <a
          href={question.video_url.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-600"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Vezi rezolvarea video
        </a>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {answerEntries.map(([key, text]) => {
          const isSelected = selectedSet.has(key)
          const state = !isVerified
            ? isSelected
              ? "selected"
              : "default"
            : correctSet.has(key) && isSelected
              ? "correct"
              : correctSet.has(key)
                ? "correct"
                : isSelected
                  ? "incorrect"
                  : "disabled"

          return (
            <button
              key={key}
              type="button"
              onClick={() => !isVerified && toggleAnswer(key)}
              disabled={isVerified}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border border-[#ececec] bg-white p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all",
                state === "default" &&
                  "hover:border-[#8b5cf6]/45 hover:bg-[#faf8ff] hover:shadow-[0_4px_20px_rgba(124,58,237,0.08)]",
                state === "selected" &&
                  "border-[#8b5cf6]/60 bg-[#f5f0ff] shadow-[0_4px_20px_rgba(124,58,237,0.12)]",
                state === "correct" &&
                  "border-emerald-500/55 bg-emerald-50/90",
                state === "incorrect" &&
                  "border-rose-500/55 bg-rose-50/90",
                state === "disabled" &&
                  "border-[#ececec] bg-[#fafafa] opacity-65",
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
    </div>
  )
}

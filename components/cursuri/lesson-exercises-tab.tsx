"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, ChevronDown, X } from "lucide-react"
import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { hasMixedLatexDelimiters, splitMixedLatex } from "@/lib/parse-mixed-latex"
import type { LessonExerciseAnswer, LessonExercisePublic } from "@/lib/lesson-exercises"
import { cn } from "@/lib/utils"

function LatexContent({ content }: { content: string }) {
  if (!content) return null
  if (!hasMixedLatexDelimiters(content)) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }

  const pieces = splitMixedLatex(content)
  return (
    <>
      {pieces.map((part, idx) => {
        if (part.type === "text") {
          return (
            <span key={idx} className="whitespace-pre-wrap">
              {part.value}
            </span>
          )
        }
        if (part.type === "inline") {
          return <InlineMath key={idx} math={part.value} />
        }
        return <BlockMath key={idx} math={part.value} />
      })}
    </>
  )
}

function ExerciseStatement({ exercise }: { exercise: LessonExercisePublic }) {
  if (exercise.statementFormat === "markdown") {
    return <LessonRichContent content={exercise.statement} theme="light" />
  }
  return (
    <div className="text-base font-medium leading-relaxed text-[#2C2F33]">
      <LatexContent content={exercise.statement} />
    </div>
  )
}

function GrilaAnswerChoices({
  answers,
  correctAnswers,
}: {
  answers: LessonExerciseAnswer[]
  correctAnswers: string[]
}) {
  const correctSet = useMemo(() => new Set(correctAnswers), [correctAnswers])
  const multiSelect = correctAnswers.length > 1
  const [selected, setSelected] = useState<string[]>([])
  const [isVerified, setIsVerified] = useState(false)

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const isCorrect =
    isVerified &&
    selected.length === correctAnswers.length &&
    selected.every((key) => correctSet.has(key))

  const toggle = useCallback(
    (key: string) => {
      if (isVerified) return
      setSelected((prev) => {
        if (!multiSelect) return [key]
        if (prev.includes(key)) return prev.filter((item) => item !== key)
        return [...prev, key]
      })
    },
    [isVerified, multiSelect],
  )

  const verify = useCallback(() => {
    if (selected.length === 0 || isVerified) return
    setIsVerified(true)
  }, [isVerified, selected.length])

  const reset = useCallback(() => {
    setSelected([])
    setIsVerified(false)
  }, [])

  return (
    <div className="mt-4 space-y-3">
      <ol className="space-y-2">
        {answers.map((answer) => {
          const isSelected = selectedSet.has(answer.key)
          const state = !isVerified
            ? isSelected
              ? "selected"
              : "default"
            : isCorrect && correctSet.has(answer.key)
              ? "correct"
              : isSelected && !correctSet.has(answer.key)
                ? "incorrect"
                : isVerified && correctSet.has(answer.key)
                  ? "correct"
                  : "disabled"

          return (
            <li key={answer.key}>
              <button
                type="button"
                onClick={() => toggle(answer.key)}
                disabled={isVerified}
                className={cn(
                  "flex w-full items-start rounded-lg border px-3 py-2 text-left text-sm text-[#2C2F33] transition-colors",
                  state === "default" && "border-gray-200 bg-[#F8FAFD] hover:border-gray-300 hover:bg-white",
                  state === "selected" && "border-violet-400 bg-violet-50 ring-1 ring-violet-200/60",
                  state === "correct" && "border-emerald-300 bg-emerald-50",
                  state === "incorrect" && "border-rose-300 bg-rose-50",
                  state === "disabled" && "border-gray-100 bg-gray-50/40 opacity-60",
                  isVerified ? "cursor-default" : "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "mr-2 mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                    state === "default" && "bg-gray-200 text-gray-700",
                    state === "selected" && "bg-violet-200 text-violet-900",
                    state === "correct" && "bg-emerald-200 text-emerald-800",
                    state === "incorrect" && "bg-rose-200 text-rose-800",
                    state === "disabled" && "bg-gray-100 text-gray-400",
                  )}
                >
                  {state === "correct" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : state === "incorrect" ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    answer.key
                  )}
                </span>
                <span className="pt-0.5">
                  <LatexContent content={answer.text} />
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        {!isVerified ? (
          <button
            type="button"
            onClick={verify}
            disabled={selected.length === 0}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium",
              selected.length === 0
                ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                : "border border-gray-900 bg-gray-900 text-white hover:bg-gray-800",
            )}
          >
            Verifică
          </button>
        ) : (
          <>
            <p
              className={cn(
                "text-sm font-medium",
                isCorrect ? "text-emerald-700" : "text-rose-700",
              )}
            >
              {isCorrect ? "Răspuns corect" : "Răspuns greșit"}
            </p>
            {!isCorrect ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-[#F8FAFD]"
              >
                Încearcă din nou
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function LessonExerciseCard({ exercise }: { exercise: LessonExercisePublic }) {
  const imageUrl = exercise.imageUrl?.replace(/^@/, "").trim()
  const canChooseAnswers =
    exercise.contentType === "grila" &&
    Boolean(exercise.answers?.length) &&
    Boolean(exercise.correctAnswers?.length)

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-gray-200 bg-[#F8FAFD] px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {exercise.kindLabel}
        </span>
        {exercise.difficulty ? (
          <span className="text-xs text-gray-500">{exercise.difficulty}</span>
        ) : null}
      </div>

      {exercise.title ? (
        <h3 className="mb-3 text-base font-semibold text-[#111111]">{exercise.title}</h3>
      ) : null}

      {imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-[#F8FAFD]">
          <img
            src={imageUrl}
            alt=""
            className="h-auto w-full max-w-full object-contain"
          />
        </div>
      ) : null}

      <ExerciseStatement exercise={exercise} />

      {canChooseAnswers ? (
        <GrilaAnswerChoices
          answers={exercise.answers!}
          correctAnswers={exercise.correctAnswers!}
        />
      ) : exercise.answers && exercise.answers.length > 0 ? (
        <ol className="mt-4 space-y-2">
          {exercise.answers.map((answer) => (
            <li
              key={answer.key}
              className="rounded-lg border border-gray-200 bg-[#F8FAFD] px-3 py-2 text-sm text-[#2C2F33]"
            >
              <span className="mr-2 font-semibold text-gray-700">{answer.key}.</span>
              <LatexContent content={answer.text} />
            </li>
          ))}
        </ol>
      ) : null}

      <Link
        href={exercise.href}
        className={cn(
          "mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4",
          "border border-gray-900 bg-gray-900 text-sm font-medium text-white",
          "hover:bg-gray-800",
        )}
      >
        Vezi rezolvarea
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  )
}

export function LessonExercisesTab({
  exercises,
}: {
  exercises: LessonExercisePublic[]
}) {
  return (
    <Collapsible defaultOpen className="group/exercises mt-10">
      <CollapsibleTrigger
        className={cn(
          "flex h-auto w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#F8FAFD] px-3 py-2",
          "text-left text-sm font-medium text-gray-900",
          "hover:bg-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300",
        )}
      >
        <span>Exerciții rezolvate</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 group-data-[state=open]/exercises:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 data-[state=closed]:animate-none">
        {exercises.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-[#F8FAFD] px-4 py-8 text-center text-sm text-gray-500">
            Niciun exercițiu încă
          </p>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <LessonExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

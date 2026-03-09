"use client"

import { Suspense, lazy } from "react"
import { CheckCircle2, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ContestAnswer, ContestProblem as ContestProblemItem, isContestAnswer } from "@/lib/contest-utils"
import { cn } from "@/lib/utils"

const LazyInlineMath = lazy(() =>
  import("react-katex").then((module) => ({ default: module.InlineMath }))
)

const LazyBlockMath = lazy(() =>
  import("react-katex").then((module) => ({ default: module.BlockMath }))
)

function InlineLatexContent({ content }: { content: string }) {
  const parts = content.split(/(\$[^$]+\$)/g)

  return (
    <Suspense fallback={<span className="text-gray-500">Se încarcă...</span>}>
      {parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          return <LazyInlineMath key={index} math={part.slice(1, -1)} />
        }

        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      })}
    </Suspense>
  )
}

function LatexContent({ content }: { content: string }) {
  if (!content.includes("$")) {
    return <span className="whitespace-pre-wrap">{content}</span>
  }

  if (content.includes("$$")) {
    const parts = content.split(/(\$\$[\s\S]+?\$\$)/g)

    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            return (
              <Suspense key={index} fallback={<div className="text-gray-500">Se încarcă...</div>}>
                <LazyBlockMath math={part.slice(2, -2)} />
              </Suspense>
            )
          }

          if (!part) {
            return null
          }

          return (
            <div key={index} className="leading-7 text-gray-800">
              <InlineLatexContent content={part} />
            </div>
          )
        })}
      </div>
    )
  }

  return <InlineLatexContent content={content} />
}

interface ContestProblemProps {
  problem: ContestProblemItem
  selectedAnswer?: ContestAnswer
  onAnswerChange: (answer: ContestAnswer) => void
  disabled?: boolean
  isSaving?: boolean
  lastSavedAt?: string
}

export function ContestProblem({
  problem,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
  isSaving = false,
  lastSavedAt
}: ContestProblemProps) {
  const options: { key: ContestAnswer; value: string }[] = [
    { key: "A", value: problem.option_a },
    { key: "B", value: problem.option_b },
    { key: "C", value: problem.option_c },
    { key: "D", value: problem.option_d }
  ]

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
              Problema {problem.display_order}
            </Badge>
            <CardTitle className="text-2xl text-gray-900">Alege varianta corectă</CardTitle>
          </div>

          <div className="text-right">
            {isSaving ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Se salvează...
              </div>
            ) : lastSavedAt ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Salvat la {new Date(lastSavedAt).toLocaleTimeString("ro-RO")}
              </div>
            ) : (
              <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                Niciun răspuns salvat încă
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5 text-base leading-7 text-gray-800">
          <LatexContent content={problem.statement} />
        </div>

        {problem.image_url ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <img
              src={problem.image_url}
              alt={`Imagine pentru problema ${problem.display_order}`}
              className="max-h-[420px] w-full object-contain"
            />
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <RadioGroup
          value={selectedAnswer}
          onValueChange={(value) => {
            if (isContestAnswer(value)) {
              onAnswerChange(value)
            }
          }}
          disabled={disabled}
        >
          {options.map((option) => {
            const isSelected = selectedAnswer === option.key

            return (
              <label
                key={option.key}
                htmlFor={`problem-${problem.id}-${option.key}`}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition-all",
                  "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40",
                  disabled && "cursor-not-allowed opacity-70",
                  isSelected && "border-orange-500 bg-orange-50 shadow-sm"
                )}
              >
                <RadioGroupItem
                  id={`problem-${problem.id}-${option.key}`}
                  value={option.key}
                  className="mt-1 border-orange-500 text-orange-500"
                />

                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                      {option.key}
                    </span>
                  </div>
                  <div className="leading-7 text-gray-800">
                    <LatexContent content={option.value} />
                  </div>
                </div>
              </label>
            )
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

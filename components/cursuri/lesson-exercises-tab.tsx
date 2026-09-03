"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { hasMixedLatexDelimiters, splitMixedLatex } from "@/lib/parse-mixed-latex"
import type { LessonExercisePublic } from "@/lib/lesson-exercises"
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

function LessonExerciseCard({ exercise }: { exercise: LessonExercisePublic }) {
  const imageUrl = exercise.imageUrl?.replace(/^@/, "").trim()

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

      {exercise.answers && exercise.answers.length > 0 ? (
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
    <Tabs defaultValue="exercises" className="mt-10">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-gray-200 bg-[#F8FAFD] p-1">
        <TabsTrigger
          value="exercises"
          className="rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
        >
          Exerciții rezolvate
        </TabsTrigger>
      </TabsList>
      <TabsContent value="exercises" className="mt-4">
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
      </TabsContent>
    </Tabs>
  )
}

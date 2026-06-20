"use client"

import React, { useEffect, useState } from "react"
import { InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import type { Problem } from "@/data/problems"
import { ProblemAnswerCard, type ProblemAnswerWrongAnswerDetails } from "@/components/problems/problem-answer-card"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { toYoutubeEmbedUrl } from "@/lib/youtube-utils"
import { recordLearningMistake } from "@/lib/learning-mistakes/client"
import { buildProblemMistakeContext, getProblemMistakeTags } from "@/lib/learning-mistakes/context"

interface EmbeddedProblemContentProps {
  problem: Problem
}

function renderInlineMath(value?: string | null) {
  if (!value) return null
  if (!value.includes("$")) return value
  return value.split(/(\$[^$]+\$)/g).map((part, idx) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={idx} math={part.slice(1, -1)} />
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

export function EmbeddedProblemContent({ problem }: EmbeddedProblemContentProps) {
  const { user } = useAuth()
  const [isSolved, setIsSolved] = useState(false)
  const [loadingSolved, setLoadingSolved] = useState(true)

  const hasVideo =
    typeof problem.youtube_url === "string" && problem.youtube_url.trim() !== ""
  const embedUrl = toYoutubeEmbedUrl(problem.youtube_url)
  const hasAnswerCard =
    problem.answer_type === "value" || problem.answer_type === "grila"

  useEffect(() => {
    const checkSolved = async () => {
      if (!user) {
        setLoadingSolved(false)
        return
      }
      const { data } = await supabase
        .from("solved_problems")
        .select("id")
        .eq("user_id", user.id)
        .eq("problem_id", problem.id)
        .maybeSingle()
      setIsSolved(!!data)
      setLoadingSolved(false)
    }
    checkSolved()
  }, [user, problem.id])

  const handleMarkSolved = async () => {
    if (!user || isSolved) return
    setLoadingSolved(true)
    const { error } = await supabase.from("solved_problems").insert({
      user_id: user.id,
      problem_id: problem.id,
      solved_at: new Date().toISOString(),
    })
    if (!error) setIsSolved(true)
    setLoadingSolved(false)
  }

  const handleWrongAnswer = (details: ProblemAnswerWrongAnswerDetails) => {
    void recordLearningMistake({
      surface: "catalog_problem",
      problemId: problem.id,
      itemType: problem.answer_type ?? details.answerType,
      subject: problem.category ?? null,
      conceptTags: getProblemMistakeTags(problem),
      submittedAnswer: details.submittedAnswer,
      correctAnswer: details.correctAnswer,
      promptContext: buildProblemMistakeContext(problem),
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e8e8e8] bg-[#fafafa] p-5 sm:p-6">
        <div className="whitespace-pre-wrap text-base font-medium leading-relaxed text-[#2C2F33]">
          {renderInlineMath(problem.statement)}
        </div>
      </div>

      {problem.image_url && (
        <div className="flex justify-center">
          <img
            src={problem.image_url.replace(/^@/, "")}
            alt="Ilustrație problemă"
            className="w-full max-w-full rounded-xl border border-[#e8e8e8] bg-white object-contain shadow-sm"
          />
        </div>
      )}

      {hasVideo && embedUrl && (
        <div className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-black">
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              title="Rezolvare video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {hasAnswerCard ? (
        <div className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm">
          <ProblemAnswerCard
            problem={problem}
            onCanMarkSolvedChange={() => {}}
            onSolvedCorrectly={handleMarkSolved}
            isSolved={isSolved}
            onWrongAnswer={handleWrongAnswer}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e8e8e8] bg-[#fafafa] p-5">
          <p className="text-sm text-[#666666]">
            Această problemă nu are card de răspuns configurat. Poți vizita pagina
            problemei pentru mai multe detalii.
          </p>
        </div>
      )}
    </div>
  )
}

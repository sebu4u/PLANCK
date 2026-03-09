import Link from "next/link"
import { CirclePlay, FileText, ListChecks, PenSquare } from "lucide-react"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { EmbeddedProblemContent } from "@/components/invata/embedded-problem-content"
import { EmbeddedGrilaContent } from "@/components/invata/embedded-grila-content"
import type { LearningPathLessonItem, LearningPathLessonType } from "@/lib/supabase-learning-paths"
import type { Lesson as PhysicsLesson } from "@/lib/supabase-physics"
import type { Problem } from "@/data/problems"
import type { QuizQuestion } from "@/lib/types/quiz-questions"
import { toYoutubeEmbedUrl } from "@/lib/youtube-utils"

export const ITEM_TYPE_LABEL: Record<LearningPathLessonType, string> = {
  text: "Lecție text",
  video: "Lecție video",
  grila: "Exercițiu grilă",
  problem: "Exercițiu problemă",
}

export function getItemIcon(type: LearningPathLessonType) {
  switch (type) {
    case "video":
      return CirclePlay
    case "grila":
      return ListChecks
    case "problem":
      return PenSquare
    case "text":
    default:
      return FileText
  }
}

export { toYoutubeEmbedUrl } from "@/lib/youtube-utils"

interface LearningPathItemBodyProps {
  item: LearningPathLessonItem
  sourceLesson: PhysicsLesson | null
  sourceProblem?: Problem | null
  sourceQuizQuestion?: QuizQuestion | null
}

export function LearningPathItemBody({ item, sourceLesson, sourceProblem, sourceQuizQuestion }: LearningPathItemBodyProps) {
  if (item.item_type === "text") {
    if (!sourceLesson) {
      return <p className="text-sm text-[#777777]">Lecția text nu este încă disponibilă.</p>
    }

    return (
      <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg prose-headings:break-words prose-p:break-words">
        <LessonRichContent content={sourceLesson.content} theme="light" />
      </div>
    )
  }

  if (item.item_type === "video") {
    const embedUrl = toYoutubeEmbedUrl(item.youtube_url)

    if (!embedUrl) {
      return <p className="text-sm text-[#777777]">Video-ul nu este configurat corect încă.</p>
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-black">
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title={item.title || "Lecție video"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  if (item.item_type === "grila") {
    if (!item.quiz_question_id) {
      return <p className="text-sm text-[#777777]">Exercițiul grilă nu este configurat încă.</p>
    }

    if (sourceQuizQuestion) {
      return <EmbeddedGrilaContent question={sourceQuizQuestion} />
    }

    return (
      <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-5">
        <p className="text-sm leading-6 text-[#555555]">
          Deschide exercițiul grilă pentru a continua lecția.
        </p>
        <Link
          href={`/grile?question=${item.quiz_question_id}`}
          className="mt-4 inline-flex rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Deschide grila
        </Link>
      </div>
    )
  }

  if (!item.problem_id) {
    return <p className="text-sm text-[#777777]">Problema nu este configurată încă.</p>
  }

  if (sourceProblem) {
    return <EmbeddedProblemContent problem={sourceProblem} />
  }

  return (
    <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-5">
      <p className="text-sm leading-6 text-[#555555]">
        Deschide problema asociată pentru a exersa partea aplicativă a lecției.
      </p>
      <Link
        href={`/probleme/${item.problem_id}`}
        className="mt-4 inline-flex rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Deschide problema
      </Link>
    </div>
  )
}

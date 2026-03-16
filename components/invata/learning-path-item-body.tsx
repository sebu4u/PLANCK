import Link from "next/link"
import { BarChart2, CirclePlay, FileText, ListChecks, PenSquare } from "lucide-react"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { EmbeddedProblemContent } from "@/components/invata/embedded-problem-content"
import { EmbeddedGrilaContent } from "@/components/invata/embedded-grila-content"
import { LessonPollClientWrapper } from "@/components/invata/lesson-poll-client-wrapper"
import { PollSection } from "@/components/invata/poll-section"
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
  poll: "Sondaj",
}

export function getItemIcon(type: LearningPathLessonType) {
  switch (type) {
    case "video":
      return CirclePlay
    case "grila":
      return ListChecks
    case "problem":
      return PenSquare
    case "poll":
      return BarChart2
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
  nextItemHref?: string
}

function parsePollContent(content: Record<string, unknown> | null | undefined): {
  imageSrc: string
  imageAlt: string
  question: string
  correctAnswerId: string
  options: { id: string; label: string; feedback: string }[]
} | null {
  if (!content || typeof content !== "object") return null
  const imageSrc = content.imageSrc
  const imageAlt = content.imageAlt
  const question = content.question
  const correctAnswerId = content.correctAnswerId
  const options = content.options
  if (
    typeof imageSrc !== "string" ||
    typeof imageAlt !== "string" ||
    typeof question !== "string" ||
    typeof correctAnswerId !== "string" ||
    !Array.isArray(options) ||
    options.length === 0
  ) {
    return null
  }
  const parsedOptions: { id: string; label: string; feedback: string }[] = []
  for (const opt of options) {
    if (
      opt &&
      typeof opt === "object" &&
      typeof (opt as { id?: unknown }).id === "string" &&
      typeof (opt as { label?: unknown }).label === "string" &&
      typeof (opt as { feedback?: unknown }).feedback === "string"
    ) {
      parsedOptions.push({
        id: (opt as { id: string }).id,
        label: (opt as { label: string }).label,
        feedback: (opt as { feedback: string }).feedback,
      })
    }
  }
  if (parsedOptions.length === 0) return null
  const hasCorrectId = parsedOptions.some((o) => o.id === correctAnswerId)
  if (!hasCorrectId) return null
  return { imageSrc, imageAlt, question, correctAnswerId, options: parsedOptions }
}

export function LearningPathItemBody({ item, sourceLesson, sourceProblem, sourceQuizQuestion, nextItemHref }: LearningPathItemBodyProps) {
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

  if (item.item_type === "poll") {
    const pollData = parsePollContent(item.content_json ?? null)
    if (!pollData || !nextItemHref) {
      return <p className="text-sm text-[#777777]">Sondajul nu este configurat încă.</p>
    }
    return (
      <PollSection
        question={pollData.question}
        correctAnswerId={pollData.correctAnswerId}
        options={pollData.options}
        nextItemHref={nextItemHref}
      >
        <LessonPollClientWrapper
          imageSrc={pollData.imageSrc}
          imageAlt={pollData.imageAlt}
          correctAnswerId={pollData.correctAnswerId}
          options={pollData.options}
        />
      </PollSection>
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

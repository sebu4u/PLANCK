"use client"

import React from "react"
import Link from "next/link"
import { CheckCircle2, ExternalLink, ListChecks, PenSquare, ClipboardList } from "lucide-react"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { EmbeddedProblemContent } from "@/components/invata/embedded-problem-content"
import { EmbeddedGrilaContent } from "@/components/invata/embedded-grila-content"
import { GrilaLessonProvider } from "@/components/invata/grila-lesson-context"
import { ProblemStatementSection } from "@/components/coding-problems/problem-statement-section"
import { toYoutubeEmbedUrl } from "@/lib/youtube-utils"
import type { PersonalizedCourseItemPayload } from "@/lib/personalized-courses/types"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"
import { ITEM_TYPE_LABEL } from "@/components/invata/learning-path-item-body"

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function parseBody(content: Record<string, unknown> | null | undefined): string | null {
  if (!content) return null
  return readString(content.body)
}

function parseYoutubeUrl(content: Record<string, unknown> | null | undefined): string | null {
  if (!content) return null
  return (
    readString(content.youtube_url) ??
    readString(content.youtubeUrl) ??
    readString(content.video_url) ??
    readString(content.videoUrl) ??
    readString(content.url)
  )
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

type GeneratedOption = {
  id: string
  label: string
  feedback?: string | null
}

function parseGeneratedOptions(content: Record<string, unknown>): GeneratedOption[] {
  const rawOptions = Array.isArray(content.options) ? content.options : []
  const options: GeneratedOption[] = []

  rawOptions.forEach((raw, index) => {
    const record = readRecord(raw)
    if (!record) return
    const id = readString(record.id) ?? String.fromCharCode(65 + index)
    const label = readString(record.label) ?? readString(record.text) ?? readString(record.value)
    if (!label) return
    options.push({
      id,
      label,
      feedback: readString(record.feedback),
    })
  })

  return options
}

function GeneratedChoiceCard({
  content,
  title,
  kind,
}: {
  content: Record<string, unknown>
  title: string
  kind: "grila" | "poll"
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const options = parseGeneratedOptions(content)
  const question = readString(content.question) ?? readString(content.statement) ?? title
  const correctAnswerId = readString(content.correctAnswerId) ?? readString(content.correct_answer_id)
  const selectedOption = options.find((option) => option.id === selectedId) ?? null
  const isCorrect = selectedId && correctAnswerId ? selectedId === correctAnswerId : null

  if (!options.length) {
    return <FallbackCard title={title} body={parseBody(content)} note="Itemul generat nu are opțiuni configurate." />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div className="rounded-2xl border border-[#ece6f3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b6fac]">
          <ListChecks className="h-4 w-4" />
          {kind === "poll" ? "Sondaj" : "Exercițiu grilă"}
        </div>
        <h2 className="mt-3 text-lg font-bold leading-snug text-[#111111] sm:text-xl">{question}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selectedId === option.id
            const state = !selectedId
              ? "idle"
              : correctAnswerId && option.id === correctAnswerId
                ? "correct"
                : isSelected
                  ? "selected"
                  : "muted"
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                className={`rounded-2xl border p-4 text-left text-sm font-medium transition-all ${
                  state === "correct"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                    : state === "selected"
                      ? "border-violet-400 bg-violet-50 text-[#4d2d76]"
                      : state === "muted"
                        ? "border-[#ececec] bg-[#fafafa] text-[#8a8a8a]"
                        : "border-[#ececec] bg-white text-[#2f2f2f] hover:border-violet-300 hover:bg-violet-50/60"
                }`}
              >
                <span className="block text-xs font-bold uppercase tracking-wide text-[#8b6fac]">{option.id}</span>
                <span className="mt-1 block leading-relaxed">{option.label}</span>
              </button>
            )
          })}
        </div>
        {selectedOption ? (
          <div className={`mt-4 rounded-xl border px-3.5 py-3 text-sm ${
            isCorrect === false
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {selectedOption.feedback ??
                  (kind === "poll"
                    ? "Răspuns salvat local. Continuă cursul când ești gata."
                    : isCorrect === false
                      ? "Mai încearcă să legi răspunsul de explicația din lecție."
                      : "Corect — poți continua cu următorul pas.")}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function GeneratedTestCard({ content, title }: { content: Record<string, unknown>; title: string }) {
  const rawProblems = Array.isArray(content.problems) ? content.problems : []
  const problems = rawProblems
    .map((raw, index) => {
      const record = readRecord(raw)
      if (!record) return null
      return {
        id: readString(record.id) ?? `p${index + 1}`,
        statement: readString(record.statement) ?? readString(record.question) ?? `Întrebarea ${index + 1}`,
        options: parseGeneratedOptions(record),
        correctOptionId: readString(record.correctOptionId) ?? readString(record.correctAnswerId),
      }
    })
    .filter((problem): problem is { id: string; statement: string; options: GeneratedOption[]; correctOptionId: string | null } => Boolean(problem))
  const [answers, setAnswers] = React.useState<Record<string, string>>({})

  if (!problems.length) {
    return <FallbackCard title={title} body={parseBody(content)} note="Testul generat nu are întrebări configurate." />
  }

  const answered = problems.filter((problem) => answers[problem.id]).length
  const correct = problems.filter((problem) => problem.correctOptionId && answers[problem.id] === problem.correctOptionId).length

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-2xl border border-[#ece6f3] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b6fac]">
          <ClipboardList className="h-4 w-4" />
          Test personalizat
        </div>
        <h2 className="mt-3 text-xl font-bold text-[#111111]">{title}</h2>
        {readString(content.description) ? (
          <p className="mt-2 text-sm text-[#6f657b]">{readString(content.description)}</p>
        ) : null}
        <div className="mt-5 space-y-5">
          {problems.map((problem, index) => (
            <div key={problem.id} className="rounded-2xl border border-[#f0eaf6] bg-[#fbf9fe] p-4">
              <p className="text-sm font-semibold text-[#111111]">
                {index + 1}. {problem.statement}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {problem.options.map((option) => {
                  const selected = answers[problem.id] === option.id
                  const correctOption = problem.correctOptionId === option.id
                  const answeredProblem = Boolean(answers[problem.id])
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [problem.id]: option.id }))}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        answeredProblem && correctOption
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : selected
                            ? "border-violet-300 bg-violet-50 text-[#4d2d76]"
                            : "border-[#ececec] bg-white hover:border-violet-200"
                      }`}
                    >
                      <span className="font-bold">{option.id}.</span> {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm font-medium text-[#6f4a91]">
          Progres test: {answered}/{problems.length} răspunsuri · {correct} corecte
        </div>
      </div>
    </div>
  )
}

function GeneratedRevealStepsCard({ content, title }: { content: Record<string, unknown>; title: string }) {
  const rawSteps = Array.isArray(content.steps) ? content.steps : []
  const steps = rawSteps.map((raw, index) => {
    const record = readRecord(raw)
    if (!record) {
      return {
        id: index,
        kind: "markdown",
        content: String(raw ?? ""),
        options: [] as string[],
        correctIndex: null as number | null,
      }
    }
    return {
      id: index,
      kind: readString(record.kind) ?? "markdown",
      content: readString(record.content) ?? readString(record.text) ?? "",
      options: Array.isArray(record.options) ? record.options.map(String) : [],
      correctIndex: typeof record.correctIndex === "number" ? record.correctIndex : null,
    }
  })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-2xl border border-[#ece6f3] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#111111]">{title}</h2>
        {readString(content.instructions) ? (
          <p className="mt-2 text-sm text-[#6f657b]">{readString(content.instructions)}</p>
        ) : null}
        <ol className="mt-5 space-y-4">
          {steps.map((step, index) => (
            <li key={step.id} className="rounded-2xl border border-[#f0eaf6] bg-[#fbf9fe] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8b6fac]">Pasul {index + 1}</p>
              {step.kind === "quiz" && step.options.length ? (
                <GeneratedChoiceCard
                  kind="grila"
                  title={step.content || `Verificare pas ${index + 1}`}
                  content={{
                    question: step.content,
                    correctAnswerId: String.fromCharCode(65 + (step.correctIndex ?? 0)),
                    options: step.options.map((label, optionIndex) => ({
                      id: String.fromCharCode(65 + optionIndex),
                      label,
                    })),
                  }}
                />
              ) : (
                <div className="mt-2 prose prose-sm max-w-none text-left prose-headings:text-[#111111]">
                  <LessonRichContent content={step.content || "Continuă cu pasul următor."} theme="light" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function FallbackCard({
  title,
  body,
  sourceTitle,
  sourceUrl,
  note,
}: {
  title: string
  body?: string | null
  sourceTitle?: string | null
  sourceUrl?: string | null
  note?: string
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#ece6f3] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-[#111111] sm:text-xl">{title}</h2>
        {sourceTitle ? (
          <p className="mt-1 text-sm text-[#8a7da0]">Sursă: {sourceTitle}</p>
        ) : null}
        {note ? <p className="mt-2 text-sm text-[#6f657b]">{note}</p> : null}
        {body ? (
          <div className="mt-4 prose prose-sm max-w-none text-left sm:prose-base prose-headings:break-words prose-headings:text-[#111111] prose-p:break-words">
            <LessonRichContent content={body} theme="light" emphasizedBody />
          </div>
        ) : null}
        {sourceUrl ? (
          <Link
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#5b21b6]"
          >
            <ExternalLink className="h-4 w-4" />
            Deschide resursa originală
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export function PersonalizedItemContent({ payload }: { payload: PersonalizedCourseItemPayload }) {
  const { item, sourceProblem, sourceQuizQuestion, sourceCodingProblem, sourceCodingExamples, sourceLearningPathItem } = payload
  const itemType = item.item_type as LearningPathLessonType
  const sourceContentJson = readRecord(sourceLearningPathItem?.content_json)
  const contentJson = sourceContentJson ? { ...sourceContentJson, ...item.content_json } : item.content_json
  const body = parseBody(contentJson)
  const sourceUrl = readString(contentJson.sourceUrl) ?? readString(contentJson.url)
  const sourceYoutubeUrl = readString(sourceLearningPathItem?.youtube_url)
  const typeLabel = ITEM_TYPE_LABEL[itemType] ?? "Item"

  if (itemType === "custom_text") {
    if (!body) {
      return (
        <FallbackCard
          title={item.title?.trim() || "Text personalizat"}
          note="Textul personalizat nu este configurat încă."
        />
      )
    }
    return (
      <div className="prose prose-sm mx-auto w-full max-w-2xl text-left sm:prose-base lg:prose-lg prose-headings:break-words prose-headings:text-[#111111] prose-p:break-words">
        <LessonRichContent content={body} theme="light" emphasizedBody />
      </div>
    )
  }

  if (itemType === "text") {
    const lessonContent =
      sourceLearningPathItem && typeof sourceLearningPathItem.content === "string"
        ? readString(sourceLearningPathItem.content)
        : null
    const text = body ?? lessonContent
    if (!text) {
      return (
        <FallbackCard
          title={item.title?.trim() || typeLabel}
          sourceTitle={item.source_title}
          note="Lecția text provine dintr-un traseu oficial. Continuă cu următorul pas când ești gata."
          sourceUrl={sourceUrl}
        />
      )
    }
    return (
      <div className="prose prose-sm max-w-none text-left sm:prose-base lg:prose-lg prose-headings:break-words prose-p:break-words">
        <LessonRichContent content={text} theme="light" />
      </div>
    )
  }

  if (itemType === "video") {
    const embedUrl = toYoutubeEmbedUrl(parseYoutubeUrl({ ...contentJson, url: parseYoutubeUrl(contentJson) ?? sourceYoutubeUrl }))
    if (!embedUrl) {
      return (
        <FallbackCard
          title={item.title?.trim() || "Lecție video"}
          body={body}
          sourceTitle={item.source_title}
          note="Video-ul nu este configurat corect încă."
          sourceUrl={sourceUrl}
        />
      )
    }
    return (
      <div className="space-y-4">
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
        {body ? (
          <div className="prose prose-sm max-w-none text-left sm:prose-base prose-headings:break-words prose-p:break-words">
            <LessonRichContent content={body} theme="light" />
          </div>
        ) : null}
      </div>
    )
  }

  if (itemType === "grila") {
    if (!sourceQuizQuestion) {
      return (
        <GeneratedChoiceCard
          kind="grila"
          title={item.title?.trim() || "Exercițiu grilă"}
          content={contentJson}
        />
      )
    }
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b6fac]">
          <ListChecks className="h-4 w-4" />
          {item.title?.trim() || "Exercițiu grilă"}
        </div>
        <GrilaLessonProvider question={sourceQuizQuestion}>
          <EmbeddedGrilaContent question={sourceQuizQuestion} />
        </GrilaLessonProvider>
        {body ? (
          <div className="prose prose-sm max-w-none text-left sm:prose-base prose-headings:break-words prose-p:break-words">
            <LessonRichContent content={body} theme="light" />
          </div>
        ) : null}
      </div>
    )
  }

  if (itemType === "problem" || itemType === "math_problem") {
    if (!sourceProblem) {
      return (
        <FallbackCard
          title={item.title?.trim() || "Exercițiu problemă"}
          body={body}
          sourceTitle={item.source_title}
          note="Problema nu este disponibilă momentan. Continuă cu următorul pas."
          sourceUrl={item.source_id ? `/probleme/${item.source_id}` : sourceUrl}
        />
      )
    }
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b6fac]">
          <PenSquare className="h-4 w-4" />
          {item.title?.trim() || sourceProblem.title || "Exercițiu problemă"}
        </div>
        <EmbeddedProblemContent problem={sourceProblem} />
        {body ? (
          <div className="prose prose-sm max-w-none text-left sm:prose-base prose-headings:break-words prose-p:break-words">
            <LessonRichContent content={body} theme="light" />
          </div>
        ) : null}
      </div>
    )
  }

  if (itemType === "coding_problem") {
    if (!sourceCodingProblem) {
      return (
        <FallbackCard
          title={item.title?.trim() || "Exercițiu informatică"}
          body={body}
          sourceTitle={item.source_title}
          note="Problema de informatică nu este disponibilă momentan. Continuă cu următorul pas."
          sourceUrl={item.source_id ? `/informatica/probleme/${item.source_id}` : sourceUrl}
        />
      )
    }
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8b6fac]">
          <PenSquare className="h-4 w-4" />
          {item.title?.trim() || sourceCodingProblem.title || "Exercițiu informatică"}
        </div>
        <div className="rounded-2xl border border-[#ebe4f1] bg-white px-4 py-5 shadow-[0_12px_32px_rgba(76,44,114,0.06)] sm:px-7 sm:py-7">
          <ProblemStatementSection
            problem={sourceCodingProblem}
            examples={sourceCodingExamples}
            theme="light"
          />
        </div>
        <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3.5 py-2.5 text-xs text-[#6f657b]">
          Citește enunțul și rezolvă problema în IDE-ul oficial, apoi marchează pasul ca finalizat
          pentru a-ți salva progresul în cursul personalizat.
        </p>
        {body ? (
          <div className="prose prose-sm max-w-none text-left sm:prose-base prose-headings:break-words prose-p:break-words">
            <LessonRichContent content={body} theme="light" />
          </div>
        ) : null}
      </div>
    )
  }

  if (itemType === "test") {
    return <GeneratedTestCard content={contentJson} title={item.title?.trim() || "Test"} />
  }

  if (itemType === "poll") {
    return <GeneratedChoiceCard kind="poll" content={contentJson} title={item.title?.trim() || "Sondaj"} />
  }

  if (itemType === "reveal_steps") {
    return <GeneratedRevealStepsCard content={contentJson} title={item.title?.trim() || "Pași ghidați"} />
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <FallbackCard
        title={item.title?.trim() || typeLabel}
        body={body}
        sourceTitle={item.source_title}
        note="Acest item folosește un format interactiv. Continuă cu pasul următor când ești gata."
        sourceUrl={sourceUrl}
      />
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CirclePlay,
  FileText,
  ListChecks,
  PenSquare,
  Play,
  X,
} from "lucide-react"
import type {
  LearningPathChapter,
  LearningPathLesson,
  LearningPathLessonType,
} from "@/lib/supabase-learning-paths"

interface ChapterPageClientProps {
  chapter: LearningPathChapter
  lessons: LearningPathLesson[]
}

const LESSON_TYPE_LABEL: Record<LearningPathLessonType, string> = {
  text: "Lecție text",
  video: "Lecție video",
  grila: "Exercițiu grilă",
  problem: "Exercițiu problemă",
}

function getLessonIcon(type: LearningPathLessonType) {
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

function toYoutubeEmbedUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)
    const host = url.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim()
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v")
      if (id) return `https://www.youtube.com/embed/${id}`

      const pathParts = url.pathname.split("/").filter(Boolean)
      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`
      }
      if (pathParts[0] === "shorts" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`
      }
    }
  } catch {
    return null
  }

  return null
}

function hasStartTarget(lesson: LearningPathLesson | undefined): boolean {
  if (!lesson) return false

  switch (lesson.lesson_type) {
    case "text":
      return Boolean(lesson.cursuri_lesson_slug)
    case "video":
      return Boolean(toYoutubeEmbedUrl(lesson.youtube_url))
    case "grila":
      return Boolean(lesson.quiz_question_id)
    case "problem":
      return Boolean(lesson.problem_id)
    default:
      return false
  }
}

export function ChapterPageClient({ chapter, lessons }: ChapterPageClientProps) {
  const router = useRouter()
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessons[0]?.id ?? null)
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedLessonId && lessons[0]) {
      setSelectedLessonId(lessons[0].id)
      return
    }

    if (selectedLessonId && !lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(lessons[0]?.id ?? null)
    }
  }, [lessons, selectedLessonId])

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  )

  const onStartSelectedLesson = () => {
    if (!selectedLesson) return

    switch (selectedLesson.lesson_type) {
      case "text":
        if (selectedLesson.cursuri_lesson_slug) {
          router.push(`/cursuri/${selectedLesson.cursuri_lesson_slug}`)
        }
        break
      case "video": {
        const embedUrl = toYoutubeEmbedUrl(selectedLesson.youtube_url)
        if (embedUrl) setVideoEmbedUrl(embedUrl)
        break
      }
      case "grila":
        if (selectedLesson.quiz_question_id) {
          router.push(`/grile?question=${selectedLesson.quiz_question_id}`)
        }
        break
      case "problem":
        if (selectedLesson.problem_id) {
          router.push(`/probleme/${selectedLesson.problem_id}`)
        }
        break
      default:
        break
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a7a]">Learning Path</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">{chapter.title}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-3xl border border-[#e7e7e7] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {chapter.icon_url ? (
              <img
                src={chapter.icon_url}
                alt={chapter.title}
                className="h-20 w-20 rounded-2xl object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f1f1f1] text-[#5f5f5f]">
                <BookOpen className="h-11 w-11" />
              </div>
            )}

            <h2 className="mt-4 text-2xl font-semibold text-[#141414]">{chapter.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#656565]">
              {chapter.description || "Descrierea capitolului va fi adăugată din baza de date."}
            </p>

            <div className="mt-6 rounded-2xl bg-[#f6f7fb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c7f90]">Conținut capitol</p>
              <p className="mt-1 text-sm text-[#2c2f3f]">
                {lessons.length} {lessons.length === 1 ? "element" : "elemente"} disponibile
              </p>
            </div>
          </aside>

          <section className="rounded-3xl border border-[#e7e7e7] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
            {lessons.length ? (
              <>
                <div className="space-y-4">
                  {lessons.map((lesson, index) => {
                    const isSelected = lesson.id === selectedLessonId
                    const LessonIcon = getLessonIcon(lesson.lesson_type)

                    return (
                      <div key={lesson.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className="group flex w-full items-center gap-4 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-[#f7f8ff]"
                        >
                          <span
                            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              isSelected
                                ? "border-[#4a67e8] bg-[#4a67e8] text-white shadow-[0_0_0_6px_rgba(74,103,232,0.15)]"
                                : "border-[#d7d9e2] bg-[#f4f5f9] text-[#7b7f90] group-hover:border-[#8ea0f2]"
                            }`}
                          >
                            <LessonIcon className="h-5 w-5" />
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#1b1d27] sm:text-base">
                              {lesson.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#7c8090]">
                              {LESSON_TYPE_LABEL[lesson.lesson_type]}
                            </span>
                          </span>
                        </button>

                        {index < lessons.length - 1 ? (
                          <span className="pointer-events-none absolute left-[25px] top-[56px] h-5 w-[2px] bg-[#e2e4ec]" />
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-7 rounded-2xl border border-[#d9def5] bg-[#f3f6ff] p-4 sm:p-5">
                  <p className="text-sm font-semibold text-[#1d2340]">
                    {selectedLesson?.title || "Selectează un element"}
                  </p>
                  <p className="mt-1 text-xs text-[#5f6791]">
                    {selectedLesson ? LESSON_TYPE_LABEL[selectedLesson.lesson_type] : "Alege o lecție din listă"}
                  </p>

                  <button
                    type="button"
                    onClick={onStartSelectedLesson}
                    disabled={!hasStartTarget(selectedLesson)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4a67e8] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#a8b4ec]"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#676c7c]">Acest capitol nu are încă lecții configurate.</p>
            )}
          </section>
        </div>
      </div>

      {videoEmbedUrl ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 px-4 py-3 text-white">
              <p className="text-sm font-medium">{selectedLesson?.title || "Lecție video"}</p>
              <button
                type="button"
                onClick={() => setVideoEmbedUrl(null)}
                className="rounded-full p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Închide player video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={videoEmbedUrl}
                title={selectedLesson?.title || "Lecție video"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

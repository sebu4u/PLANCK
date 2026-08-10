"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, MessageCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import type {
  PracticeTestItemResult,
  PracticeTestListItem,
  PracticeTestPublicItem,
} from "@/lib/practice-tests"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

const InsightChatSidebar = dynamic(
  () => import("@/components/insight-chat-sidebar").then((m) => m.default),
  { ssr: false },
)

interface TesteReviewClientProps {
  testId: string
  attemptId: string
}

export function TesteReviewClient({ testId, attemptId }: TesteReviewClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<PracticeTestListItem | null>(null)
  const [items, setItems] = useState<PracticeTestPublicItem[]>([])
  const [results, setResults] = useState<PracticeTestItemResult[]>([])
  const [scoreCorrect, setScoreCorrect] = useState(0)
  const [scoreTotal, setScoreTotal] = useState(0)
  const [exceededTime, setExceededTime] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insightOpen, setInsightOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) {
          router.push(`/login?next=/teste/${encodeURIComponent(testId)}/attempt/${attemptId}/review`)
          return
        }
        const res = await fetch(`/api/teste/attempts/${encodeURIComponent(attemptId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Nu am putut încărca review-ul.")
        if (!data.attempt?.submitted_at) {
          router.replace(`/teste/${encodeURIComponent(testId)}/attempt/${encodeURIComponent(attemptId)}`)
          return
        }
        if (!cancelled) {
          setTest(data.test)
          setItems(data.items ?? [])
          setResults(Array.isArray(data.attempt.results) ? data.attempt.results : [])
          setScoreCorrect(data.attempt.score_correct ?? 0)
          setScoreTotal(data.attempt.score_total ?? 0)
          setExceededTime(Boolean(data.attempt.exceeded_time))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Eroare la încărcare.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [attemptId, router, testId])

  const resultsById = useMemo(() => {
    const map = new Map<string, PracticeTestItemResult>()
    for (const r of results) map.set(r.itemId, r)
    return map
  }, [results])

  const activeItem = items.find((i) => i.id === activeItemId) ?? null

  const insightProblemId = activeItem
    ? activeItem.type === "catalog" && activeItem.problemId
      ? activeItem.problemId
      : `practice-test:${attemptId}:${activeItem.id}`
    : ""

  const openInsight = (itemId: string) => {
    setActiveItemId(itemId)
    setInsightOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[#2c2f33]/60">
        <Loader2 className="h-5 w-5 animate-spin" />
        Se încarcă rezultatele…
      </div>
    )
  }

  if (error && !test) {
    return (
      <div className={cn("mx-auto max-w-3xl px-4 py-10", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-red-700">{error}</div>
      </div>
    )
  }

  if (!test) return null

  const percent = scoreTotal > 0 ? Math.round((scoreCorrect / scoreTotal) * 100) : 0

  return (
    <div className={cn("mx-auto max-w-3xl px-4 py-8 burger:px-6", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_8px_30px_-18px_rgba(11,12,15,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#2c2f33]/50">Rezultat</p>
        <h1 className="mt-1 text-2xl font-bold text-[#0b0c0f]">{test.title}</h1>
        <p className="mt-4 text-4xl font-bold text-[#0b0c0f]">
          {scoreCorrect}/{scoreTotal}
          <span className="ml-2 text-lg font-medium text-[#2c2f33]/55">({percent}%)</span>
        </p>
        {exceededTime ? (
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            Finalizat cu timp depășit
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/teste/${encodeURIComponent(testId)}`}>Reia testul</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teste">Toate testele</Link>
          </Button>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {items.map((item, index) => {
          const result = resultsById.get(item.id)
          const correct = result?.correct
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_6px_24px_-18px_rgba(11,12,15,0.3)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {correct ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#2c2f33]/45">
                      Problema {index + 1}
                    </p>
                    {item.title ? (
                      <h2 className="mt-0.5 font-semibold text-[#0b0c0f]">{item.title}</h2>
                    ) : null}
                    <div className="mt-2 text-sm leading-relaxed text-[#2c2f33]/85">
                      <LatexRichText
                        content={item.statement}
                        className="break-words [&_.katex]:text-[#2c2f33]/85"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 rounded-xl bg-[#f5f4f2] px-3 py-3 text-sm">
                <p>
                  <span className="font-medium text-[#0b0c0f]">Răspunsul tău: </span>
                  <AnswerText text={formatUserAnswer(result, item)} />
                </p>
                <p>
                  <span className="font-medium text-[#0b0c0f]">Răspuns corect: </span>
                  <AnswerText text={formatCorrectAnswer(result, item)} />
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => openInsight(item.id)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Rezolvă cu Insight
              </Button>
            </li>
          )
        })}
      </ul>

      {activeItem && insightProblemId ? (
        <InsightChatSidebar
          isOpen={insightOpen}
          onClose={() => setInsightOpen(false)}
          problemId={insightProblemId}
          problemStatement={activeItem.statement}
          problemImageUrl={activeItem.imageUrl}
          persona="problem_tutor"
          problemLightTheme
          lightChromeWhenSlideOver
          showCloseWhenDesktopEmbedded
          problemSubject={
            activeItem.catalogSubject === "matematica"
              ? "math"
              : test.subject === "matematica"
                ? "math"
                : "physics"
          }
          enableInteractiveTutor={test.subject === "fizica" || test.subject === "matematica"}
        />
      ) : null}
    </div>
  )
}

function AnswerText({ text }: { text: string }) {
  if (!text || text === "—") {
    return <span className="text-[#2c2f33]/75">—</span>
  }
  return (
    <LatexRichText
      content={text}
      className="inline text-[#2c2f33]/75 break-words [&_.katex]:text-[#2c2f33]/75"
    />
  )
}

function formatUserAnswer(
  result: PracticeTestItemResult | undefined,
  item: PracticeTestPublicItem,
): string {
  const answer = result?.userAnswer
  if (!answer) return "—"
  if (answer.type === "grila") {
    const label = item.options?.find((o) => o.id === answer.optionId)?.label
    return label || answer.optionId
  }
  return answer.values.join(", ")
}

function formatCorrectAnswer(
  result: PracticeTestItemResult | undefined,
  item: PracticeTestPublicItem,
): string {
  const correct = result?.correctAnswer
  if (!correct || correct.type === "unknown") return "—"
  if (correct.type === "grila") {
    return correct.label || item.options?.find((o) => o.id === correct.optionId)?.label || correct.optionId
  }
  return correct.values.join(", ")
}

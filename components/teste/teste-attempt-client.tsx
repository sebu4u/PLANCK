"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { TesteTimer } from "@/components/teste/teste-timer"
import type {
  PracticeTestAnswersMap,
  PracticeTestListItem,
  PracticeTestPublicItem,
} from "@/lib/practice-tests"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

interface TesteAttemptClientProps {
  testId: string
  attemptId: string
}

export function TesteAttemptClient({ testId, attemptId }: TesteAttemptClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<PracticeTestListItem | null>(null)
  const [items, setItems] = useState<PracticeTestPublicItem[]>([])
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [answers, setAnswers] = useState<PracticeTestAnswersMap>({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [valueInputs, setValueInputs] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) {
          router.push(`/login?next=/teste/${encodeURIComponent(testId)}/attempt/${attemptId}`)
          return
        }
        const res = await fetch(`/api/teste/attempts/${encodeURIComponent(attemptId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Nu am putut încărca attempt-ul.")
        if (data.attempt?.submitted_at) {
          router.replace(
            `/teste/${encodeURIComponent(testId)}/attempt/${encodeURIComponent(attemptId)}/review`,
          )
          return
        }
        if (!cancelled) {
          setTest(data.test)
          setItems(data.items ?? [])
          setStartedAt(data.attempt.started_at)
          setAnswers(data.attempt.answers ?? {})
          const initialValues: Record<string, string[]> = {}
          for (const item of data.items ?? []) {
            if (item.answerType === "value") {
              const existing = data.attempt.answers?.[item.id]
              const count = item.valueSubpoints?.length ?? 1
              if (existing?.type === "value") {
                initialValues[item.id] = existing.values.map((v: number) => String(v))
              } else {
                initialValues[item.id] = Array.from({ length: count }, () => "")
              }
            }
          }
          setValueInputs(initialValues)
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

  const current = items[index] ?? null
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const selectGrila = (itemId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [itemId]: { type: "grila", optionId } }))
  }

  const commitValueAnswer = (itemId: string, rawValues: string[]) => {
    const values = rawValues.map((v) => Number(v.replace(",", ".")))
    if (values.some((v) => !Number.isFinite(v))) {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
      return
    }
    setAnswers((prev) => ({ ...prev, [itemId]: { type: "value", values } }))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        router.push(`/login?next=/teste/${encodeURIComponent(testId)}`)
        return
      }
      const res = await fetch(`/api/teste/attempts/${encodeURIComponent(attemptId)}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Nu am putut trimite testul.")
      router.push(
        `/teste/${encodeURIComponent(testId)}/attempt/${encodeURIComponent(attemptId)}/review`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la trimitere.")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[#2c2f33]/60">
        <Loader2 className="h-5 w-5 animate-spin" />
        Se încarcă testul…
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

  if (!test || !startedAt || !current) return null

  const currentAnswer = answers[current.id]
  const selectedOptionId =
    currentAnswer?.type === "grila" ? currentAnswer.optionId : null

  return (
    <div className={cn("mx-auto max-w-3xl px-4 py-6 burger:px-6", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#2c2f33]/50">În curs</p>
          <h1 className="text-xl font-bold text-[#0b0c0f]">{test.title}</h1>
          <p className="mt-1 text-sm text-[#2c2f33]/60">
            Problema {index + 1} / {items.length} · Răspunsuri: {answeredCount}/{items.length}
          </p>
        </div>
        <TesteTimer startedAt={startedAt} timeLimitSeconds={test.time_limit_seconds} />
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_30px_-18px_rgba(11,12,15,0.35)] sm:p-6">
        {current.title ? <h2 className="mb-3 text-lg font-semibold text-[#0b0c0f]">{current.title}</h2> : null}
        <LatexRichText
          content={current.statement}
          className="text-[15px] leading-relaxed text-[#1a1c1f] [&_.katex]:text-[#1a1c1f]"
        />
        {current.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.imageUrl}
            alt=""
            className="mt-4 max-h-80 w-full rounded-xl object-contain bg-[#fafafa]"
          />
        ) : null}

        {current.answerType === "grila" && current.options ? (
          <div className="mt-6 space-y-2">
            {current.options.map((opt) => {
              const selected = selectedOptionId === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectGrila(current.id, opt.id)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                    selected
                      ? "border-[#0b0c0f] bg-[#0b0c0f] text-white"
                      : "border-black/10 bg-[#fafafa] text-[#0b0c0f] hover:border-black/25",
                  )}
                >
                  <LatexRichText
                    content={opt.label}
                    className={cn(
                      "break-words",
                      selected ? "[&_.katex]:text-white" : "[&_.katex]:text-[#0b0c0f]",
                    )}
                  />
                </button>
              )
            })}
          </div>
        ) : null}

        {current.answerType === "value" && current.valueSubpoints ? (
          <div className="mt-6 space-y-3">
            {current.valueSubpoints.map((sp, spIndex) => (
              <label key={`${current.id}-${spIndex}`} className="block text-sm">
                <span className="mb-1.5 block text-[#2c2f33]/70">
                  <LatexRichText content={sp.label || `Valoare ${spIndex + 1}`} />
                  {sp.text_before ? (
                    <>
                      {" — "}
                      <LatexRichText content={sp.text_before} />
                    </>
                  ) : null}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2.5 text-[#0b0c0f]"
                    value={valueInputs[current.id]?.[spIndex] ?? ""}
                    onChange={(e) => {
                      const next = [...(valueInputs[current.id] ?? [])]
                      next[spIndex] = e.target.value
                      setValueInputs((prev) => ({ ...prev, [current.id]: next }))
                      commitValueAnswer(current.id, next)
                    }}
                    placeholder="Răspuns numeric"
                  />
                  {sp.text_after ? (
                    <LatexRichText content={sp.text_after} className="text-[#2c2f33]/60" />
                  ) : null}
                </div>
              </label>
            ))}
          </div>
        ) : null}

        {current.answerType === "unknown" ? (
          <p className="mt-6 text-sm text-amber-700">
            Această problemă nu poate fi notată automat. Poți trece mai departe și o vei putea
            discuta cu Insight la review.
          </p>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Înapoi
          </Button>
          <Button
            variant="outline"
            disabled={index >= items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          >
            Înainte
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => void submit()} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se trimite…
            </>
          ) : (
            "Finalizează testul"
          )}
        </Button>
      </div>
    </div>
  )
}

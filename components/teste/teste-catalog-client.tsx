"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock3, Filter, Loader2 } from "lucide-react"
import { PRACTICE_SUBJECTS, type PracticeSubjectId } from "@/lib/practice-subject"
import {
  formatPracticeTestDuration,
  PRACTICE_TEST_DIFFICULTIES,
  type PracticeTestListItem,
} from "@/lib/practice-tests"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"

const CLASSES = [9, 10, 11, 12] as const

function subjectLabel(id: PracticeSubjectId): string {
  return PRACTICE_SUBJECTS.find((s) => s.id === id)?.label ?? id
}

function difficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case "Ușor":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "Mediu":
      return "border-amber-200 bg-amber-50 text-amber-800"
    case "Avansat":
      return "border-rose-200 bg-rose-50 text-rose-700"
    default:
      return "border-black/10 bg-[#f5f4f2] text-[#2c2f33]"
  }
}

function subjectBadgeClass(subject: PracticeSubjectId): string {
  switch (subject) {
    case "fizica":
      return "border-sky-200 bg-sky-50 text-sky-800"
    case "matematica":
      return "border-violet-200 bg-violet-50 text-violet-800"
    case "informatica":
      return "border-teal-200 bg-teal-50 text-teal-800"
    default:
      return "border-black/10 bg-[#f5f4f2] text-[#2c2f33]"
  }
}

function classBadgeClass(classNum: number): string {
  switch (classNum) {
    case 9:
      return "border-blue-200 bg-blue-50 text-blue-800"
    case 10:
      return "border-indigo-200 bg-indigo-50 text-indigo-800"
    case 11:
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800"
    case 12:
      return "border-orange-200 bg-orange-50 text-orange-800"
    default:
      return "border-black/10 bg-[#f5f4f2] text-[#2c2f33]"
  }
}

export function TesteCatalogClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tests, setTests] = useState<PracticeTestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const subject = (searchParams.get("subject") as PracticeSubjectId | null) || ""
  const classFilter = searchParams.get("class") || ""
  const chapter = searchParams.get("chapter") || ""
  const difficulty = searchParams.get("difficulty") || ""

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === "toate") params.delete(key)
      else params.set(key, value)
      const qs = params.toString()
      router.replace(qs ? `/teste?${qs}` : "/teste", { scroll: false })
    },
    [router, searchParams],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (subject) params.set("subject", subject)
        if (classFilter) params.set("class", classFilter)
        if (chapter) params.set("chapter", chapter)
        if (difficulty) params.set("difficulty", difficulty)
        const qs = params.toString()
        const res = await fetch(`/api/teste${qs ? `?${qs}` : ""}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Nu am putut încărca testele.")
        if (!cancelled) setTests(data.tests ?? [])
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
  }, [subject, classFilter, chapter, difficulty])

  const chapters = useMemo(() => {
    const set = new Set<string>()
    for (const t of tests) {
      if (t.chapter.trim()) set.add(t.chapter.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ro"))
  }, [tests])

  return (
    <div className={cn("mx-auto max-w-5xl px-4 py-8 burger:px-6", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
      <div className="mb-8">
        <Link
          href="/exerseaza"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2c2f33]/70 transition-colors hover:text-[#0b0c0f]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Înapoi la Exersează
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[#0b0c0f]">Teste</h1>
        <p className="mt-2 max-w-2xl text-[#2c2f33]/75">
          Teste cronometrate pe clasă, materie, capitol și dificultate. La final poți vedea scorul și
          rezolva cu Insight.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-3">
        <span className="inline-flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-[#2c2f33]/50">
          <Filter className="h-3.5 w-3.5" />
          Filtre
        </span>
        <select
          className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2 text-sm"
          value={subject || "toate"}
          onChange={(e) => setFilter("subject", e.target.value === "toate" ? "" : e.target.value)}
        >
          <option value="toate">Toate materiile</option>
          {PRACTICE_SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2 text-sm"
          value={classFilter || "toate"}
          onChange={(e) => setFilter("class", e.target.value === "toate" ? "" : e.target.value)}
        >
          <option value="toate">Toate clasele</option>
          {CLASSES.map((c) => (
            <option key={c} value={String(c)}>
              Clasa a {c}-a
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2 text-sm"
          value={difficulty || "toate"}
          onChange={(e) => setFilter("difficulty", e.target.value === "toate" ? "" : e.target.value)}
        >
          <option value="toate">Toate dificultățile</option>
          {PRACTICE_TEST_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {chapters.length > 0 && (
          <select
            className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2 text-sm"
            value={chapter || "toate"}
            onChange={(e) => setFilter("chapter", e.target.value === "toate" ? "" : e.target.value)}
          >
            <option value="toate">Toate capitolele</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-[#2c2f33]/60">
          <Loader2 className="h-5 w-5 animate-spin" />
          Se încarcă testele…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-red-700">{error}</div>
      ) : tests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-16 text-center text-[#2c2f33]/60">
          Nu există teste pentru filtrele selectate.
        </div>
      ) : (
        <ul className="flex w-full flex-col gap-2.5">
          {tests.map((test) => (
            <li key={test.id} className="w-full">
              <Link
                href={`/teste/${test.id}`}
                className="flex w-full items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 shadow-[0_4px_18px_-14px_rgba(11,12,15,0.35)] transition hover:border-black/10 hover:bg-[#fcfcfb]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[15px] font-semibold text-[#0b0c0f]">{test.title}</h2>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                        difficultyBadgeClass(test.difficulty),
                      )}
                    >
                      {test.difficulty}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                        subjectBadgeClass(test.subject),
                      )}
                    >
                      {subjectLabel(test.subject)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                        classBadgeClass(test.class),
                      )}
                    >
                      Clasa a {test.class}-a
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#2c2f33]/60">
                    {test.chapter ? <span className="truncate">{test.chapter}</span> : null}
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatPracticeTestDuration(test.time_limit_seconds)}
                    </span>
                    <span>
                      {test.problem_count} {test.problem_count === 1 ? "problemă" : "probleme"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

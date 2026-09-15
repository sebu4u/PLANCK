"use client"

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { PracticeSubjectId } from "@/lib/practice-subject"
import { PRESS_SHRINK_CLASS } from "@/lib/press-shrink"
import { cn } from "@/lib/utils"
import "katex/dist/katex.min.css"

const LazyInlineMath = lazy(() => import("react-katex").then((module) => ({ default: module.InlineMath })))

const RECOMMENDED_COUNT = 3
const CANDIDATE_LIMIT = 40
const PHYSICS_FEATURED_IDS = ["M008", "T001", "M033", "T004", "M025", "T014", "M071", "T034"]

const DIFFICULTY_TONE: Record<string, string> = {
  "Inițiere": "border-sky-200 bg-sky-50 text-sky-700",
  "Ușor": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Mediu: "border-amber-200 bg-amber-50 text-amber-700",
  Avansat: "border-rose-200 bg-rose-50 text-rose-700",
  Concurs: "border-indigo-200 bg-indigo-50 text-indigo-700",
}

type RecommendedProblem = {
  id: string
  title: string
  href: string
  difficulty: string | null
  meta: string | null
}

type ProblemRow = {
  id: string
  title: string
  difficulty?: string | null
  category?: string | null
  chapter?: string | null
  slug?: string | null
}

function toRecommended(
  subject: PracticeSubjectId,
  row: ProblemRow,
): RecommendedProblem | null {
  if (subject === "informatica") {
    const slug = row.slug?.trim()
    if (!slug) return null
    return {
      id: row.id,
      title: row.title,
      href: `/informatica/probleme/${encodeURIComponent(slug)}`,
      difficulty: row.difficulty ?? null,
      meta: row.chapter ?? null,
    }
  }

  if (subject === "matematica") {
    return {
      id: row.id,
      title: row.title,
      href: `/matematica/probleme/${encodeURIComponent(row.id)}`,
      difficulty: row.difficulty ?? null,
      meta: row.chapter ?? null,
    }
  }

  return {
    id: row.id,
    title: row.title,
    href: `/probleme/${encodeURIComponent(row.id)}`,
    difficulty: row.difficulty ?? null,
    meta: row.category ?? null,
  }
}

function pickUnsolved(
  rows: ProblemRow[],
  solvedIds: Set<string>,
  subject: PracticeSubjectId,
  seen: Set<string>,
): RecommendedProblem[] {
  const picked: RecommendedProblem[] = []
  for (const row of rows) {
    if (picked.length >= RECOMMENDED_COUNT) break
    if (solvedIds.has(row.id) || seen.has(row.id)) continue
    const mapped = toRecommended(subject, row)
    if (!mapped) continue
    seen.add(row.id)
    picked.push(mapped)
  }
  return picked
}

async function fetchSolvedIds(
  supabase: ReturnType<typeof createClient>,
  subject: PracticeSubjectId,
  userId: string | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set()

  if (subject === "fizica") {
    const { data } = await supabase
      .from("solved_problems")
      .select("problem_id")
      .eq("user_id", userId)
    return new Set((data ?? []).map((row) => String(row.problem_id)))
  }

  if (subject === "informatica") {
    const { data } = await supabase
      .from("coding_submissions")
      .select("problem_id")
      .eq("user_id", userId)
      .eq("status", "accepted")
    return new Set((data ?? []).map((row) => String(row.problem_id)))
  }

  return new Set()
}

async function fetchRecommendedProblems(
  subject: PracticeSubjectId,
  userId: string | undefined,
): Promise<RecommendedProblem[]> {
  const supabase = createClient()
  const solvedIds = await fetchSolvedIds(supabase, subject, userId)
  const seen = new Set<string>()

  if (subject === "fizica") {
    const [{ data: featured }, { data: recent }] = await Promise.all([
      supabase
        .from("problems")
        .select("id, title, difficulty, category")
        .in("id", PHYSICS_FEATURED_IDS),
      supabase
        .from("problems")
        .select("id, title, difficulty, category")
        .order("created_at", { ascending: false })
        .limit(CANDIDATE_LIMIT),
    ])

    const featuredMap = new Map((featured ?? []).map((row) => [row.id, row as ProblemRow]))
    const featuredOrdered: ProblemRow[] = []
    for (const id of PHYSICS_FEATURED_IDS) {
      const row = featuredMap.get(id)
      if (row) featuredOrdered.push(row)
    }

    const fromFeatured = pickUnsolved(featuredOrdered, solvedIds, subject, seen)
    if (fromFeatured.length >= RECOMMENDED_COUNT) return fromFeatured

    const fromRecent = pickUnsolved((recent ?? []) as ProblemRow[], solvedIds, subject, seen)
    return [...fromFeatured, ...fromRecent].slice(0, RECOMMENDED_COUNT)
  }

  if (subject === "matematica") {
    const { data } = await supabase
      .from("math_problems")
      .select("id, title, difficulty, chapter")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(CANDIDATE_LIMIT)

    return pickUnsolved((data ?? []) as ProblemRow[], solvedIds, subject, seen)
  }

  const { data } = await supabase
    .from("coding_problems")
    .select("id, slug, title, difficulty, chapter")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(CANDIDATE_LIMIT)

  return pickUnsolved((data ?? []) as ProblemRow[], solvedIds, subject, seen)
}

function MathTitle({ content }: { content: string }) {
  if (!content.includes("$")) return <>{content}</>

  return (
    <Suspense fallback={<>{content.replace(/\$/g, "")}</>}>
      {content.split(/(\$[^$]+\$)/g).map((part, idx) =>
        part.startsWith("$") && part.endsWith("$") ? (
          <LazyInlineMath key={idx} math={part.slice(1, -1)} />
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </Suspense>
  )
}

function RecommendedCard({ problem }: { problem: RecommendedProblem }) {
  return (
    <Link
      href={problem.href}
      className={cn(PRESS_SHRINK_CLASS, "flex h-full min-h-[8.75rem] flex-col justify-between rounded-2xl border-2 border-[#e5e5e5] bg-white px-4 py-4")}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/55">
          Recomandat
        </p>
        <h2 className="mt-1.5 line-clamp-2 text-lg font-bold leading-snug text-[#0b0c0f]">
          <MathTitle content={problem.title} />
        </h2>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {problem.difficulty ? (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                DIFFICULTY_TONE[problem.difficulty] ??
                  "border-[#0b0c0f]/10 bg-[#f5f4f2] text-[#2c2f33]/70",
              )}
            >
              {problem.difficulty}
            </span>
          ) : null}
          {problem.meta ? (
            <span className="max-w-[9.5rem] truncate rounded-full border border-[#0b0c0f]/10 bg-[#f5f4f2] px-2 py-0.5 text-[11px] font-medium text-[#2c2f33]/70">
              {problem.meta}
            </span>
          ) : null}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#c4c7cc]" aria-hidden />
      </div>
    </Link>
  )
}

function RecommendedSkeleton() {
  return (
    <div
      className="min-h-[8.75rem] animate-pulse rounded-2xl border-2 border-[#e5e5e5] bg-white px-4 py-4"
      aria-hidden
    >
      <div className="h-2.5 w-20 rounded-full bg-[#ecebe8]" />
      <div className="mt-3 h-5 w-4/5 rounded-md bg-[#ecebe8]" />
      <div className="mt-2 h-5 w-2/5 rounded-md bg-[#ecebe8]" />
      <div className="mt-6 h-5 w-24 rounded-full bg-[#ecebe8]" />
    </div>
  )
}

export function ExerseazaRecommendedProblems({
  subject,
}: {
  subject: PracticeSubjectId
}) {
  const { user, loading: authLoading } = useAuth()
  const [problems, setProblems] = useState<RecommendedProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    setLoading(true)
    setActiveIndex(0)
    scrollerRef.current?.scrollTo({ left: 0 })

    void (async () => {
      try {
        const next = await fetchRecommendedProblems(subject, user?.id)
        if (!cancelled) setProblems(next)
      } catch {
        if (!cancelled) setProblems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, subject, user?.id])

  const updateActiveIndex = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const firstSlide = scroller.firstElementChild as HTMLElement | null
    if (!firstSlide) return
    const gap = Number.parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap) || 12
    const stride = firstSlide.offsetWidth + gap
    if (stride <= 0) return
    const index = Math.round(scroller.scrollLeft / stride)
    setActiveIndex(Math.max(0, Math.min(index, problems.length - 1)))
  }, [problems.length])

  const scrollToIndex = (index: number) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const slide = scroller.children[index] as HTMLElement | undefined
    if (!slide) return
    const left = slide.offsetLeft - (scroller.clientWidth - slide.offsetWidth) / 2
    scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" })
  }

  if (!loading && problems.length === 0) return null

  const slides = loading ? [0] : problems

  return (
    <section aria-label="Probleme recomandate" className="space-y-3">
      <div
        ref={scrollerRef}
        onScroll={loading ? undefined : updateActiveIndex}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading ? (
          <div className="w-[88%] shrink-0 snap-center">
            <RecommendedSkeleton />
          </div>
        ) : (
          problems.map((problem) => (
            <div key={problem.id} className="w-[88%] shrink-0 snap-center">
              <RecommendedCard problem={problem} />
            </div>
          ))
        )}
      </div>
      {!loading && problems.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Slide probleme recomandate">
          {slides.map((problem, index) => (
            <button
              key={typeof problem === "number" ? problem : problem.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Problema ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 min-h-0 min-w-0 rounded-full p-0 transition-all",
                index === activeIndex ? "w-4 bg-[#2c2f33]" : "w-1.5 bg-[#d4d2ce]",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

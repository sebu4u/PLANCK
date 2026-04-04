import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Problem } from "@/data/problems"
import "katex/dist/katex.min.css"
import React, { useEffect, useState, lazy, Suspense, useTransition } from "react"
import { useAnalytics } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  Check,
  Loader2,
  Atom,
  BookOpen,
  CircleDot,
  FlaskConical,
  Gauge,
  Lock,
  Orbit,
  Ruler,
  Target,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react"

const LazyInlineMath = lazy(() => import("react-katex").then((module) => ({ default: module.InlineMath })))

interface ProblemCardProps {
  problem: Problem
  solved?: boolean
  isLocked?: boolean
  /** Classroom assignment picker: no navigation; card toggles selection. */
  picker?: {
    selected: boolean
    onToggle: () => void
  }
}

const problemIcons: LucideIcon[] = [BookOpen, Atom, Orbit, Zap, Target, Ruler, Waves, FlaskConical, CircleDot, Gauge]

const getProblemIcon = (problemId: string): LucideIcon => {
  let hash = 0
  for (let i = 0; i < problemId.length; i++) {
    hash = (hash << 5) - hash + problemId.charCodeAt(i)
    hash |= 0
  }
  return problemIcons[Math.abs(hash) % problemIcons.length]
}

const difficultyToneClasses: Record<string, string> = {
  "Ușor": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Mediu": "border-amber-200 bg-amber-50 text-amber-700",
  "Avansat": "border-rose-200 bg-rose-50 text-rose-700",
}

const getProblemSolvePercentage = (problemId: string, difficulty: string): number => {
  let hash = 0
  for (let i = 0; i < problemId.length; i++) {
    hash = (hash << 5) - hash + problemId.charCodeAt(i)
    hash |= 0
  }
  const unsignedHash = hash >>> 0
  const maxHash = 0xffffffff
  const t = unsignedHash / maxHash

  let min = 3
  let max = 92

  if (difficulty === "Ușor") {
    min = 61
    max = 92
  } else if (difficulty === "Mediu") {
    min = 32
    max = 75
  } else if (difficulty === "Avansat") {
    min = 3
    max = 28
  }

  const pct = min + (max - min) * t
  return Math.max(3, Math.min(92, Math.round(pct)))
}

const normalizeSolvePercentage = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return Math.max(3, Math.min(92, Math.round(value)))
}

const createStatementPreview = (statement?: string | null, limit = 15) => {
  if (!statement) return ""
  const normalized = statement.replace(/\s+/g, " ").trim()
  if (!normalized) return ""

  const parts = normalized.split(/(\$[^$]+\$)/g).filter(Boolean)
  const collected: string[] = []
  let wordCount = 0

  for (const part of parts) {
    const isMath = part.startsWith("$") && part.endsWith("$")
    if (isMath) {
      if (wordCount >= limit) break
      collected.push(part)
      wordCount += 1
      continue
    }

    const words = part.trim().split(/\s+/)
    for (const word of words) {
      if (!word) continue
      collected.push(word)
      wordCount += 1
      if (wordCount >= limit) break
    }
    if (wordCount >= limit) break
  }

  const preview = collected.join(" ")
  const totalWords = normalized.split(/\s+/).filter(Boolean).length
  return wordCount < totalWords ? `${preview}...` : preview
}

function MathContent({ content }: { content: string }) {
  const [isMathLoaded, setIsMathLoaded] = useState(false)
  const [hasMath, setHasMath] = useState(false)

  useEffect(() => {
    const containsMath = content.includes("$")
    setHasMath(containsMath)
    if (!containsMath) return

    const timer = setTimeout(() => {
      setIsMathLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [content])

  if (!hasMath) return <span>{content}</span>
  if (!isMathLoaded) return <div className="h-4 w-full animate-pulse rounded bg-gray-200" />

  return (
    <Suspense fallback={<div className="h-4 w-full animate-pulse rounded bg-gray-200" />}>
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

export function ProblemCard({ problem, solved, isLocked = false, picker }: ProblemCardProps) {
  const ProblemIcon = getProblemIcon(problem.id)
  const analytics = useAnalytics()
  const router = useRouter()
  const [isNavigating, startTransition] = useTransition()

  const primaryStatement = problem.statement?.trim() ? problem.statement : problem.title
  const statementPreview = createStatementPreview(primaryStatement, 15)
  const fallbackPreview = statementPreview || problem.title || ""
  const statementVisible = Boolean(fallbackPreview)
  const dbSolvePercentage = normalizeSolvePercentage(problem.solve_percentage)
  const displayedSolvePercentage = dbSolvePercentage ?? getProblemSolvePercentage(problem.id, problem.difficulty)

  const handleProblemClick = () => {
    analytics.trackProblemView({
      problem_id: problem.id.toString(),
      problem_difficulty: problem.difficulty,
      problem_category: problem.category,
    })
  }

  useEffect(() => {
    if (!isLocked && !picker) {
      router.prefetch(`/probleme/${problem.id}`)
    }
  }, [isLocked, picker, problem.id, router])

  const handleLockedCardClick = () => {
    router.push("/pricing")
  }

  const navigateToProblem = () => {
    startTransition(() => {
      handleProblemClick()
      router.push(`/probleme/${problem.id}`)
    })
  }

  const handleUnlockedCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest("a") || target.closest("button")) return
    navigateToProblem()
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (picker) {
      const target = e.target as HTMLElement
      if (target.closest("button")) return
      picker.onToggle()
      return
    }
    if (isLocked) {
      handleLockedCardClick()
      return
    }
    handleUnlockedCardClick(e)
  }

  return (
    <Card
      onClick={handleCardClick}
      aria-busy={isNavigating}
      className={cn(
        "group relative flex h-full w-full cursor-pointer flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)] transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[#0b0c0f]/20 hover:shadow-[0px_20px_40px_-28px_rgba(11,12,15,0.55)]",
        picker?.selected && "border-[#1a73e8] ring-2 ring-[#1a73e8]/25",
        isNavigating && "cursor-wait pointer-events-none",
      )}
    >
      {isLocked && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/75 px-4 text-center backdrop-blur-sm">
          <Lock className="h-8 w-8 text-[#0b0c0f]/70" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2c2f33]/70">Disponibila cu Plus+</p>
        </div>
      )}

      <div className={cn("flex flex-col gap-4", isLocked && "pointer-events-none select-none opacity-70")}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0b0c0f]/10 bg-[#f7f6f4]">
            <ProblemIcon className="h-5 w-5 text-[#2c2f33]" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                difficultyToneClasses[problem.difficulty] ?? "border-[#0b0c0f]/15 bg-[#f5f4f2] text-[#2c2f33]/75",
              )}
            >
              {problem.difficulty}
            </Badge>
            <span className="rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/75">
              ID {problem.id}
            </span>
            <span className="text-[11px] font-semibold text-[#2c2f33]/60">
              {displayedSolvePercentage}%
            </span>
          </div>
        </div>

        {statementVisible && (
          <div className="line-clamp-4 text-sm font-semibold leading-relaxed text-[#2c2f33]/85">
            <MathContent content={fallbackPreview} />
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2">
        {picker ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              picker.onToggle()
            }}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] sm:w-auto",
              picker.selected
                ? "border border-emerald-600/30 bg-emerald-50 text-emerald-900 shadow-none hover:translate-y-0"
                : "bg-[#2a2a2a] text-[#f5f4f2]",
            )}
          >
            {picker.selected ? (
              <>
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Selectată pentru temă
              </>
            ) : (
              <>
                Adaugă la temă
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </>
            )}
          </button>
        ) : isLocked ? (
          <span className="inline-flex w-full items-center justify-center rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-4 py-2 text-xs font-semibold text-[#2c2f33]/70 sm:w-auto">
            Blocat pentru Plus+
          </span>
        ) : (
          <Link
            href={`/probleme/${problem.id}`}
            prefetch
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
              e.preventDefault()
              navigateToProblem()
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] sm:w-auto"
          >
            Încearcă problema
            {isNavigating ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            )}
          </Link>
        )}

        {solved && <span className="ml-auto text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Rezolvata</span>}
      </div>
    </Card>
  )
}

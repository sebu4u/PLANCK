import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Problem } from "@/data/problems"
import 'katex/dist/katex.min.css';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Skeleton } from "@/components/ui/skeleton"
import { useAnalytics } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

// Lazy load KaTeX components
const LazyInlineMath = lazy(() => import('react-katex').then(module => ({ default: module.InlineMath })))

interface ProblemCardProps {
  problem: Problem
  solved?: boolean
  showSolution?: boolean
  isLocked?: boolean
}

// Array cu 10 iconițe variate pentru probleme
const problemIcons = [
  "🔬", // microscop
  "⚗️", // eprubetă
  "🧮", // calculator
  "📊", // grafic
  "🔋", // baterie
  "💡", // bec
  "🎯", // țintă
  "⚙️", // roți dințate
  "🔍", // lupă
  "📐", // riglă
]

// Funcție pentru a obține o iconiță bazată pe ID-ul problemei
const getProblemIcon = (problemId: string): string => {
  // Folosim hash-ul ID-ului pentru a obține o iconiță consistentă
  let hash = 0;
  for (let i = 0; i < problemId.length; i++) {
    const char = problemId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % problemIcons.length;
  return problemIcons[index];
}

const difficultyToneClasses: Record<string, string> = {
  "Ușor": "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  "Mediu": "border-amber-500/40 bg-amber-500/10 text-amber-200",
  "Avansat": "border-rose-500/40 bg-rose-500/10 text-rose-200",
}

const truncateChapterLabel = (chapter?: string | null) => {
  if (!chapter) return null
  const words = chapter.trim().split(/\s+/)
  if (words.length <= 3) return chapter.trim()
  return `${words.slice(0, 3).join(" ")}...`
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

// Component for rendering math content with lazy loading
function MathContent({ content }: { content: string }) {
  const [isMathLoaded, setIsMathLoaded] = useState(false)
  const [hasMath, setHasMath] = useState(false)

  useEffect(() => {
    // Check if content contains math expressions
    const containsMath = content.includes('$')
    setHasMath(containsMath)
    
    if (containsMath) {
      // Lazy load math rendering
      const timer = setTimeout(() => {
        setIsMathLoaded(true)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [content])

  if (!hasMath) {
    return <span>{content}</span>
  }

  if (!isMathLoaded) {
    return <div className="w-full h-4 rounded bg-gray-600/30 animate-pulse" />
  }

  return (
    <Suspense fallback={<div className="w-full h-4 rounded bg-gray-600/30 animate-pulse" />}>
      {content.split(/(\$[^$]+\$)/g).map((part, idx) =>
        part.startsWith('$') && part.endsWith('$') ? (
          <LazyInlineMath key={idx} math={part.slice(1, -1)} />
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </Suspense>
  )
}

export function ProblemCard({ problem, solved, isLocked = false }: ProblemCardProps) {
  const problemIcon = getProblemIcon(problem.id)
  const analytics = useAnalytics()
  const router = useRouter()

  const chapterLabel = truncateChapterLabel(problem.category)
  const primaryStatement = problem.statement?.trim()
    ? problem.statement
    : problem.title
  const statementPreview = createStatementPreview(primaryStatement, 15)
  const fallbackPreview = statementPreview || problem.title || ""
  const categoryDisplay = chapterLabel ?? (problem.category?.trim() || "Categorie")
  const statementVisible = Boolean(fallbackPreview)

  const tags = Array.isArray(problem.tags)
    ? problem.tags
    : typeof problem.tags === "string"
      ? problem.tags.split(",")
      : []

  const handleProblemClick = () => {
    analytics.trackProblemView({
      problem_id: problem.id.toString(),
      problem_difficulty: problem.difficulty,
      problem_category: problem.category,
    })
  }

  const handleLockedCardClick = () => {
    router.push('/pricing')
  }

  const handleUnlockedCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Nu naviga dacă click-ul a fost pe buton sau pe link
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) {
      return
    }
    handleProblemClick()
    router.push(`/probleme/${problem.id}`)
  }

  return (
    <Card
      onClick={isLocked ? handleLockedCardClick : handleUnlockedCardClick}
      className={cn(
        "relative flex h-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-white shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)] transition-all duration-300 hover:bg-white/[0.08]",
        solved ? "problem-card-solved" : "hover:border-white/20",
        "cursor-pointer"
      )}
    >
      {isLocked && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-black/55 px-4 text-center backdrop-blur-sm">
          <Lock className="h-8 w-8 text-white/80" />
          <p className="mt-3 text-xs font-medium text-white/60">
            Disponibila cu planul PLUS+
          </p>
        </div>
      )}
      <div
        className={cn(
          "flex flex-col gap-3",
          isLocked && "pointer-events-none select-none opacity-60"
        )}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
          <span className="row-span-2 text-4xl leading-none">{problemIcon}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={`flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.18em] ${difficultyToneClasses[problem.difficulty] ?? "border-white/20 bg-white/10 text-white/70"}`}>
              {problem.difficulty}
            </Badge>
            <Badge className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold text-white/75">
              {categoryDisplay}
            </Badge>
            <span className="text-xs font-mono uppercase tracking-[0.24em] text-white/45">
              ID {problem.id}
            </span>
          </div>

          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
              {tags
                .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
                .filter(Boolean)
                .map((tag, idx) => (
                  <span key={`${tag}-${idx}`}>
                    {idx > 0 && <span className="text-white/40">•</span>}
                    <span className="ml-1.5">{tag}</span>
                  </span>
                ))}
            </div>
          ) : (
            <div />
          )}
        </div>

        {statementVisible && (
          <div className="text-base leading-relaxed text-white/80 line-clamp-3 lg:line-clamp-4 xl:line-clamp-5 2xl:line-clamp-6">
            <MathContent content={fallbackPreview} />
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2">
        {isLocked ? (
          <span className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white/70 sm:w-auto">
            Blocat pentru PLUS+
          </span>
        ) : (
          <Link
            href={`/probleme/${problem.id}`}
            onClick={handleProblemClick}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 sm:w-auto"
          >
            Vezi problema
          </Link>
        )}
        {solved && (
          <span className="ml-auto text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Rezolvată
          </span>
        )}
      </div>
    </Card>
  )
}

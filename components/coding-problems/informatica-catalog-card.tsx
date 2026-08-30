"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MouseEventHandler } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Code2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CodingProblem } from "@/components/coding-problems/types"
import { mapNumericClassToLabel } from "@/lib/catalog-class-labels"

const difficultyToneClasses: Record<string, string> = {
  "Inițiere": "border-sky-200 bg-sky-50 text-sky-700",
  "Ușor": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Mediu": "border-amber-200 bg-amber-50 text-amber-700",
  "Avansat": "border-rose-200 bg-rose-50 text-rose-700",
  "Concurs": "border-indigo-200 bg-indigo-50 text-indigo-700",
}

function normalizePreview(markdown: string, maxWords = 15): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[_#>\[\]\(\)!]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!text) return ""
  const words = text.split(" ")
  if (words.length <= maxWords) return text
  return `${words.slice(0, maxWords).join(" ")}...`
}

function getProblemSolvePercentage(problemId: string, difficulty: string): number {
  let hash = 0
  for (let i = 0; i < problemId.length; i++) {
    hash = (hash << 5) - hash + problemId.charCodeAt(i)
    hash |= 0
  }
  const t = (hash >>> 0) / 0xffffffff

  let min = 3
  let max = 92

  if (difficulty === "Inițiere") {
    min = 76
    max = 95
  } else if (difficulty === "Ușor") {
    min = 61
    max = 92
  } else if (difficulty === "Mediu") {
    min = 32
    max = 75
  } else if (difficulty === "Avansat") {
    min = 3
    max = 28
  } else if (difficulty === "Concurs") {
    min = 8
    max = 35
  }

  const pct = min + (max - min) * t
  return Math.max(3, Math.min(92, Math.round(pct)))
}

interface InformaticaCatalogCardProps {
  problem: CodingProblem
  solved?: boolean
  isLocked?: boolean
  showDevEdit?: boolean
  variant?: "grid" | "list"
}

export function InformaticaCatalogCard({
  problem,
  solved = false,
  isLocked = false,
  showDevEdit = false,
  variant = "grid",
}: InformaticaCatalogCardProps) {
  const router = useRouter()
  const preview = normalizePreview(problem.statement_markdown ?? problem.title)
  const classLabel = mapNumericClassToLabel(problem.class) ?? `Clasa a ${problem.class}-a`
  const href = `/informatica/probleme/${encodeURIComponent(problem.slug)}`
  const displayId = problem.display_id?.trim() || problem.slug
  const solvePercentage = getProblemSolvePercentage(displayId, problem.difficulty)

  const handleNavigate: MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    router.push(href)
  }

  const prefetchProblem = () => {
    if (isLocked) return
    router.prefetch(href)
  }

  const handleCardClick = () => {
    if (!isLocked) router.push(href)
    else router.push("/pricing")
  }

  const badgeRow = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
          difficultyToneClasses[problem.difficulty] ?? "border-[#0b0c0f]/15 bg-[#f5f4f2] text-[#2c2f33]/75",
        )}
      >
        {problem.difficulty}
      </Badge>
      <span className="rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/75">
        ID {displayId}
      </span>
      <span className="rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-3 py-1 text-[11px] font-semibold text-[#2c2f33]/70">
        {classLabel}
      </span>
    </div>
  )

  const lockedOverlay = isLocked ? (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/75 px-4 text-center backdrop-blur-sm",
        variant === "list" ? "rounded-lg" : "rounded-2xl",
      )}
    >
      <Lock className="h-8 w-8 text-[#0b0c0f]/70" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2c2f33]/70">Disponibila cu Plus+</p>
    </div>
  ) : null

  if (variant === "list") {
    return (
      <Card
        onClick={handleCardClick}
        onMouseEnter={prefetchProblem}
        onFocus={prefetchProblem}
        className={cn(
          "group relative flex w-full cursor-pointer flex-row items-center gap-3 rounded-lg border border-[#0b0c0f]/10 bg-white px-3 py-3 shadow-[0px_8px_20px_-18px_rgba(11,12,15,0.5)] transition-all duration-200 md:gap-4 md:px-4 md:py-3.5",
          "hover:border-[#0b0c0f]/20 hover:shadow-[0px_12px_24px_-18px_rgba(11,12,15,0.45)]",
        )}
      >
        {lockedOverlay}

        <div className={cn("flex min-w-0 flex-1 items-center gap-2.5 md:gap-3", isLocked && "pointer-events-none select-none opacity-70")}>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#0b0c0f]/10 bg-[#f7f6f4] md:h-9 md:w-9">
            <Code2 className="h-4 w-4 text-[#2c2f33] md:h-[18px] md:w-[18px]" />
          </span>

          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-semibold leading-snug text-[#0b0c0f]">{problem.title}</p>
            {preview && (
              <p className="line-clamp-1 text-xs leading-relaxed text-[#2c2f33]/70">{preview}</p>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-3 text-[11px] font-semibold",
            isLocked && "pointer-events-none opacity-70",
          )}
        >
          <span className="min-w-[2.25rem] tabular-nums text-[#2c2f33]/55">{solvePercentage}%</span>
          <span className="uppercase tracking-[0.16em] text-[#2c2f33]/75">ID {displayId}</span>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
              difficultyToneClasses[problem.difficulty] ?? "border-[#0b0c0f]/15 bg-[#f5f4f2] text-[#2c2f33]/75",
            )}
          >
            {problem.difficulty}
          </Badge>
          <span className="whitespace-nowrap text-[#2c2f33]/65">{classLabel}</span>
          {solved && (
            <span className="whitespace-nowrap uppercase tracking-[0.16em] text-emerald-700">Rezolvata</span>
          )}
          {showDevEdit && (
            <Link
              href={`/dashboard/dev/catalog/informatica/edit/${encodeURIComponent(problem.slug)}`}
              className="hidden text-[10px] font-semibold text-[#2c2f33]/65 hover:text-[#0b0c0f] lg:inline"
              onClick={(e) => e.stopPropagation()}
            >
              Editează
            </Link>
          )}
          <ArrowRight className="h-4 w-4 shrink-0 text-[#2c2f33]/40 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
      </Card>
    )
  }

  return (
    <Card
      onClick={handleCardClick}
      onMouseEnter={prefetchProblem}
      onFocus={prefetchProblem}
      className={cn(
        "group relative flex h-full w-full cursor-pointer flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)] transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[#0b0c0f]/20 hover:shadow-[0px_20px_40px_-28px_rgba(11,12,15,0.55)]",
      )}
    >
      {lockedOverlay}

      <div className={cn("flex flex-col gap-4", isLocked && "pointer-events-none select-none opacity-70")}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0b0c0f]/10 bg-[#f7f6f4]">
            <Code2 className="h-5 w-5 text-[#2c2f33]" />
          </span>
          {badgeRow}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0b0c0f]">{problem.title}</p>
          {preview && <p className="line-clamp-3 text-sm leading-relaxed text-[#2c2f33]/80">{preview}</p>}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={href}
          prefetch={false}
          onMouseEnter={prefetchProblem}
          onFocus={prefetchProblem}
          onClick={handleNavigate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] sm:w-auto"
        >
          Încearcă problema
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>

        {showDevEdit && (
          <Link
            href={`/dashboard/dev/catalog/informatica/edit/${encodeURIComponent(problem.slug)}`}
            className="text-xs font-semibold text-[#2c2f33]/65 hover:text-[#0b0c0f]"
            onClick={(e) => e.stopPropagation()}
          >
            Editează
          </Link>
        )}

        {solved && <span className="ml-auto text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Rezolvata</span>}
      </div>
    </Card>
  )
}

export { InformaticaCatalogCardSkeleton } from "@/components/coding-problems/informatica-catalog-card-skeleton"

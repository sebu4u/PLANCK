import Link from "next/link"
import type { MouseEventHandler } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { CodingProblem } from "./types"

const CLASS_LABELS: Record<number, string> = {
  9: "Clasa a 9-a",
  10: "Clasa a 10-a",
  11: "Clasa a 11-a",
  12: "Clasa a 12-a",
}

const DIFFICULTY_STYLES: Record<string, string> = {
  "Ușor": "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  "Mediu": "border-amber-500/40 bg-amber-500/15 text-amber-200",
  "Avansat": "border-rose-500/40 bg-rose-500/15 text-rose-200",
  "Concurs": "border-indigo-500/40 bg-indigo-500/15 text-indigo-200",
}

function normalizePreview(markdown: string, maxWords = 40): string {
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

interface CodingProblemCardProps {
  problem: CodingProblem
  onSelect?: (problem: CodingProblem) => void
  isLocked?: boolean
}

export function CodingProblemCard({ problem, onSelect, isLocked = false }: CodingProblemCardProps) {
  const preview = normalizePreview(problem.statement_markdown ?? problem.title)
  const difficultyStyle =
    DIFFICULTY_STYLES[problem.difficulty] ?? "border-white/15 bg-white/10 text-white/70"
  const classLabel = CLASS_LABELS[problem.class] ?? `Clasa a ${problem.class}-a`
  const tags =
    Array.isArray(problem.tags) && problem.tags.length > 0
      ? problem.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean)
      : []

  const handleNavigate: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (onSelect) {
      onSelect(problem)
    }
  }

  const lockedIdentifier = problem.numeric_id ?? problem.id

  return (
    <Card className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-white shadow-[0px_24px_60px_-40px_rgba(0,0,0,1)] transition hover:border-white/20 hover:bg-white/[0.08]">
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
          <Lock className="h-6 w-6 text-white/80" />
          <p className="text-sm font-semibold text-white">
            Problema {lockedIdentifier} este disponibilă cu planul PLUS+
          </p>
          <p className="text-xs text-white/60">Fă upgrade pentru a o accesa.</p>
        </div>
      )}
      <div className={`flex flex-col gap-3 ${isLocked ? "pointer-events-none select-none blur-[1.5px]" : ""}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 font-semibold text-white/80">
            {classLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-semibold text-white/70">
            {problem.chapter}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[0.6rem] text-white/50">
            {new Date(problem.created_at).toLocaleDateString("ro-RO")}
          </span>
          {problem.isFreeMonthly && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-200">
              Free luna aceasta
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`rounded-full border px-4 py-1 text-xs font-semibold ${difficultyStyle}`}>
            {problem.difficulty}
          </Badge>
          <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
            {problem.points} puncte
          </Badge>
          <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
            {problem.time_limit_ms} ms
          </Badge>
        </div>

        <div className="flex items-baseline gap-2">
          {typeof problem.numeric_id === "number" && (
            <span className="font-mono text-xs uppercase tracking-[0.35em] text-white/50">
              #{problem.numeric_id}
            </span>
          )}
          <h3 className="text-xl font-semibold text-white">{problem.title}</h3>
        </div>

        <p className="line-clamp-4 text-sm leading-relaxed text-white/70">{preview}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`mt-auto flex items-center justify-between gap-3 ${isLocked ? "pointer-events-none" : ""}`}>
        {isLocked ? (
          <Button
            disabled
            className="w-full cursor-not-allowed rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white/70"
          >
            Blocat pentru PLUS+
          </Button>
        ) : (
          <Button
            asChild
            className="w-full rounded-full border border-white/15 bg-white text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Link href={`/informatica/probleme/${problem.slug}`} onClick={handleNavigate}>
              Vezi problema
            </Link>
          </Button>
        )}
      </div>
    </Card>
  )
}

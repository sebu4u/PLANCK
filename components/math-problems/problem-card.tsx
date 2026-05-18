import Link from "next/link"
import type { MouseEventHandler } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MathProblem } from "./types"

const CLASS_LABELS: Record<number, string> = {
  9: "Clasa a 9-a",
  10: "Clasa a 10-a",
  11: "Clasa a 11-a",
  12: "Clasa a 12-a",
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Ușor: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  Mediu: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  Avansat: "border-rose-500/40 bg-rose-500/15 text-rose-200",
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

interface MathProblemCardProps {
  problem: MathProblem
  onSelect?: (problem: MathProblem) => void
}

export function MathProblemCard({ problem, onSelect }: MathProblemCardProps) {
  const preview = normalizePreview(problem.statement ?? problem.title)
  const difficultyStyle =
    DIFFICULTY_STYLES[problem.difficulty] ?? "border-white/15 bg-white/10 text-white/70"
  const classLabel = CLASS_LABELS[problem.class] ?? `Clasa a ${problem.class}-a`
  const tags =
    Array.isArray(problem.tags) && problem.tags.length > 0
      ? problem.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean)
      : []

  const href = `/matematica/probleme/${encodeURIComponent(problem.id)}`

  const handleNavigate: MouseEventHandler<HTMLAnchorElement> = () => {
    if (onSelect) {
      onSelect(problem)
    }
  }

  return (
    <Card className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-white shadow-[0px_24px_60px_-40px_rgba(0,0,0,1)] transition hover:border-white/20 hover:bg-white/[0.08]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 font-semibold text-white/80">
            {classLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[0.6rem] text-white/50">
            {new Date(problem.created_at).toLocaleDateString("ro-RO")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`rounded-full border px-4 py-1 text-xs font-semibold ${difficultyStyle}`}>
            {problem.difficulty}
          </Badge>
          <span className="font-mono text-xs text-white/45">{problem.id}</span>
        </div>

        <Link
          href={href}
          onClick={handleNavigate}
          className="group block text-left text-xl font-semibold leading-snug text-white transition group-hover:text-white/90"
        >
          {problem.title}
        </Link>

        {problem.description ? (
          <p className="text-sm leading-relaxed text-white/55">{problem.description}</p>
        ) : null}

        {preview ? <p className="text-sm leading-relaxed text-white/65">{preview}</p> : null}

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-white/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-auto pt-2">
        <Link
          href={href}
          onClick={handleNavigate}
          className="inline-flex text-sm font-semibold text-sky-300 hover:text-sky-200"
        >
          Vezi enunțul complet
        </Link>
      </div>
    </Card>
  )
}

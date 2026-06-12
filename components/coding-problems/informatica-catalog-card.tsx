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

interface InformaticaCatalogCardProps {
  problem: CodingProblem
  solved?: boolean
  isLocked?: boolean
  showDevEdit?: boolean
}

export function InformaticaCatalogCard({
  problem,
  solved = false,
  isLocked = false,
  showDevEdit = false,
}: InformaticaCatalogCardProps) {
  const router = useRouter()
  const preview = normalizePreview(problem.statement_markdown ?? problem.title)
  const classLabel = mapNumericClassToLabel(problem.class) ?? `Clasa a ${problem.class}-a`
  const href = `/informatica/probleme/${encodeURIComponent(problem.slug)}`
  const displayId = problem.numeric_id != null ? String(problem.numeric_id) : problem.slug

  const handleNavigate: MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    router.push(href)
  }

  return (
    <Card
      onClick={() => {
        if (!isLocked) router.push(href)
        else router.push("/pricing")
      }}
      className={cn(
        "group relative flex h-full w-full cursor-pointer flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)] transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[#0b0c0f]/20 hover:shadow-[0px_20px_40px_-28px_rgba(11,12,15,0.55)]",
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
            <Code2 className="h-5 w-5 text-[#2c2f33]" />
          </span>
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
              {displayId}
            </span>
            <span className="rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-3 py-1 text-[11px] font-semibold text-[#2c2f33]/70">
              {classLabel}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0b0c0f]">{problem.title}</p>
          {preview && <p className="line-clamp-3 text-sm leading-relaxed text-[#2c2f33]/80">{preview}</p>}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={href}
          prefetch
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

export function InformaticaCatalogCardSkeleton() {
  return (
    <Card className="flex h-full flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-[#f5f4f2]" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-[#f5f4f2]" />
      <div className="h-16 w-full animate-pulse rounded bg-[#f5f4f2]" />
      <div className="mt-auto h-10 w-40 animate-pulse rounded-full bg-[#f5f4f2]" />
    </Card>
  )
}

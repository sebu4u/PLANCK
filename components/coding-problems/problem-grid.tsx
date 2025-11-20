import { CodingProblem } from "./types"
import { CodingProblemCard } from "./problem-card"
import { Skeleton } from "@/components/ui/skeleton"

interface CodingProblemGridProps {
  problems: CodingProblem[]
  loading: boolean
  onSelectProblem?: (problem: CodingProblem) => void
  canAccessProblem?: (problem: CodingProblem) => boolean
}

const PLACEHOLDER_ITEMS = Array.from({ length: 8 })

export function CodingProblemGrid({
  problems,
  loading,
  onSelectProblem,
  canAccessProblem,
}: CodingProblemGridProps) {
  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PLACEHOLDER_ITEMS.map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6"
          >
            <Skeleton className="h-6 w-1/2 rounded-full bg-white/10" />
            <Skeleton className="h-8 w-3/4 rounded-full bg-white/10" />
            <Skeleton className="h-20 w-full rounded-3xl bg-white/10" />
            <Skeleton className="h-10 w-2/3 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (problems.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-12 text-center text-white/70 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)]">
        <p className="text-lg text-white">
          Nu am găsit probleme care să se potrivească filtrelor selectate.
        </p>
        <p className="mt-3 text-sm text-white/60">
          Ajustează filtrele sau resetează-le pentru a vedea toate problemele disponibile.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {problems.map((problem) => (
        <CodingProblemCard
          key={problem.id}
          problem={problem}
          onSelect={onSelectProblem}
          isLocked={canAccessProblem ? !canAccessProblem(problem) : false}
        />
      ))}
    </div>
  )
}


"use client"

import { CheckCircle2, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ContestSidebarProblem {
  id: string
  display_order: number
}

interface ContestSidebarProps {
  problems: ContestSidebarProblem[]
  currentProblemId: string
  answers: Record<string, string>
  savingProblemIds: string[]
  onSelectProblem: (problemId: string) => void
  disabled?: boolean
}

export function ContestSidebar({
  problems,
  currentProblemId,
  answers,
  savingProblemIds,
  onSelectProblem,
  disabled = false
}: ContestSidebarProps) {
  const answeredCount = problems.filter((problem) => answers[problem.id]).length

  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Navigare probleme</p>
          <p className="text-sm text-gray-500">Poți reveni oricând la orice problemă.</p>
        </div>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {answeredCount}/{problems.length}
        </Badge>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {problems.map((problem) => {
          const isCurrent = problem.id === currentProblemId
          const hasAnswer = Boolean(answers[problem.id])
          const isSaving = savingProblemIds.includes(problem.id)

          return (
            <button
              key={problem.id}
              type="button"
              onClick={() => onSelectProblem(problem.id)}
              disabled={disabled}
              className={cn(
                "relative flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition-all",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isCurrent && "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25",
                !isCurrent && hasAnswer && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                !isCurrent && !hasAnswer && "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
                isSaving && "ring-2 ring-amber-300"
              )}
            >
              {problem.display_order}
              {isSaving ? (
                <LoaderCircle className="absolute right-1.5 top-1.5 h-3.5 w-3.5 animate-spin" />
              ) : hasAnswer ? (
                <CheckCircle2 className="absolute right-1.5 top-1.5 h-3.5 w-3.5" />
              ) : null}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

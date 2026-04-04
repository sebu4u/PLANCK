"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { createAssignmentAction } from "@/app/classrooms/actions"
import { useAuth } from "@/components/auth-provider"
import { ProblemCard } from "@/components/problem-card"
import type { FilterState } from "@/components/problems/problems-catalog-sidebar"
import { ProblemsCatalogSidebar } from "@/components/problems/problems-catalog-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Problem } from "@/data/problems"
import {
  buildProgressByClassForProblems,
  CLASS_MAP,
  filterCatalogProblems,
} from "@/lib/catalog-filter-utils"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

export interface ProblemPoolItem {
  id: string
  title: string
  statement: string
  difficulty: string | null
  class: number
  answer_type: "value" | "grila" | null
  image_url: string | null
  category: string | null
  tags: string | null
  solve_percentage: number | null
}

interface CreateAssignmentFormProps {
  classroomId: string
  problems: ProblemPoolItem[]
}

function poolItemToProblem(item: ProblemPoolItem): Problem {
  const cls = [9, 10, 11, 12].includes(item.class) ? item.class : undefined
  const difficulty =
    item.difficulty === "Ușor" || item.difficulty === "Mediu" || item.difficulty === "Avansat"
      ? item.difficulty
      : "Mediu"

  return {
    id: item.id,
    title: item.title,
    description: "",
    statement: item.statement,
    difficulty,
    category: item.category ?? "",
    tags: item.tags ?? "",
    youtube_url: "",
    created_at: "",
    class: cls,
    classString: cls ? CLASS_MAP[cls] : undefined,
    image_url: item.image_url ?? undefined,
    answer_type: item.answer_type,
    solve_percentage: item.solve_percentage,
  }
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create assignment"}
    </Button>
  )
}

const defaultFilters = (): FilterState => ({
  search: "",
  category: "Toate",
  difficulty: "Toate",
  progress: "Toate",
  class: "Toate",
  chapter: "Toate",
})

export function CreateAssignmentForm({ classroomId, problems: pool }: CreateAssignmentFormProps) {
  const { user } = useAuth()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])

  const catalogProblems = useMemo(() => pool.map(poolItemToProblem), [pool])

  const fetchSolvedProblems = useCallback(async () => {
    if (!user) {
      setSolvedProblems([])
      return
    }
    try {
      const { data } = await supabase.from("solved_problems").select("problem_id").eq("user_id", user.id)
      setSolvedProblems(data ? data.map((row: { problem_id: string }) => row.problem_id) : [])
    } catch {
      setSolvedProblems([])
    }
  }, [user])

  useEffect(() => {
    fetchSolvedProblems()
  }, [fetchSolvedProblems])

  const filteredProblems = useMemo(
    () => filterCatalogProblems(catalogProblems, filters, solvedProblems),
    [catalogProblems, filters, solvedProblems],
  )

  const progressByClass = useMemo(
    () => buildProgressByClassForProblems(catalogProblems, solvedProblems),
    [catalogProblems, solvedProblems],
  )

  const toggle = (problemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(problemId)) next.delete(problemId)
      else next.add(problemId)
      return next
    })
  }

  return (
    <Card className="border-[#eceff3] bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Create assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createAssignmentAction} className="space-y-4">
          <input type="hidden" name="classroom_id" value={classroomId} />
          {Array.from(selected).map((problemId) => (
            <input key={problemId} type="hidden" name="problem_ids" value={problemId} />
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#111827]">Title</label>
              <Input name="title" placeholder="Homework 1 - Kinematics" required maxLength={200} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#111827]">Description</label>
              <Textarea name="description" placeholder="What should students focus on?" rows={3} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]">Deadline</label>
              <Input name="deadline" type="datetime-local" />
            </div>
          </div>

          <div className="space-y-3 border-t border-[#e8eaed] pt-4">
            <div>
              <p className="text-sm font-medium text-[#111827]">Probleme din catalog</p>
              <p className="mt-0.5 text-xs text-[#6b7280]">
                Acelasi tip de filtre ca pe pagina de catalog. Cardurile sunt selectabile pentru temă.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <aside
                className={cn(
                  "shrink-0 rounded-2xl border border-[#0b0c0f]/10 bg-[#faf9f7] p-4 lg:w-[min(100%,320px)]",
                  "lg:max-h-[min(70vh,620px)] lg:overflow-y-auto lg:overscroll-contain",
                )}
              >
                <ProblemsCatalogSidebar
                  filters={filters}
                  onFilterChange={setFilters}
                  progressByClass={progressByClass}
                  totalProblems={catalogProblems.length}
                  filteredCount={filteredProblems.length}
                />
              </aside>

              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs text-[#6b7280]">
                  {selected.size} problem{selected.size === 1 ? "" : "e"} selectat{selected.size === 1 ? "ă" : "e"}
                </p>
                <div className="grid max-h-[min(70vh,620px)] gap-4 overflow-y-auto overscroll-contain sm:grid-cols-2">
                  {filteredProblems.length === 0 ? (
                    <p className="col-span-full text-sm text-[#6b7280]">Nicio problemă nu corespunde filtrelor.</p>
                  ) : (
                    filteredProblems.map((problem) => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        solved={solvedProblems.includes(problem.id)}
                        picker={{
                          selected: selected.has(problem.id),
                          onToggle: () => toggle(problem.id),
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}

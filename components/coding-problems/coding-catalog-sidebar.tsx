"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  INFORMATICA_CATALOG_CHAPTER_OPTIONS,
  INFORMATICA_CLASS_VALUES,
  mergeInformaticaChaptersForClass,
} from "@/lib/informatica-catalog-chapters"
import { CodingProblemFiltersState, ClassFilterValue } from "./types"

const CLASS_LABELS: Record<number, string> = {
  9: "Clasa a 9-a",
  10: "Clasa a 10-a",
  11: "Clasa a 11-a",
  12: "Clasa a 12-a",
}

const DIFFICULTY_OPTIONS = ["Inițiere", "Ușor", "Mediu", "Avansat", "Concurs"] as const

interface CodingCatalogSidebarProps {
  filters: CodingProblemFiltersState
  chaptersByClass: Record<string, string[]>
  totalProblems: number
  filteredCount: number
  onFilterChange: (filters: CodingProblemFiltersState) => void
}

const hasActiveFilters = (filters: CodingProblemFiltersState) =>
  Boolean(filters.search) ||
  filters.difficulty !== "Toate" ||
  filters.class !== "Toate" ||
  filters.chapter !== "Toate"

export function CodingCatalogSidebar({
  filters,
  chaptersByClass,
  totalProblems,
  filteredCount,
  onFilterChange,
}: CodingCatalogSidebarProps) {
  const [expandedClasses, setExpandedClasses] = useState<Record<number, boolean>>({
    9: true,
    10: false,
    11: false,
    12: false,
  })

  useEffect(() => {
    if (filters.class !== "Toate") {
      setExpandedClasses((prev) => ({ ...prev, [filters.class as number]: true }))
    }
  }, [filters.class])

  const updateFilters = (next: Partial<CodingProblemFiltersState>) => {
    onFilterChange({
      ...filters,
      ...next,
    })
  }

  const clearFilters = () => {
    onFilterChange({
      search: "",
      class: "Toate",
      difficulty: "Toate",
      chapter: "Toate",
    })
  }

  const chaptersForClass = (classNum: number) => {
    const fromDb = chaptersByClass[String(classNum)] ?? []
    return mergeInformaticaChaptersForClass(classNum, fromDb)
  }

  return (
    <div className="flex h-full flex-col text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-white/70" />
          <span className="text-sm font-semibold text-white">Filtre și capitole</span>
        </div>
      </div>

      <div className="mt-4 space-y-5 pr-1">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Căutare</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Caută probleme..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="h-10 rounded-full border-white/15 bg-white/[0.06] pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Dificultate</label>
          <div className="grid grid-cols-2 gap-2">
            {DIFFICULTY_OPTIONS.map((difficulty) => {
              const active = filters.difficulty === difficulty
              return (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => updateFilters({ difficulty: active ? "Toate" : difficulty })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-white bg-white text-[#0b0c0f]"
                      : "border-white/15 bg-white/[0.04] text-white/85 hover:border-white/30 hover:bg-white/[0.08]",
                  )}
                >
                  {difficulty}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-4">
          {INFORMATICA_CLASS_VALUES.map((classNum) => {
            const chapters = chaptersForClass(classNum)
            const isActiveClass = filters.class === classNum
            const isOpen = expandedClasses[classNum]
            const hasChapters =
              chapters.length > 0 || (INFORMATICA_CATALOG_CHAPTER_OPTIONS[classNum]?.length ?? 0) > 0

            return (
              <div key={classNum} className="rounded-xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedClasses((prev) => ({ ...prev, [classNum]: !prev[classNum] }))
                    if (filters.class !== classNum) {
                      updateFilters({ class: classNum as ClassFilterValue, chapter: "Toate" })
                    }
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left transition",
                    isActiveClass ? "bg-white/[0.08]" : "hover:bg-white/[0.06]",
                  )}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {CLASS_LABELS[classNum]}
                  </span>
                </button>

                {isOpen && hasChapters && (
                  <div className="max-h-[320px] space-y-1 overflow-y-auto border-t border-white/10 px-2 py-2">
                    {chapters.map((chapter) => {
                      const isActiveChapter = isActiveClass && filters.chapter === chapter
                      return (
                        <button
                          key={`${classNum}-${chapter}`}
                          type="button"
                          onClick={() => updateFilters({ class: classNum as ClassFilterValue, chapter })}
                          className={cn(
                            "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs transition",
                            isActiveChapter
                              ? "bg-white text-[#0b0c0f]"
                              : "text-white/85 hover:bg-white/[0.08]",
                          )}
                        >
                          <span className="line-clamp-2">{chapter}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {isOpen && !hasChapters && (
                  <p className="border-t border-white/10 px-3 py-2 text-xs text-white/45">
                    Capitolele vor apărea pe măsură ce sunt adăugate probleme.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs text-white/60">
          Se afișează <span className="font-semibold text-white">{filteredCount}</span> din{" "}
          <span className="font-semibold text-white">{totalProblems}</span> probleme
        </p>
        {hasActiveFilters(filters) && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            className="mt-2 h-auto rounded-full px-0 py-0 text-xs font-semibold text-white/55 hover:bg-transparent hover:text-white"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Resetează filtrele
          </Button>
        )}
      </div>
    </div>
  )
}

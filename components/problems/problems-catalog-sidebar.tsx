"use client"

import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FilterState {
  search: string
  category: string
  difficulty: string
  progress: "Toate" | "Nerezolvate" | "Rezolvate"
  class: string
  chapter: string
}

export interface SidebarProgress {
  total: number
  solved: number
}

export interface SidebarClassProgress extends SidebarProgress {
  chapters: Record<string, SidebarProgress>
}

export const CATALOG_CLASS_OPTIONS = ["a 9-a", "a 10-a", "a 11-a", "a 12-a"] as const

export const CATALOG_CHAPTER_OPTIONS: Record<(typeof CATALOG_CLASS_OPTIONS)[number], string[]> = {
  "a 9-a": [
    "Miscarea rectilinie si uniforma a punctului material",
    "Miscarea rectilinie uniform variata",
    "Miscarea punctului material sub actiunea greutatii",
    "Principiile mecanicii",
    "Forta de frecare",
    "Forta elastica",
    "Legea atractiei universale",
    "Miscarea circular uniforma",
    "Lucrul mecanic si puterea mecanica",
    "Energia mecanica",
    "Impulsul punctului material",
    "Ciocniri plastice si elastice",
    "Elemente de statica",
    "Principiile opticii geometrice",
    "Lentile",
    "Instrumente optice",
    "Probleme diverse.",
  ],
  "a 10-a": [
    "Legea gazului ideal",
    "Lucrul mecanic si energia interna",
    "Principiul 1 al termodinamicii",
    "Principiul 2 al termodinamicii",
    "Calorimetrie",
    "Electrostatica",
    "Rezistenta electrica. Legea lui Ohm",
    "Gruparea rezistoarelor",
    "Legile lui Kirchhoff",
    "Energia si puterea electrica",
    "magnetism",
    "probleme diverse.",
  ],
  "a 11-a": [
    "Oscilații mecanice. Pendul gravitațional",
    "Unde mecanice",
    "circuite de curent alternativ",
    "Circuite serie de curent alternativ",
    "Circuite paralele de curent alternativ",
    "Circuite mixte de curent alternativ",
    "Circuit oscilant. Antena",
    "Prisma optică. Dispersia luminii",
    "Interferența luminii. Dispozitivul Young",
    "Dispozitive interferenționale",
    "Interferența localizată",
    "Difracția luminii",
    "Polarizarea luminii",
    "probleme diverse",
  ],
  "a 12-a": [
    "Efectul fotoelectric extern",
    "Efectul Compton",
    "Modelul atomic",
    "Atomul cu mai mulți electroni. Raze X",
    "Proprietățile generale ale nucleului atomic",
    "Reacții nucleare",
    "Radiații nucleare",
    "Particule elementare",
    "probleme diverse",
  ],
}

interface ProblemsCatalogSidebarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  progressByClass: Record<string, SidebarClassProgress>
  totalProblems: number
  filteredCount: number
  lockedClass?: string | null
}

const difficultyOptions = ["Inițiere", "Ușor", "Mediu", "Avansat"] as const
const progressOptions: FilterState["progress"][] = ["Nerezolvate", "Rezolvate"]
const difficultyHoverClasses: Record<(typeof difficultyOptions)[number], string> = {
  "Inițiere": "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
  "Ușor": "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
  "Mediu": "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700",
  "Avansat": "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700",
}

const hasActiveFilters = (filters: FilterState, defaultClass: string | null) =>
  Boolean(filters.search) ||
  filters.difficulty !== "Toate" ||
  filters.progress !== "Toate" ||
  (defaultClass != null && filters.class !== defaultClass) ||
  filters.chapter !== "Toate"

const progressLabel = (progress: SidebarProgress | undefined) => {
  if (!progress) return "0 / 0"
  return `${progress.solved} / ${progress.total}`
}

export function ProblemsCatalogSidebar({
  filters,
  onFilterChange,
  progressByClass,
  totalProblems,
  filteredCount,
  lockedClass = null,
}: ProblemsCatalogSidebarProps) {
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({
    "a 9-a": false,
    "a 10-a": false,
    "a 11-a": false,
    "a 12-a": false,
  })

  useEffect(() => {
    if (lockedClass && CATALOG_CLASS_OPTIONS.includes(lockedClass as (typeof CATALOG_CLASS_OPTIONS)[number])) {
      setExpandedClasses((prev) => ({ ...prev, [lockedClass]: true }))
    }
  }, [lockedClass])

  const updateFilters = (next: Partial<FilterState>) => {
    onFilterChange({
      ...filters,
      ...next,
    })
  }

  const clearFilters = () => {
    onFilterChange({
      search: "",
      category: "Toate",
      difficulty: "Toate",
      progress: "Toate",
      class: lockedClass ?? "Toate",
      chapter: "Toate",
    })
  }

  return (
    <div className="flex h-full flex-col text-[#2c2f33]">
      <div className="flex items-center justify-between border-b border-[#0b0c0f]/10 pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#2c2f33]/70" />
          <span className="text-sm font-semibold text-[#0b0c0f]">Filtre si capitole</span>
        </div>
      </div>

      <div className="mt-4 space-y-5 pr-1">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/70">Cautare</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2c2f33]/40" />
            <Input
              placeholder="Cauta probleme..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="h-10 rounded-full border-[#0b0c0f]/15 bg-white pl-10 text-sm text-[#2c2f33] placeholder:text-[#2c2f33]/45 focus-visible:ring-[#0b0c0f]/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/70">Dificultate</label>
          <div className="grid grid-cols-2 gap-2">
            {difficultyOptions.map((difficulty) => {
              const active = filters.difficulty === difficulty
              return (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => updateFilters({ difficulty: active ? "Toate" : difficulty })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-[#0b0c0f] bg-[#0b0c0f] text-white"
                      : cn("border-[#0b0c0f]/15 bg-white text-[#2c2f33]", difficultyHoverClasses[difficulty]),
                  )}
                >
                  {difficulty}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/70">Progres</label>
          <div className="grid grid-cols-2 gap-2">
            {progressOptions.map((progress) => {
              const active = filters.progress === progress
              return (
                <button
                  key={progress}
                  type="button"
                  onClick={() => updateFilters({ progress: active ? "Toate" : progress })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-[#0b0c0f] bg-[#0b0c0f] text-white"
                      : "border-[#0b0c0f]/15 bg-white text-[#2c2f33] hover:border-[#0b0c0f]/35",
                  )}
                >
                  {progress}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2 border-t border-[#0b0c0f]/10 pt-4">
          {CATALOG_CLASS_OPTIONS.map((cls) => {
            const classProgress = progressByClass[cls]
            const isActiveClass = filters.class === cls
            const isOpen = expandedClasses[cls]
            return (
              <div key={cls} className="rounded-xl border border-[#0b0c0f]/10 bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedClasses((prev) => ({ ...prev, [cls]: !prev[cls] }))}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left transition",
                    isActiveClass ? "bg-[#f5f4f2]" : "hover:bg-[#f9f8f6]",
                  )}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b0c0f]">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Clasa {cls}
                  </span>
                  <span className="text-xs font-semibold text-[#2c2f33]/70">{progressLabel(classProgress)}</span>
                </button>

                {isOpen && (
                  <div className="space-y-1 border-t border-[#0b0c0f]/10 px-2 py-2">
                    {CATALOG_CHAPTER_OPTIONS[cls].map((chapter) => {
                      const chapterProgress = classProgress?.chapters?.[chapter]
                      const isActiveChapter = isActiveClass && filters.chapter === chapter
                      return (
                        <button
                          key={`${cls}-${chapter}`}
                          type="button"
                          onClick={() => updateFilters({ class: cls, chapter })}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition",
                            isActiveChapter
                              ? "bg-[#0b0c0f] text-white"
                              : "text-[#2c2f33] hover:bg-[#f5f4f2]",
                          )}
                        >
                          <span className="line-clamp-2 pr-2">{chapter}</span>
                          <span className={cn("shrink-0 font-semibold", isActiveChapter ? "text-white/85" : "text-[#2c2f33]/65")}>
                            {progressLabel(chapterProgress)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-[#0b0c0f]/10 pt-4">
        <p className="text-xs text-[#2c2f33]/70">
          Se afiseaza <span className="font-semibold text-[#0b0c0f]">{filteredCount}</span> din{" "}
          <span className="font-semibold text-[#0b0c0f]">{totalProblems}</span> probleme
        </p>
        {hasActiveFilters(filters, lockedClass) && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            className="mt-2 h-auto rounded-full px-0 py-0 text-xs font-semibold text-[#2c2f33]/65 hover:bg-transparent hover:text-[#0b0c0f]"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reseteaza filtrele
          </Button>
        )}
      </div>
    </div>
  )
}

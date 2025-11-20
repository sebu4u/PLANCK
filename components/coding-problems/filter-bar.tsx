"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  CodingProblemFacets,
  CodingProblemFiltersState,
  ClassFilterValue,
  DifficultyFilterValue,
} from "./types"

interface CodingProblemFilterBarProps {
  filters: CodingProblemFiltersState
  facets?: CodingProblemFacets | null
  totalCount: number
  filteredCount: number
  onFiltersChange: (filters: CodingProblemFiltersState) => void
  onReset?: () => void
}

const CLASS_OPTIONS: Array<{ value: ClassFilterValue; label: string }> = [
  { value: "Toate", label: "Toate clasele" },
  { value: 9, label: "Clasa a 9-a" },
  { value: 10, label: "Clasa a 10-a" },
  { value: 11, label: "Clasa a 11-a" },
  { value: 12, label: "Clasa a 12-a" },
]

const DIFFICULTY_OPTIONS: Array<{ value: DifficultyFilterValue; label: string }> = [
  { value: "Toate", label: "Toate dificultățile" },
  { value: "Ușor", label: "Ușor" },
  { value: "Mediu", label: "Mediu" },
  { value: "Avansat", label: "Avansat" },
  { value: "Concurs", label: "Concurs" },
]

function chapterOptionsForClass(
  selectedClass: ClassFilterValue,
  facets?: CodingProblemFacets | null
): string[] {
  if (!facets) {
    return []
  }

  if (selectedClass === "Toate") {
    return []
  }

  const key = String(selectedClass)
  const list = facets.chaptersByClass?.[key] ?? []
  return list
}

export function CodingProblemFilterBar({
  filters,
  facets,
  totalCount,
  filteredCount,
  onFiltersChange,
  onReset,
}: CodingProblemFilterBarProps) {
  const chapterOptions = useMemo(
    () => chapterOptionsForClass(filters.class, facets),
    [filters.class, facets]
  )

  const handleClassChange = (value: string) => {
    const classValue = value === "Toate" ? "Toate" : (parseInt(value, 10) as ClassFilterValue)
    const shouldResetChapter =
      classValue === "Toate" ||
      (filters.chapter !== "Toate" &&
        !chapterOptionsForClass(classValue, facets).includes(filters.chapter))

    onFiltersChange({
      ...filters,
      class: classValue,
      chapter: shouldResetChapter ? "Toate" : filters.chapter,
    })
  }

  const handleDifficultyChange = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: value as DifficultyFilterValue,
    })
  }

  const handleChapterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      chapter: value,
    })
  }

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value,
    })
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white shadow-[0px_24px_60px_-32px_rgba(0,0,0,1)]">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
        <p>
          Se afișează {filteredCount} din {totalCount} probleme
        </p>
        {onReset && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/20 bg-white/[0.06] text-white hover:bg-white/15"
            onClick={onReset}
          >
            Resetează filtrele
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
            Caută
          </label>
          <Input
            value={filters.search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Caută după titlu sau enunț"
            className="h-11 rounded-2xl border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-white/10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
            Clasă
          </label>
          <Select value={String(filters.class)} onValueChange={handleClassChange}>
            <SelectTrigger className="h-11 rounded-2xl border-white/15 bg-black/40 text-sm text-white">
              <SelectValue placeholder="Selectează clasa" />
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#121212] text-white">
              {CLASS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
            Dificultate
          </label>
          <Select value={filters.difficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="h-11 rounded-2xl border-white/15 bg-black/40 text-sm text-white">
              <SelectValue placeholder="Selectează dificultatea" />
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#121212] text-white">
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
            Capitol
          </label>
          <Select
            value={filters.chapter}
            onValueChange={handleChapterChange}
            disabled={chapterOptions.length === 0}
          >
            <SelectTrigger className="h-11 rounded-2xl border-white/15 bg-black/40 text-sm text-white disabled:cursor-not-allowed disabled:text-white/30">
              <SelectValue
                placeholder={
                  filters.class === "Toate" ? "Selectează clasa mai întâi" : "Selectează capitolul"
                }
              />
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#121212] text-white">
              <SelectItem key="Toate" value="Toate" className="text-sm">
                Toate capitolele
              </SelectItem>
              {chapterOptions.map((chapter) => (
                <SelectItem key={chapter} value={chapter} className="text-sm">
                  {chapter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}


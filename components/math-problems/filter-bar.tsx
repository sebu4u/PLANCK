"use client"

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
  MathProblemFacets,
  MathProblemFiltersState,
  MathClassFilterValue,
  MathDifficultyFilterValue,
} from "./types"

interface MathProblemFilterBarProps {
  filters: MathProblemFiltersState
  facets?: MathProblemFacets | null
  totalCount: number
  filteredCount: number
  onFiltersChange: (filters: MathProblemFiltersState) => void
  onReset?: () => void
}

// facets reserved for viitor (ex. popularitate); filtrele rămân pe listă fixă

const CLASS_OPTIONS: Array<{ value: MathClassFilterValue; label: string }> = [
  { value: "Toate", label: "Toate clasele" },
  { value: 9, label: "Clasa a 9-a" },
  { value: 10, label: "Clasa a 10-a" },
  { value: 11, label: "Clasa a 11-a" },
  { value: 12, label: "Clasa a 12-a" },
]

const DIFFICULTY_OPTIONS: Array<{ value: MathDifficultyFilterValue; label: string }> = [
  { value: "Toate", label: "Toate dificultățile" },
  { value: "Ușor", label: "Ușor" },
  { value: "Mediu", label: "Mediu" },
  { value: "Avansat", label: "Avansat" },
]

export function MathProblemFilterBar({
  filters,
  facets: _facets,
  totalCount,
  filteredCount,
  onFiltersChange,
  onReset,
}: MathProblemFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[200px] flex-1 space-y-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/45">
            Căutare
          </span>
          <Input
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                search: e.target.value,
              })
            }
            placeholder="Titlu sau enunț…"
            className="border-white/15 bg-white/[0.06] text-white placeholder:text-white/35"
          />
        </div>
        <div className="min-w-[160px] space-y-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/45">
            Clasă
          </span>
          <Select
            value={filters.class === "Toate" ? "Toate" : String(filters.class)}
            onValueChange={(value) => {
              const classValue =
                value === "Toate" ? "Toate" : (parseInt(value, 10) as MathClassFilterValue)
              onFiltersChange({
                ...filters,
                class: classValue,
              })
            }}
          >
            <SelectTrigger className="border-white/15 bg-white/[0.06] text-white">
              <SelectValue placeholder="Clasă" />
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#111] text-white">
              {CLASS_OPTIONS.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)} className="text-white focus:bg-white/10">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px] space-y-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/45">
            Dificultate
          </span>
          <Select
            value={filters.difficulty}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                difficulty: value as MathDifficultyFilterValue,
              })
            }
          >
            <SelectTrigger className="border-white/15 bg-white/[0.06] text-white">
              <SelectValue placeholder="Dificultate" />
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#111] text-white">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-white/10">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <p className="text-xs text-white/50">
          Afișezi{" "}
          <span className="font-semibold text-white/80">
            {filteredCount}/{totalCount}
          </span>{" "}
          probleme
        </p>
        {onReset ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/25 bg-transparent text-white hover:bg-white/10"
            onClick={onReset}
          >
            Resetează filtrele
          </Button>
        ) : null}
      </div>
    </div>
  )
}

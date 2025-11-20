"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, Atom, Users, Award, Star, BookOpen } from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ProblemFiltersProps {
  onFilterChange: (filters: FilterState) => void
  totalProblems: number
  filteredCount: number
  onClosePanel?: () => void
}

export interface FilterState {
  search: string
  category: string
  difficulty: string
  progress: "Toate" | "Nerezolvate" | "Rezolvate"
  class: string
  chapter: string
}

const classOptions = ["Toate", "a 9-a", "a 10-a", "a 11-a", "a 12-a"]
const chapterOptions: Record<string, string[]> = {
  "a 9-a": [
    "Toate",
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
    "Probleme diverse."
  ],
  "a 10-a": [
    "Toate",
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
    "probleme diverse."
  ],
  "a 11-a": [
    "Toate",
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
    "probleme diverse"
  ],
  "a 12-a": [
    "Toate",
    "Efectul fotoelectric extern",
    "Efectul Compton",
    "Modelul atomic",
    "Atomul cu mai mulți electroni. Raze X",
    "Proprietățile generale ale nucleului atomic",
    "Reacții nucleare",
    "Radiații nucleare",
    "Particule elementare",
    "probleme diverse"
  ]
}

const iconBase = "mr-2 inline h-4 w-4 text-white/60"

const classIcons: Record<string, React.ReactNode> = {
  "a 9-a": <Users className={iconBase} />,
  "a 10-a": <Atom className={iconBase} />,
  "a 11-a": <Award className={iconBase} />,
  "a 12-a": <Star className={iconBase} />,
  "Toate": <BookOpen className={iconBase} />,
}

const chapterEmojis: Record<string, string> = {
  // Clasa a 9-a
  "Miscarea rectilinie si uniforma a punctului material": "↔️",
  "Miscarea rectilinie uniform variata": "↕️",
  "Miscarea punctului material sub actiunea greutatii": "⬇️",
  "Principiile mecanicii": "📐",
  "Forta de frecare": "⭕",
  "Forta elastica": "⭕",
  "Legea atractiei universale": "⭐",
  "Miscarea circular uniforma": "⭕",
  "Lucrul mecanic si puterea mecanica": "⚡",
  "Energia mecanica": "🔥",
  "Impulsul punctului material": "↕️",
  "Ciocniri plastice si elastice": "↔️",
  "Elemente de statica": "📐",
  "Principiile opticii geometrice": "☀️",
  "Lentile": "👁️",
  "Instrumente optice": "👓",
  "Probleme diverse.": "❓",
  // Clasa a 10-a
  "Legea gazului ideal": "🔥",
  "Lucrul mecanic si energia interna": "⚡",
  "Principiul 1 al termodinamicii": "🔥",
  "Principiul 2 al termodinamicii": "🔥",
  "Calorimetrie": "🔥",
  "Electrostatica": "⚡",
  "Rezistenta electrica. Legea lui Ohm": "⚡",
  "Gruparea rezistoarelor": "⚡",
  "Legile lui Kirchhoff": "⚡",
  "Energia si puterea electrica": "⚡",
  "magnetism": "⭐",
  "probleme diverse.": "❓",
  // Clasa a 11-a
  "Oscilații mecanice. Pendul gravitațional": "🌊",
  "Unde mecanice": "🌊",
  "circuite de curent alternativ": "⚡",
  "Circuite serie de curent alternativ": "⚡",
  "Circuite paralele de curent alternativ": "⚡",
  "Circuite mixte de curent alternativ": "⚡",
  "Circuit oscilant. Antena": "📻",
  "Prisma optică. Dispersia luminii": "☀️",
  "Interferența luminii. Dispozitivul Young": "🎯",
  "Dispozitive interferenționale": "👁️",
  "Interferența localizată": "⭕",
  "Difracția luminii": "✨",
  "Polarizarea luminii": "👓",
  "probleme diverse": "❓",
  // Clasa a 12-a
  "Efectul fotoelectric extern": "💡",
  "Efectul Compton": "⚡",
  "Modelul atomic": "⚛️",
  "Atomul cu mai mulți electroni. Raze X": "🌌",
  "Proprietățile generale ale nucleului atomic": "⭕",
  "Reacții nucleare": "⭐",
  "Radiații nucleare": "✨",
  "Particule elementare": "⚛️",
  "probleme diverse": "❓",
  // Fallback
  "Toate": "📚",
}

export function ProblemFilters({ onFilterChange, totalProblems, filteredCount, onClosePanel }: ProblemFiltersProps) {
  const STORAGE_KEY = "problemFilters"
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "Toate",
    difficulty: "Toate",
    progress: "Toate",
    class: "Toate",
    chapter: "Toate",
  })

  const [selectedClass, setSelectedClass] = useState<string>("Toate")
  const [selectedChapter, setSelectedChapter] = useState<string>("Toate")

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    const applied: FilterState = {
      ...updated,
      class: newFilters.class ?? selectedClass,
      chapter: newFilters.chapter ?? selectedChapter,
    }
    setFilters(applied)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(applied))
    } catch {}
    onFilterChange(applied)
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new Event("problemFiltersUpdated"))
      } catch {}
    }
  }

  const clearFilters = () => {
    const cleared = {
      search: "",
      category: "Toate",
      difficulty: "Toate",
      progress: "Toate",
      class: "Toate",
      chapter: "Toate",
    }
    setFilters(cleared)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    onFilterChange(cleared)
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new Event("problemFiltersUpdated"))
      } catch {}
    }
    onClosePanel?.()
  }

  const hasActiveFilters =
    !!filters.search ||
    filters.difficulty !== "Toate" ||
    filters.progress !== "Toate" ||
    filters.class !== "Toate" ||
    filters.chapter !== "Toate"

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "auto";
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  // Restore saved filters on mount (from this session only)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<FilterState>
      const restored: FilterState = {
        search: parsed.search ?? "",
        category: parsed.category ?? "Toate",
        difficulty: parsed.difficulty ?? "Toate",
        progress: (parsed as any).progress === "Nerezolvate" || (parsed as any).progress === "Rezolvate" ? (parsed as any).progress : "Toate",
        class: parsed.class ?? "Toate",
        chapter: parsed.chapter ?? "Toate",
      }
      setFilters(restored)
      setSelectedClass(restored.class)
      setSelectedChapter(restored.chapter)
      onFilterChange(restored)
    } catch {}
  }, [])

  // Listen for updates triggered from navbar dropdown when already on the problems page
  useEffect(() => {
    const handler = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as Partial<FilterState>
        const restored: FilterState = {
          search: parsed.search ?? "",
          category: parsed.category ?? "Toate",
          difficulty: parsed.difficulty ?? "Toate",
          progress: (parsed as any).progress === "Nerezolvate" || (parsed as any).progress === "Rezolvate" ? (parsed as any).progress : "Toate",
          class: parsed.class ?? "Toate",
          chapter: parsed.chapter ?? "Toate",
        }
        setFilters(restored)
        setSelectedClass(restored.class)
        setSelectedChapter(restored.chapter)
        onFilterChange(restored)
      } catch {}
    }
    window.addEventListener('problemFiltersUpdated', handler)
    return () => window.removeEventListener('problemFiltersUpdated', handler)
  }, [onFilterChange])

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/35">
            Filtre
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Rafinează căutarea
          </h3>
        </div>
        {onClosePanel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClosePanel}
            className="rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-5 text-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Caută după enunț, cod (ex: M003) sau tag-uri..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="h-11 rounded-2xl border-white/10 bg-white/[0.06] pl-11 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/20"
          />
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
              Clasa
            </label>
            <Select
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value)
                setSelectedChapter("Toate")
                updateFilters({ class: value, chapter: "Toate" })
              }}
            >
              <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/[0.06] text-sm text-white">
                <SelectValue placeholder="Selectează clasa" />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-[#1b1b1b] text-white">
                {classOptions.map((cls) => (
                  <SelectItem
                    key={cls}
                    value={cls}
                    className="rounded-xl text-sm text-white/75 focus:bg-white/10 focus:text-white data-[state=checked]:bg-white/10 data-[state=checked]:text-white"
                  >
                    {classIcons[cls]} {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
              Capitol
            </label>
            <Select
              value={selectedChapter}
              onValueChange={(value) => {
                setSelectedChapter(value)
                updateFilters({ chapter: value })
              }}
              disabled={selectedClass === "Toate"}
            >
              <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/[0.06] text-sm text-white disabled:text-white/30">
                <SelectValue placeholder="Selectează capitolul" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px] border border-white/10 bg-[#1b1b1b] text-white">
                {(chapterOptions[selectedClass] || ["Toate"]).map((chap) => (
                  <SelectItem
                    key={chap}
                    value={chap}
                    className="rounded-xl text-sm text-white/75 focus:bg-white/10 focus:text-white data-[state=checked]:bg-white/10 data-[state=checked]:text-white"
                  >
                    <span className="mr-2">{chapterEmojis[chap] || "📘"}</span>
                    {chap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
            Dificultate
          </span>
          <div className="flex flex-wrap gap-2">
            {["Toate", "Ușor", "Mediu", "Avansat"].map((difficulty) => {
              const isActive = filters.difficulty === difficulty
              const difficultyColors = {
                "Toate": {
                  hover: "hover:border-white/40",
                  active: "border-white bg-white text-black hover:bg-white"
                },
                "Ușor": {
                  hover: "hover:border-emerald-500/60 hover:text-emerald-300",
                  active: "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 hover:border-emerald-500/80"
                },
                "Mediu": {
                  hover: "hover:border-amber-500/60 hover:text-amber-300",
                  active: "border-amber-500/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:border-amber-500/80"
                },
                "Avansat": {
                  hover: "hover:border-rose-500/60 hover:text-rose-300",
                  active: "border-rose-500/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 hover:border-rose-500/80"
                }
              }
              const colors = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors["Toate"]
              
              return (
                <Button
                  key={difficulty}
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ difficulty })}
                  className={cn(
                    "rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/65 transition",
                    colors.hover,
                    isActive ? colors.active : "hover:bg-white/12"
                  )}
                >
                  {difficulty}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
            Progres
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(["Toate", "Nerezolvate", "Rezolvate"] as const).map((progressOption) => {
              const isActive = filters.progress === progressOption
              return (
                <Button
                  key={progressOption}
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ progress: progressOption })}
                  className={cn(
                    "rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/65 transition hover:border-white/40 hover:bg-white/12 hover:text-white",
                    progressOption === "Rezolvate" && "col-span-2",
                    isActive && "border-white bg-white text-black hover:bg-white"
                  )}
                >
                  {progressOption}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/60">
        <p>
          Se afișează{" "}
          <span className="font-semibold text-white">
            {filteredCount}
          </span>{" "}
          din{" "}
          <span className="font-semibold text-white/80">
            {totalProblems}
          </span>{" "}
          probleme
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="self-start rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/15 hover:text-white"
          >
            <X className="mr-2 h-3.5 w-3.5" />
            Resetează filtrele
          </Button>
        )}
      </div>
    </div>
  )
}

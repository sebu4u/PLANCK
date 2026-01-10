"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, X, Atom, Users, Award, Star, BookOpen, Check, SlidersHorizontal,
  ArrowRight, TrendingDown, Scale, Circle, Orbit, Zap, Flame, ArrowUpDown, ArrowLeftRight,
  Ruler, Sun, Eye, Glasses, HelpCircle, Thermometer, Battery, GitBranch, Network,
  Waves, Radio, Triangle, Target, Sparkles, Lightbulb, Radiation, AtomIcon
} from "lucide-react"
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

// Monochrome icons for each chapter
import type { LucideIcon } from "lucide-react"

const chapterIcons: Record<string, LucideIcon> = {
  // Clasa a 9-a
  "Miscarea rectilinie si uniforma a punctului material": ArrowRight,
  "Miscarea rectilinie uniform variata": ArrowUpDown,
  "Miscarea punctului material sub actiunea greutatii": TrendingDown,
  "Principiile mecanicii": Scale,
  "Forta de frecare": Circle,
  "Forta elastica": Circle,
  "Legea atractiei universale": Orbit,
  "Miscarea circular uniforma": Orbit,
  "Lucrul mecanic si puterea mecanica": Zap,
  "Energia mecanica": Flame,
  "Impulsul punctului material": ArrowUpDown,
  "Ciocniri plastice si elastice": ArrowLeftRight,
  "Elemente de statica": Ruler,
  "Principiile opticii geometrice": Sun,
  "Lentile": Eye,
  "Instrumente optice": Glasses,
  "Probleme diverse.": HelpCircle,
  // Clasa a 10-a
  "Legea gazului ideal": Thermometer,
  "Lucrul mecanic si energia interna": Zap,
  "Principiul 1 al termodinamicii": Flame,
  "Principiul 2 al termodinamicii": Flame,
  "Calorimetrie": Thermometer,
  "Electrostatica": Zap,
  "Rezistenta electrica. Legea lui Ohm": Battery,
  "Gruparea rezistoarelor": GitBranch,
  "Legile lui Kirchhoff": Network,
  "Energia si puterea electrica": Zap,
  "magnetism": Orbit,
  "probleme diverse.": HelpCircle,
  // Clasa a 11-a
  "Oscilații mecanice. Pendul gravitațional": Waves,
  "Unde mecanice": Waves,
  "circuite de curent alternativ": Zap,
  "Circuite serie de curent alternativ": Zap,
  "Circuite paralele de curent alternativ": GitBranch,
  "Circuite mixte de curent alternativ": Network,
  "Circuit oscilant. Antena": Radio,
  "Prisma optică. Dispersia luminii": Triangle,
  "Interferența luminii. Dispozitivul Young": Target,
  "Dispozitive interferenționale": Eye,
  "Interferența localizată": Circle,
  "Difracția luminii": Sparkles,
  "Polarizarea luminii": Glasses,
  "probleme diverse": HelpCircle,
  // Clasa a 12-a
  "Efectul fotoelectric extern": Lightbulb,
  "Efectul Compton": Zap,
  "Modelul atomic": Atom,
  "Atomul cu mai mulți electroni. Raze X": Radiation,
  "Proprietățile generale ale nucleului atomic": Circle,
  "Reacții nucleare": Atom,
  "Radiații nucleare": Radiation,
  "Particule elementare": Atom,
  // Fallback
  "Toate": BookOpen,
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
    } catch { }
    onFilterChange(applied)
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new Event("problemFiltersUpdated"))
      } catch { }
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
    } catch { }
    onFilterChange(cleared)
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new Event("problemFiltersUpdated"))
      } catch { }
    }
    onClosePanel?.()
  }

  const hasActiveFilters =
    !!filters.search ||
    filters.difficulty !== "Toate" ||
    filters.progress !== "Toate" ||
    filters.class !== "Toate" ||
    filters.chapter !== "Toate"

  // Count active filters for badge
  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.difficulty !== "Toate" ? 1 : 0,
    filters.progress !== "Toate" ? 1 : 0,
    filters.class !== "Toate" ? 1 : 0,
    filters.chapter !== "Toate" ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

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
    } catch { }
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
      } catch { }
    }
    window.addEventListener('problemFiltersUpdated', handler)
    return () => window.removeEventListener('problemFiltersUpdated', handler)
  }, [onFilterChange])

  return (
    <div id="guide-filters-panel-body" className="text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-white/70" />
          <span className="text-base font-semibold text-white">Filtre</span>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          {onClosePanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClosePanel}
              className="h-8 w-8 rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="py-5 border-b border-white/10">
        <label className="block text-sm font-medium text-white mb-3">Căutare</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            id="guide-search-input"
            placeholder="Caută probleme..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="h-10 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/20"
          />
        </div>
      </div>

      {/* Difficulty Section */}
      <div className="py-5 border-b border-white/10" id="guide-difficulty">
        <label className="block text-sm font-medium text-white mb-3">Dificultate</label>
        <div className="space-y-0.5">
          {(["Ușor", "Mediu", "Avansat"] as const).map((difficulty) => {
            const isActive = filters.difficulty === difficulty
            const colors = {
              "Ușor": "text-emerald-400",
              "Mediu": "text-amber-400",
              "Avansat": "text-rose-400"
            }
            return (
              <button
                key={difficulty}
                onClick={() => updateFilters({ difficulty: isActive ? "Toate" : difficulty })}
                className="flex w-full items-center gap-3 py-2 text-left text-sm transition-colors hover:text-white"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                    isActive ? "border-blue-500 bg-blue-500" : "border-white/30"
                  )}
                >
                  {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className={cn("flex-1", colors[difficulty])}>{difficulty}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Class Section */}
      <div className="py-5 border-b border-white/10" id="guide-class-select">
        <label className="block text-sm font-medium text-white mb-3">Clasa</label>
        <div className="flex flex-wrap gap-2">
          {classOptions.map((cls) => {
            const isActive = selectedClass === cls
            return (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClass(cls)
                  setSelectedChapter("Toate")
                  updateFilters({ class: cls, chapter: "Toate" })
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  isActive
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                {cls}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chapter Section - Only shown when a specific class is selected */}
      {selectedClass !== "Toate" && (
        <div className="py-5 border-b border-white/10" id="guide-chapter-select">
          <label className="block text-sm font-medium text-white mb-3">Capitol</label>
          <div className="max-h-[250px] overflow-y-auto space-y-0.5">
            {(chapterOptions[selectedClass] || ["Toate"]).map((chap) => {
              const isActive = selectedChapter === chap
              const ChapterIcon = chapterIcons[chap] || HelpCircle
              return (
                <button
                  key={chap}
                  onClick={() => {
                    setSelectedChapter(chap)
                    updateFilters({ chapter: chap })
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 py-1.5 text-left text-sm transition-colors",
                    isActive ? "text-white" : "text-white/50 hover:text-white/70"
                  )}
                >
                  {/* Checkbox */}
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                      isActive ? "border-blue-500 bg-blue-500" : "border-white/30"
                    )}
                  >
                    {isActive && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  {/* Chapter Icon */}
                  <ChapterIcon className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-white/40"
                  )} />
                  {/* Chapter Name */}
                  <span className="flex-1 leading-snug">{chap}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="py-5 border-b border-white/10">
        <label className="block text-sm font-medium text-white mb-3">Progres</label>
        <div className="space-y-0.5">
          {(["Nerezolvate", "Rezolvate"] as const).map((progressOption) => {
            const isActive = filters.progress === progressOption
            return (
              <button
                key={progressOption}
                onClick={() => updateFilters({ progress: isActive ? "Toate" : progressOption })}
                className="flex w-full items-center gap-3 py-2 text-left text-sm transition-colors hover:text-white"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                    isActive ? "border-blue-500 bg-blue-500" : "border-white/30"
                  )}
                >
                  {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className={cn("flex-1", isActive ? "text-white" : "text-white/60")}>
                  {progressOption}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer - Results count */}
      <div className="pt-5 text-sm text-white/60">
        <p>
          Se afișează{" "}
          <span className="font-semibold text-white">{filteredCount}</span>{" "}
          din{" "}
          <span className="font-semibold text-white/80">{totalProblems}</span>{" "}
          probleme
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 flex items-center gap-1.5 text-xs text-white/50 transition hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Resetează filtrele
          </button>
        )}
      </div>
    </div>
  )
}

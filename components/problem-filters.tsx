"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, X, Atom, Users, Award, Star, BookOpen, Flame, Zap, CircleDot, Circle, Ruler, ArrowUpDown, ArrowDown, ArrowRightLeft, Eye, Sun, Moon, Glasses, HelpCircle } from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"

interface ProblemFiltersProps {
  onFilterChange: (filters: FilterState) => void
  totalProblems: number
  filteredCount: number
}

export interface FilterState {
  search: string
  category: string
  difficulty: string
  isFree: boolean | null
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
  "a 11-a": ["Toate"],
  "a 12-a": ["Toate"]
}

const classIcons: Record<string, React.ReactNode> = {
  "a 9-a": <Users className="w-4 h-4 text-purple-600 mr-2 inline" />,
  "a 10-a": <Atom className="w-4 h-4 text-pink-600 mr-2 inline" />,
  "a 11-a": <Award className="w-4 h-4 text-yellow-600 mr-2 inline" />,
  "a 12-a": <Star className="w-4 h-4 text-blue-600 mr-2 inline" />,
  "Toate": <BookOpen className="w-4 h-4 text-gray-400 mr-2 inline" />,
}

const chapterIcons: Record<string, React.ReactNode> = {
  // 9th grade
  "Miscarea rectilinie si uniforma a punctului material": <ArrowRightLeft className="w-4 h-4 text-purple-500 mr-2 inline" />,
  "Miscarea rectilinie uniform variata": <ArrowUpDown className="w-4 h-4 text-pink-500 mr-2 inline" />,
  "Miscarea punctului material sub actiunea greutatii": <ArrowDown className="w-4 h-4 text-blue-500 mr-2 inline" />,
  "Principiile mecanicii": <Ruler className="w-4 h-4 text-yellow-500 mr-2 inline" />,
  "Forta de frecare": <CircleDot className="w-4 h-4 text-orange-500 mr-2 inline" />,
  "Forta elastica": <Circle className="w-4 h-4 text-green-500 mr-2 inline" />,
  "Legea atractiei universale": <Star className="w-4 h-4 text-indigo-500 mr-2 inline" />,
  "Miscarea circular uniforma": <Circle className="w-4 h-4 text-pink-500 mr-2 inline" />,
  "Lucrul mecanic si puterea mecanica": <Zap className="w-4 h-4 text-yellow-600 mr-2 inline" />,
  "Energia mecanica": <Flame className="w-4 h-4 text-red-500 mr-2 inline" />,
  "Impulsul punctului material": <ArrowUpDown className="w-4 h-4 text-green-600 mr-2 inline" />,
  "Ciocniri plastice si elastice": <ArrowRightLeft className="w-4 h-4 text-orange-600 mr-2 inline" />,
  "Elemente de statica": <Ruler className="w-4 h-4 text-gray-500 mr-2 inline" />,
  "Principiile opticii geometrice": <Sun className="w-4 h-4 text-yellow-400 mr-2 inline" />,
  "Lentile": <Eye className="w-4 h-4 text-blue-400 mr-2 inline" />,
  "Instrumente optice": <Glasses className="w-4 h-4 text-purple-400 mr-2 inline" />,
  "Probleme diverse.": <HelpCircle className="w-4 h-4 text-gray-400 mr-2 inline" />,
  // 10th grade
  "Legea gazului ideal": <Flame className="w-4 h-4 text-orange-500 mr-2 inline" />,
  "Lucrul mecanic si energia interna": <Zap className="w-4 h-4 text-yellow-600 mr-2 inline" />,
  "Principiul 1 al termodinamicii": <Flame className="w-4 h-4 text-red-500 mr-2 inline" />,
  "Principiul 2 al termodinamicii": <Flame className="w-4 h-4 text-pink-500 mr-2 inline" />,
  "Calorimetrie": <Flame className="w-4 h-4 text-orange-400 mr-2 inline" />,
  "Electrostatica": <Zap className="w-4 h-4 text-blue-500 mr-2 inline" />,
  "Rezistenta electrica. Legea lui Ohm": <Zap className="w-4 h-4 text-green-500 mr-2 inline" />,
  "Gruparea rezistoarelor": <Zap className="w-4 h-4 text-purple-500 mr-2 inline" />,
  "Legile lui Kirchhoff": <Zap className="w-4 h-4 text-pink-500 mr-2 inline" />,
  "Energia si puterea electrica": <Zap className="w-4 h-4 text-yellow-500 mr-2 inline" />,
  "magnetism": <Star className="w-4 h-4 text-blue-600 mr-2 inline" />,
  "probleme diverse.": <HelpCircle className="w-4 h-4 text-gray-400 mr-2 inline" />,
  // fallback
  "Toate": <BookOpen className="w-4 h-4 text-gray-400 mr-2 inline" />,
}

export function ProblemFilters({ onFilterChange, totalProblems, filteredCount }: ProblemFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "Toate",
    difficulty: "Toate",
    isFree: null,
    class: "Toate",
    chapter: "Toate",
  })

  const [selectedClass, setSelectedClass] = useState<string>("Toate")
  const [selectedChapter, setSelectedChapter] = useState<string>("Toate")

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFilterChange({
      ...updated,
      class: newFilters.class ?? selectedClass,
      chapter: newFilters.chapter ?? selectedChapter,
    })
  }

  const clearFilters = () => {
    const cleared = {
      search: "",
      category: "Toate",
      difficulty: "Toate",
      isFree: null,
      class: "Toate",
      chapter: "Toate",
    }
    setFilters(cleared)
    onFilterChange(cleared)
  }

  const hasActiveFilters =
    filters.search || filters.difficulty !== "Toate" || filters.isFree !== null

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "auto";
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtrează problemele</h3>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Caută după titlu, cod (ex: M003) sau tag-uri..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10 border-purple-200 focus:border-purple-400"
        />
      </div>

      {/* Class Filter */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Clasa</label>
        <Select value={selectedClass} onValueChange={value => {
          setSelectedClass(value)
          setSelectedChapter("Toate")
          updateFilters({ class: value, chapter: "Toate" })
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Selectează clasa" />
          </SelectTrigger>
          <SelectContent>
            {classOptions.map(cls => (
              <SelectItem key={cls} value={cls}>
                {classIcons[cls]}{cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chapter Filter */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Capitol</label>
        <Select value={selectedChapter} onValueChange={value => {
          setSelectedChapter(value)
          updateFilters({ chapter: value })
        }} disabled={selectedClass === "Toate"}>
          <SelectTrigger>
            <SelectValue placeholder="Selectează capitolul" />
          </SelectTrigger>
          <SelectContent>
            {(chapterOptions[selectedClass] || ["Toate"]).map(chap => (
              <SelectItem key={chap} value={chap}>
                {chapterIcons[chap] || chapterIcons["Toate"]}{chap}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Dificultate</label>
        <div className="flex flex-wrap gap-2">
          {["Toate", "Ușor", "Mediu", "Avansat"].map((difficulty) => (
            <Button
              key={difficulty}
              variant={filters.difficulty === difficulty ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ difficulty })}
              className={
                filters.difficulty === difficulty
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "border-purple-200 hover:border-purple-400 hover:text-purple-600"
              }
            >
              {difficulty}
            </Button>
          ))}
        </div>
      </div>

      {/* Free/Premium Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Acces</label>
        <div className="flex gap-2">
          <Button
            variant={filters.isFree === null ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ isFree: null })}
            className={
              filters.isFree === null
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "border-purple-200 hover:border-purple-400 hover:text-purple-600"
            }
          >
            Toate
          </Button>
          <Button
            variant={filters.isFree === true ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ isFree: true })}
            className={
              filters.isFree === true
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
                : "border-green-200 hover:border-green-400 hover:text-green-600"
            }
          >
            Gratuite
          </Button>
          <Button
            variant={filters.isFree === false ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ isFree: false })}
            className={
              filters.isFree === false
                ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white"
                : "border-orange-200 hover:border-orange-400 hover:text-orange-600"
            }
          >
            Premium
          </Button>
        </div>
      </div>

      {/* Results Count and Reset Button */}
      <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Se afișează <span className="font-semibold text-purple-600">{filteredCount}</span> din{" "}
          <span className="font-semibold">{totalProblems}</span> probleme
        </p>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="border-purple-300 hover:border-purple-500 hover:text-purple-600"
          >
            <X className="w-4 h-4 mr-1" />
            Resetează filtrele
          </Button>
        )}
      </div>
    </div>
  )
}

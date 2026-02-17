"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, List, Search, Filter, Users, Atom, Award, Star, BookOpen, ArrowRightLeft, ArrowUpDown, ArrowDown, Ruler, CircleDot, Circle, Zap, Flame, Eye, Glasses, HelpCircle, Sun, Waves, Radio, Lightbulb, Orbit, Target, Sparkles } from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { Problem } from "@/data/problems"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProblemsSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentProblemId: string
}

interface FilterState {
  search: string
  chapter: string
  class: string
}

const classOptions = ["Toate", "a 9-a", "a 10-a", "a 11-a", "a 12-a"]

const classIcons: Record<string, React.ReactNode> = {
  "a 9-a": <Users className="w-4 h-4 text-purple-600 mr-2 inline" />,
  "a 10-a": <Atom className="w-4 h-4 text-pink-600 mr-2 inline" />,
  "a 11-a": <Award className="w-4 h-4 text-yellow-600 mr-2 inline" />,
  "a 12-a": <Star className="w-4 h-4 text-blue-600 mr-2 inline" />,
  "Toate": <BookOpen className="w-4 h-4 text-gray-400 mr-2 inline" />,
}

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
  // 11th grade
  "Oscilații mecanice. Pendul gravitațional": <Waves className="w-4 h-4 text-green-500 mr-2 inline" />,
  "Unde mecanice": <Waves className="w-4 h-4 text-blue-500 mr-2 inline" />,
  "circuite de curent alternativ": <Zap className="w-4 h-4 text-orange-500 mr-2 inline" />,
  "Circuite serie de curent alternativ": <Zap className="w-4 h-4 text-red-500 mr-2 inline" />,
  "Circuite paralele de curent alternativ": <Zap className="w-4 h-4 text-purple-500 mr-2 inline" />,
  "Circuite mixte de curent alternativ": <Zap className="w-4 h-4 text-pink-500 mr-2 inline" />,
  "Circuit oscilant. Antena": <Radio className="w-4 h-4 text-indigo-500 mr-2 inline" />,
  "Prisma optică. Dispersia luminii": <Sun className="w-4 h-4 text-yellow-500 mr-2 inline" />,
  "Interferența luminii. Dispozitivul Young": <Target className="w-4 h-4 text-blue-400 mr-2 inline" />,
  "Dispozitive interferenționale": <Eye className="w-4 h-4 text-purple-400 mr-2 inline" />,
  "Interferența localizată": <CircleDot className="w-4 h-4 text-green-400 mr-2 inline" />,
  "Difracția luminii": <Sparkles className="w-4 h-4 text-yellow-400 mr-2 inline" />,
  "Polarizarea luminii": <Glasses className="w-4 h-4 text-pink-400 mr-2 inline" />,
  "probleme diverse": <HelpCircle className="w-4 h-4 text-gray-400 mr-2 inline" />,
  // 12th grade
  "Efectul fotoelectric extern": <Lightbulb className="w-4 h-4 text-yellow-600 mr-2 inline" />,
  "Efectul Compton": <Zap className="w-4 h-4 text-blue-600 mr-2 inline" />,
  "Modelul atomic": <Atom className="w-4 h-4 text-green-600 mr-2 inline" />,
  "Atomul cu mai mulți electroni. Raze X": <Orbit className="w-4 h-4 text-purple-600 mr-2 inline" />,
  "Proprietățile generale ale nucleului atomic": <CircleDot className="w-4 h-4 text-red-600 mr-2 inline" />,
  "Reacții nucleare": <Star className="w-4 h-4 text-orange-600 mr-2 inline" />,
  "Radiații nucleare": <Sparkles className="w-4 h-4 text-red-500 mr-2 inline" />,
  "Particule elementare": <Atom className="w-4 h-4 text-indigo-600 mr-2 inline" />,
  // fallback
  "Toate": <BookOpen className="w-4 h-4 text-gray-400 mr-2 inline" />,
}

const difficultyColors = {
  Ușor: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  Mediu: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  Avansat: "border-rose-500/40 bg-rose-500/15 text-rose-200"
}

export function ProblemsSidebar({ isOpen, onClose, currentProblemId }: ProblemsSidebarProps) {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    chapter: "Toate",
    class: "Toate"
  })
  const router = useRouter()

  // Fetch problems when sidebar opens
  useEffect(() => {
    if (isOpen && problems.length === 0) {
      fetchProblems()
    }
  }, [isOpen])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const fetchProblems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (!error && data) {
        setProblems(data)
      }
    } catch (error) {
      console.error('Error fetching problems:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = problem.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           problem.id.toLowerCase().includes(filters.search.toLowerCase())
      
      // Chapter filtering only applies when a specific class is selected
      const matchesChapter = filters.class === "Toate" || filters.chapter === "Toate" || problem.category === filters.chapter
      
      const matchesClass = filters.class === "Toate" || problem.class.toString() === filters.class.replace("a ", "").replace("-a", "")
      
      return matchesSearch && matchesChapter && matchesClass
    })
  }, [problems, filters])

  const handleProblemClick = (problemId: string) => {
    router.push(`/probleme/${problemId}`)
    onClose()
  }

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + "..."
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[350] bg-black/50 backdrop-blur-sm transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-[360] bg-[#121212] text-white
        transform transition-transform duration-300 ease-out
        ${isOpen
          ? 'translate-x-0 border-r border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.65)]'
          : '-translate-x-full border-r border-transparent shadow-none'
        }
        w-[380px] max-w-[85vw]
      `}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Toate problemele</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3 border-b border-white/10 p-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white/40" />
            <Input
              placeholder="Caută probleme..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Class and Category filters */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={filters.class}
              onValueChange={(value) => {
                setFilters(prev => ({ 
                  ...prev, 
                  class: value,
                  chapter: "Toate" // Reset chapter when class changes
                }))
              }}
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Clasa" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {classIcons[option]}
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.chapter}
              onValueChange={(value) => setFilters(prev => ({ ...prev, chapter: value }))}
              disabled={filters.class === "Toate"}
            >
              <SelectTrigger className={cn(
                "border-white/10 bg-white/5 text-white",
                filters.class === "Toate" && "cursor-not-allowed opacity-40"
              )}>
                <SelectValue placeholder="Capitolul" />
              </SelectTrigger>
              <SelectContent>
                {filters.class === "Toate" ? (
                  <SelectItem value="Toate">
                    {chapterIcons["Toate"]}
                    Toate
                  </SelectItem>
                ) : (
                  chapterOptions[filters.class]?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {chapterIcons[option] || chapterIcons["Toate"]}
                      {option}
                    </SelectItem>
                  )) || []
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Results count */}
          <div className="text-center text-sm text-white/50">
            {filteredProblems.length} probleme găsite
          </div>
        </div>

        {/* Problems List */}
        <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 rounded-lg bg-white/10"></div>
                </div>
              ))
            ) : filteredProblems.length === 0 ? (
              <div className="py-8 text-center text-white/60">
                <Filter className="mx-auto mb-3 h-12 w-12 text-white/30" />
                <p>Nu s-au găsit probleme cu filtrele selectate</p>
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => handleProblemClick(problem.id)}
                  className={`
                    cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200
                    hover:border-white/30 hover:bg-white/10 hover:shadow-lg
                    ${problem.id === currentProblemId 
                      ? 'border-emerald-400/60 bg-emerald-500/15 shadow-lg' 
                      : ''
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="min-w-0 flex-1 font-medium leading-tight text-white">
                      {truncateTitle(problem.title)}
                    </h3>
                    
                    {/* Problem ID with difficulty color */}
                    <Badge 
                      className={`
                        ${difficultyColors[problem.difficulty as keyof typeof difficultyColors] || 'border-white/20 bg-white/10 text-white'}
                        min-w-[3rem] border font-mono text-xs text-center
                      `}
                    >
                      {problem.id}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

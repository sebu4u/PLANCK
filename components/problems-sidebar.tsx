"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, List, Search, Filter, Users, Atom, Award, Star, BookOpen, ArrowRightLeft, ArrowUpDown, ArrowDown, Ruler, CircleDot, Circle, Zap, Flame, Eye, Glasses, HelpCircle, Sun } from "lucide-react"
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
  "a 11-a": ["Toate"],
  "a 12-a": ["Toate"]
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

const difficultyColors = {
  Ușor: "bg-green-100 text-green-800 border-green-200",
  Mediu: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Avansat: "bg-red-100 text-red-800 border-red-200"
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
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-400 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full z-50 bg-white shadow-2xl border-l
        transform transition-all duration-400 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-[400px] max-w-[80vw] sm:w-[400px]
        ${isOpen ? 'opacity-100' : 'opacity-95'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Toate problemele</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Caută probleme..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
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
              <SelectTrigger>
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
              <SelectTrigger className={filters.class === "Toate" ? "opacity-50 cursor-not-allowed" : ""}>
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
          <div className="text-sm text-gray-500 text-center">
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
                  <div className="h-12 bg-gray-100 rounded-lg"></div>
                </div>
              ))
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nu s-au găsit probleme cu filtrele selectate</p>
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => handleProblemClick(problem.id)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all duration-200
                    hover:shadow-md hover:border-purple-300 hover:bg-purple-50/50
                    ${problem.id === currentProblemId 
                      ? 'border-purple-400 bg-purple-100/50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-purple-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium text-gray-900 leading-tight flex-1 min-w-0">
                      {truncateTitle(problem.title)}
                    </h3>
                    
                    {/* Problem ID with difficulty color */}
                    <Badge 
                      className={`
                        ${difficultyColors[problem.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800 border-gray-200'}
                        font-mono text-xs px-2 py-1 min-w-[3rem] text-center
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

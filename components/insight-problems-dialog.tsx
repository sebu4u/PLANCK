"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { Problem } from "@/data/problems"
import { ScrollArea } from "@/components/ui/scroll-area"

interface InsightProblemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProblem: (problemText: string) => void
}

export default function InsightProblemsDialog({
  open,
  onOpenChange,
  onSelectProblem,
}: InsightProblemsDialogProps) {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredProblemId, setHoveredProblemId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showStatement, setShowStatement] = useState<string | null>(null)

  const difficultyColors = {
    Ușor: "bg-green-100 text-green-800 border-green-200",
    Mediu: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Avansat: "bg-red-100 text-red-800 border-red-200",
  }

  useEffect(() => {
    if (open && problems.length === 0) {
      fetchProblems()
    }
  }, [open])

  useEffect(() => {
    // Clear timeout on unmount
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

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
      console.error("Error fetching problems:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProblems = problems.filter((problem) => {
    const query = searchQuery.toLowerCase()
    return (
      problem.id.toLowerCase().includes(query) ||
      problem.title.toLowerCase().includes(query) ||
      problem.difficulty.toLowerCase().includes(query)
    )
  })

  const handleProblemHover = (problemId: string, statement: string) => {
    // Clear existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }

    setHoveredProblemId(problemId)

    // Set new timeout to show statement after 1s
    const timeout = setTimeout(() => {
      setShowStatement(statement)
    }, 1000)

    setHoverTimeout(timeout)
  }

  const handleProblemLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    setHoveredProblemId(null)
    setShowStatement(null)
  }

  const handleProblemClick = (problem: Problem) => {
    const problemText = `Rezolva urmatoarea problema\n\n${problem.statement}`
    onSelectProblem(problemText)
    onOpenChange(false)
    setSearchQuery("")
    setShowStatement(null)
    setHoveredProblemId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#141414] border-gray-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Selectează o problemă</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Caută după ID, titlu sau dificultate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#212121] border-gray-600 text-white placeholder:text-gray-400 pl-10"
            />
          </div>

          {/* Problems List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredProblems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nu s-au găsit probleme.
                  </div>
                ) : (
                  filteredProblems.map((problem) => (
                    <div
                      key={problem.id}
                      className="relative"
                      onMouseEnter={() =>
                        handleProblemHover(problem.id, problem.statement)
                      }
                      onMouseLeave={handleProblemLeave}
                    >
                      <button
                        onClick={() => handleProblemClick(problem)}
                        className="w-full text-left p-4 bg-[#212121] border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-400 font-mono">
                                {problem.id}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded border ${
                                  difficultyColors[
                                    problem.difficulty as keyof typeof difficultyColors
                                  ] || "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                {problem.difficulty}
                              </span>
                            </div>
                            <h3 className="text-white font-medium">
                              {problem.title}
                            </h3>
                            {hoveredProblemId === problem.id &&
                              showStatement === problem.statement && (
                                <div className="mt-2 p-2 bg-[#141414] border border-gray-600 rounded text-sm text-gray-300">
                                  <p className="whitespace-pre-wrap">
                                    {problem.statement}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


"use client"

import { useEffect, useRef, useState, Suspense, lazy, useCallback, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProblemFilters, type FilterState } from "@/components/problem-filters"
import { supabase } from "@/lib/supabaseClient"
import { Problem } from "@/data/problems"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Atom } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationEllipsis } from "@/components/ui/pagination"
import { useAuth } from "@/components/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load ProblemCard component
const ProblemCard = lazy(() => import("@/components/problem-card").then(module => ({ default: module.ProblemCard })))

const PROBLEMS_PER_PAGE = 8

const CLASS_MAP: Record<number, string> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a"
};

// Loading skeleton for problem cards
function ProblemCardSkeleton() {
  return (
    <div className="h-full flex flex-col border-0 shadow-xl bg-gradient-to-br from-white/80 via-purple-50 to-pink-50 backdrop-blur-md rounded-lg p-6">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-16 h-6 rounded" />
        <Skeleton className="w-20 h-6 rounded" />
      </div>
      <Skeleton className="w-full h-6 mb-2 rounded" />
      <Skeleton className="w-3/4 h-4 mb-4 rounded" />
      <div className="flex flex-wrap gap-1 mt-2">
        <Skeleton className="w-12 h-5 rounded-full" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="flex-1"></div>
      <Skeleton className="w-full h-10 mt-4 rounded-lg" />
    </div>
  )
}

// Cache for problems data
const problemsCache = new Map<string, { data: Problem[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function ProblemsPage() {
  const { user } = useAuth();
  const didMountRef = useRef(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "Toate",
    difficulty: "Toate",
    progress: "Toate",
    class: "Toate",
    chapter: "Toate",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])
  const [visibleProblems, setVisibleProblems] = useState<Problem[]>([])

  // Memoized fetch function with caching
  const fetchProblems = useCallback(async () => {
    const cacheKey = 'all-problems'
    const cached = problemsCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProblems(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (!error && data) {
        // Mapăm numeric class la string pentru filtrare
        const mapped = data.map((problem: any) => ({
          ...problem,
          classString: CLASS_MAP[problem.class] || "Toate"
        }))
        
        // Cache the data
        problemsCache.set(cacheKey, { data: mapped, timestamp: Date.now() })
        setProblems(mapped)
      }
    } catch (error) {
      console.error('Error fetching problems:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized fetch solved problems
  const fetchSolvedProblems = useCallback(async () => {
    if (!user) {
      setSolvedProblems([])
      return
    }

    try {
      const { data } = await supabase
        .from('solved_problems')
        .select('problem_id')
        .eq('user_id', user.id)
      
      setSolvedProblems(data ? data.map((row: any) => row.problem_id) : [])
    } catch (error) {
      console.error('Error fetching solved problems:', error)
      setSolvedProblems([])
    }
  }, [user])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  useEffect(() => {
    fetchSolvedProblems()
  }, [fetchSolvedProblems])

  // Memoized filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          problem.title.toLowerCase().includes(searchLower) ||
          problem.statement.toLowerCase().includes(searchLower) ||
          problem.id.toLowerCase().includes(searchLower) ||
          (problem.tags && (
            Array.isArray(problem.tags)
              ? problem.tags.some((tag) => tag.toLowerCase().includes(searchLower))
              : problem.tags.toLowerCase().includes(searchLower)
          ))
        if (!matchesSearch) return false
      }
      // Class filter (normalize)
      if (
        filters.class &&
        filters.class !== "Toate" &&
        problem.classString?.trim().toLowerCase() !== filters.class.trim().toLowerCase()
      ) {
        return false
      }
      // Chapter filter (normalize)
      if (
        filters.chapter &&
        filters.chapter !== "Toate" &&
        problem.category?.trim().toLowerCase() !== filters.chapter.trim().toLowerCase()
      ) {
        return false
      }
      // Difficulty filter
      if (filters.difficulty !== "Toate" && problem.difficulty !== filters.difficulty) {
        return false
      }
      // Progress filter (Rezolvate / Nerezolvate)
      if (filters.progress === "Rezolvate" && !solvedProblems.includes(problem.id)) return false
      if (filters.progress === "Nerezolvate" && solvedProblems.includes(problem.id)) return false
      return true
    })
  }, [problems, filters, solvedProblems])

  // Memoized sorted problems
  const sortedProblems = useMemo(() => {
    // Check if no filters are applied (default state)
    const noFiltersApplied = 
      !filters.search && 
      filters.category === "Toate" && 
      filters.difficulty === "Toate" && 
      filters.progress === "Toate" && 
      filters.class === "Toate" && 
      filters.chapter === "Toate"

    // If no filters are applied, show the 8 specific problems in the specified order
    if (noFiltersApplied) {
      const featuredProblemIds = ["M008", "T001", "M033", "T004", "M025", "T014", "M071", "T034"]
      
      // Create a map for quick lookup of featured problems
      const featuredProblemsMap = new Map()
      const otherProblems: Problem[] = []
      
      // Separate featured problems from others
      filteredProblems.forEach(problem => {
        if (featuredProblemIds.includes(problem.id)) {
          featuredProblemsMap.set(problem.id, problem)
        } else {
          otherProblems.push(problem)
        }
      })
      
      // Create the result array with featured problems in the specified order
      const result: Problem[] = []
      featuredProblemIds.forEach(id => {
        const problem = featuredProblemsMap.get(id)
        if (problem) {
          result.push(problem)
        }
      })
      
      // Add remaining problems after the featured ones
      result.push(...otherProblems)
      
      return result
    }

    // If filters are applied, use the original sorting logic
    const difficultyOrder: Record<string, number> = { "Ușor": 1, "Mediu": 2, "Avansat": 3 }
    const hasAnyYoutube = filteredProblems.some((p) => typeof p.youtube_url === 'string' && p.youtube_url.trim() !== '')
    
    return [...filteredProblems].sort((a, b) => {
      const aSolved = solvedProblems.includes(a.id)
      const bSolved = solvedProblems.includes(b.id)
      if (aSolved !== bSolved) return aSolved ? 1 : -1
      if (hasAnyYoutube) {
        const aHas = typeof a.youtube_url === 'string' && a.youtube_url.trim() !== ''
        const bHas = typeof b.youtube_url === 'string' && b.youtube_url.trim() !== ''
        if (aHas !== bHas) return aHas ? -1 : 1
      }
      const aRank = difficultyOrder[a.difficulty] ?? 99
      const bRank = difficultyOrder[b.difficulty] ?? 99
      if (aRank !== bRank) return aRank - bRank
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return bTime - aTime
    })
  }, [filteredProblems, solvedProblems, filters])

  // Memoized pagination data
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(sortedProblems.length / PROBLEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE
    const paginatedProblems = sortedProblems.slice(startIndex, startIndex + PROBLEMS_PER_PAGE)
    
    return {
      totalPages,
      paginatedProblems,
      startIndex,
      endIndex: startIndex + PROBLEMS_PER_PAGE
    }
  }, [sortedProblems, currentPage])

  // Lazy load problems with intersection observer
  useEffect(() => {
    setVisibleProblems(paginationData.paginatedProblems.slice(0, 4)) // Initially show only first 4
    
    const timer = setTimeout(() => {
      setVisibleProblems(paginationData.paginatedProblems) // Load all after a short delay
    }, 100)

    return () => clearTimeout(timer)
  }, [paginationData.paginatedProblems])

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  // On page change, jump to the top of the catalog (no animation)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [currentPage])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Atom className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Catalog de Probleme
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explorează colecția noastră de probleme de fizică organizate pe categorii și dificultăți
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{problems.length} probleme gratuite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>{problems.length} total probleme</span>
              </div>
            </div>
          </div>
        </section>
        {/* Main Content */}
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProblemFilters
                  onFilterChange={handleFilterChange}
                  totalProblems={problems.length}
                  filteredCount={filteredProblems.length}
                />
              </div>
            </div>
            {/* Problems Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <ProblemCardSkeleton key={index} />
                  ))}
                </div>
              ) : visibleProblems.length > 0 ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2 mb-8">
                    {visibleProblems.map((problem) => (
                      <Suspense key={problem.id} fallback={<ProblemCardSkeleton />}>
                        <ProblemCard problem={problem} solved={solvedProblems.includes(problem.id)} />
                      </Suspense>
                    ))}
                  </div>
                  {/* Pagination */}
                  <div className="flex justify-center gap-4 mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </PaginationItem>
                        {/* Smart numeric pagination */}
                        {(() => {
                          const pages = [];
                          const neighbor = 1;
                          const { totalPages } = paginationData;
                          
                          if (totalPages <= 3) {
                            // Pentru 2 sau 3 pagini, afișează-le pe toate
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(
                                <PaginationItem key={i}>
                                  <Button
                                    variant={i === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i)}
                                    className={i === currentPage ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                                  >
                                    {i}
                                  </Button>
                                </PaginationItem>
                              );
                            }
                          } else {
                            // Pentru mai multe pagini, logica cu vecini și ellipsis
                            // Always show first page
                            if (currentPage > 1 + neighbor + 1) {
                              pages.push(
                                <PaginationItem key={1}>
                                  <Button
                                    variant={1 === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    className={1 === currentPage ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                                  >
                                    1
                                  </Button>
                                </PaginationItem>
                              );
                              pages.push(<PaginationEllipsis key="start-ellipsis" />);
                            } else {
                              for (let i = 1; i < Math.max(2, currentPage - neighbor); i++) {
                                pages.push(
                                  <PaginationItem key={i}>
                                    <Button
                                      variant={i === currentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(i)}
                                      className={i === currentPage ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                                    >
                                      {i}
                                    </Button>
                                  </PaginationItem>
                                );
                              }
                            }
                            // Show neighbors and current
                            for (let i = Math.max(1, currentPage - neighbor); i <= Math.min(totalPages, currentPage + neighbor); i++) {
                              if (i === 1 || i === totalPages) continue;
                              pages.push(
                                <PaginationItem key={i}>
                                  <Button
                                    variant={i === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i)}
                                    className={i === currentPage ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                                  >
                                    {i}
                                  </Button>
                                </PaginationItem>
                              );
                            }
                            // Always show last page
                            if (currentPage < totalPages - neighbor - 1) {
                              pages.push(<PaginationEllipsis key="end-ellipsis" />);
                              pages.push(
                                <PaginationItem key={totalPages}>
                                  <Button
                                    variant={totalPages === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={totalPages === currentPage ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                                  >
                                    {totalPages}
                                  </Button>
                                </PaginationItem>
                              );
                            } else {
                              for (let i = currentPage + neighbor + 1; i <= totalPages; i++) {
                                pages.push(
                                  <PaginationItem key={i}>
                                    <Button
                                      variant={i === currentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(i)}
                                      className={i === currentPage ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                                    >
                                      {i}
                                    </Button>
                                  </PaginationItem>
                                );
                              }
                            }
                          }
                          return pages;
                        })()}
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(paginationData.totalPages, p + 1))}
                            disabled={currentPage === paginationData.totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nu s-au găsit probleme care să corespundă filtrelor selectate.</p>
                  <Button
                    onClick={() => setFilters({
                      search: "",
                      category: "Toate",
                      difficulty: "Toate",
                      progress: "Toate",
                      class: "Toate",
                      chapter: "Toate",
                    })}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  >
                    Resetează filtrele
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

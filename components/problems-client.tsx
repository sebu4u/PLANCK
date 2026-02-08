'use client'

import { useEffect, useRef, useState, Suspense, lazy, useCallback, useMemo } from "react"
import { Problem } from "@/data/problems"
import { ProblemFilters, type FilterState } from "@/components/problem-filters"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, SlidersHorizontal, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationEllipsis } from "@/components/ui/pagination"
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { ALLOW_ALL_PHYSICS_PROBLEMS } from "@/lib/access-config"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProblemCardSkeleton } from "@/components/problems/problem-card-skeleton"


// Lazy load ProblemCard component
const ProblemCard = lazy(() => import("@/components/problem-card").then(module => ({ default: module.ProblemCard })))

const PROBLEMS_PER_PAGE = 8

const CLASS_MAP: Record<number, string> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a"
};

// Cache for problems data (client-side)
const problemsCache = new Map<string, { data: Problem[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const MONTHLY_FREE_PROBLEM_COUNT = 50
const INSIGHT_PROMO_DISMISSED_KEY = "probleme-insight-promo-dismissed"

const getCurrentMonthKey = () => {
  const now = new Date()
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0")
  return `${now.getUTCFullYear()}-${month}`
}

const scoreProblemForMonth = (problemId: string, monthKey: string) => {
  const input = `${monthKey}:${problemId}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  const unsigned = hash >>> 0
  return unsigned / 0xffffffff
}

interface ProblemsClientProps {
  initialProblems: Problem[]
  initialPage?: number
  initialMonthlyFreeSet?: string[]
}

export default function ProblemsClient({ initialProblems, initialPage = 1, initialMonthlyFreeSet = [] }: ProblemsClientProps) {
  const { user } = useAuth();
  const { isFree, isPaid } = useSubscriptionPlan()
  const didMountRef = useRef(false)
  const isMobile = useIsMobile()
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "Toate",
    difficulty: "Toate",
    progress: "Toate",
    class: "Toate",
    chapter: "Toate",
  })
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [problems, setProblems] = useState<Problem[]>(initialProblems || [])
  const [loading, setLoading] = useState(!initialProblems || initialProblems.length === 0)
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])
  const [visibleProblems, setVisibleProblems] = useState<Problem[]>([])
  const [showInsightPromoCard, setShowInsightPromoCard] = useState(false)


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
        // Map numeric class to string for filtering
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

  // Use initial data; fetch only if not provided
  useEffect(() => {
    if (!initialProblems || initialProblems.length === 0) {
      fetchProblems()
    } else {
      // Normalize initial problems (ensure classString is present)
      const normalized = initialProblems.map((problem: any) => ({
        ...problem,
        classString: CLASS_MAP[problem.class as number] || "Toate",
      }))
      setProblems(normalized)
      setLoading(false)
      // Seed client cache too
      problemsCache.set('all-problems', { data: normalized, timestamp: Date.now() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    fetchSolvedProblems()
  }, [fetchSolvedProblems])

  // Check if screen is large enough to show the left panel (>= 1024px)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Memoized filtered problems
  const filteredProblems = useMemo(() => {
    const result = problems.filter((problem) => {
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

    // Generate placeholders if no problems found
    if (result.length === 0 && !filters.search) {
      const currentClass = filters.class !== "Toate" ? filters.class : "Fizică"
      const currentChapter = filters.chapter !== "Toate" ? filters.chapter : "General"

      const placeholders: Problem[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `PREMIUM-PLACEHOLDER-${i}`,
        title: `Problemă Avansată - ${currentChapter} #${i + 1}`,
        description: "Această problemă face parte din colecția premium.",
        statement: "Conținut exclusiv pentru abonații Premium.",
        difficulty: "Avansat",
        category: currentChapter,
        tags: "Premium, Exclusiv",
        youtube_url: "",
        created_at: new Date().toISOString(),
        classString: currentClass,
        // Proprietate pe care o detectăm la randare
        isPlaceholder: true
      } as any))

      return placeholders
    }

    return result
  }, [problems, filters, solvedProblems])

  // Folosește set-ul primit de la server (care include selecțiile manuale dacă există)
  const monthlyFreeSet = useMemo(() => {
    if (initialMonthlyFreeSet.length > 0) {
      return new Set(initialMonthlyFreeSet)
    }
    // Fallback la calculul local dacă nu avem date de la server
    if (!problems.length) return new Set<string>()
    const monthKey = getCurrentMonthKey()
    const scored = problems.map((problem) => ({
      id: problem.id,
      score: scoreProblemForMonth(problem.id, monthKey),
    }))
    scored.sort((a, b) => a.score - b.score)
    const slice = scored.slice(0, Math.min(MONTHLY_FREE_PROBLEM_COUNT, scored.length))
    return new Set(slice.map((item) => item.id))
  }, [initialMonthlyFreeSet, problems])

  // Memoized sorted problems
  const sortedProblems = useMemo(() => {
    const noFiltersApplied =
      !filters.search &&
      filters.category === "Toate" &&
      filters.difficulty === "Toate" &&
      filters.progress === "Toate" &&
      filters.class === "Toate" &&
      filters.chapter === "Toate"

    const isFreeOnly = isFree && !isPaid

    // Pentru utilizatorii PLĂTIȚI păstrăm comportamentul existent de featured problems
    if (noFiltersApplied && !isFreeOnly) {
      const featuredProblemIds = ["M008", "T001", "M033", "T004", "M025", "T014", "M071", "T034"]
      const featuredProblemsMap = new Map()
      const otherProblems: Problem[] = []
      filteredProblems.forEach(problem => {
        if (featuredProblemIds.includes(problem.id)) {
          featuredProblemsMap.set(problem.id, problem)
        } else {
          otherProblems.push(problem)
        }
      })
      const result: Problem[] = []
      featuredProblemIds.forEach(id => {
        const problem = featuredProblemsMap.get(id)
        if (problem) {
          result.push(problem)
        }
      })
      result.push(...otherProblems)
      return result
    }

    const difficultyOrder: Record<string, number> = { "Ușor": 1, "Mediu": 2, "Avansat": 3 }
    const hasAnyYoutube = filteredProblems.some((p) => typeof p.youtube_url === 'string' && p.youtube_url.trim() !== '')

    return [...filteredProblems].sort((a, b) => {
      // 1) Pentru utilizatorii Free: problemele din rotația lunară ies primele
      if (isFreeOnly) {
        const aFree = monthlyFreeSet.has(a.id)
        const bFree = monthlyFreeSet.has(b.id)
        if (aFree !== bFree) {
          return aFree ? -1 : 1
        }
      }

      // 2) Apoi logica existentă: nerezolvate înainte de rezolvate
      const aSolved = solvedProblems.includes(a.id)
      const bSolved = solvedProblems.includes(b.id)
      if (aSolved !== bSolved) return aSolved ? 1 : -1

      // 3) Probleme cu video înainte
      if (hasAnyYoutube) {
        const aHas = typeof a.youtube_url === 'string' && a.youtube_url.trim() !== ''
        const bHas = typeof b.youtube_url === 'string' && b.youtube_url.trim() !== ''
        if (aHas !== bHas) return aHas ? -1 : 1
      }

      // 4) Dificultate (Ușor -> Mediu -> Avansat)
      const aRank = difficultyOrder[a.difficulty] ?? 99
      const bRank = difficultyOrder[b.difficulty] ?? 99
      if (aRank !== bRank) return aRank - bRank

      // 5) Mai noi înainte
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return bTime - aTime
    })
  }, [filteredProblems, solvedProblems, filters, isFree, isPaid, monthlyFreeSet])

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

  // Lazy load problems with small delay
  useEffect(() => {
    setVisibleProblems(paginationData.paginatedProblems.slice(0, 4))
    const timer = setTimeout(() => {
      setVisibleProblems(paginationData.paginatedProblems)
    }, 100)
    return () => clearTimeout(timer)
  }, [paginationData.paginatedProblems])

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [currentPage])

  // Show Insight promo card on catalog entry unless user previously dismissed it
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(INSIGHT_PROMO_DISMISSED_KEY)
      if (dismissed !== "true") setShowInsightPromoCard(true)
    } catch {
      setShowInsightPromoCard(true)
    }
  }, [])

  const dismissInsightPromo = useCallback(() => {
    setShowInsightPromoCard(false)
    try {
      localStorage.setItem(INSIGHT_PROMO_DISMISSED_KEY, "true")
    } catch {
      // ignore
    }
  }, [])

  return (
    <>

      <div className="space-y-8 -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16 xl:-mx-20 xl:px-20 overflow-x-hidden">
        {/* Mobile Filters Sheet */}
        {(isMobile || !isLargeScreen) && (
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent
              side="right"
              className="w-[70%] max-w-[320px] border-l border-white/10 bg-[#141414] text-white p-0 flex flex-col"
            >
              {/* Header */}
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/10">
                <SheetTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-white/70" />
                  Filtre
                </SheetTitle>
              </SheetHeader>

              {/* Scrollable Filters Area */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <ProblemFilters
                  onFilterChange={(newFilters) => {
                    handleFilterChange(newFilters)
                  }}
                  totalProblems={problems.length}
                  filteredCount={filteredProblems.length}
                  showSearch={false}
                  showChapterHintWhenAllClasses
                />
              </div>

              {/* Fixed Bottom Button */}
              <div className="px-5 py-4 border-t border-white/10 bg-[#141414]">
                <Button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full rounded-full bg-white py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
                >
                  Aplică filtrele
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        <div className="grid gap-8 lg:grid-cols-[320px,minmax(0,1fr)] lg:items-start">
          {!isMobile && (
            <div className="hidden lg:block">
              <div className="sticky top-28">
                <ProblemFilters
                  onFilterChange={handleFilterChange}
                  totalProblems={problems.length}
                  filteredCount={filteredProblems.length}
                />
              </div>
            </div>
          )}

          <div>
            {/* Insight promo card - alb, fără overlay, închidibil (doar desktop/tabletă) */}
            {!isMobile && showInsightPromoCard && (
              <div className="mb-6 relative rounded-2xl border border-gray-200 bg-white p-5 pr-10 shadow-sm">
                <button
                  type="button"
                  onClick={dismissInsightPromo}
                  className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                  aria-label="Închide"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Poți înțelege problemele și fără profesor
                  </h3>
                  <p className="text-sm text-gray-600">
                    Insight te poate ghida pas cu pas pe fiecare problemă, ca un profesor răbdător care îți explică logica, nu doar rezultatul.
                  </p>
                </div>
              </div>
            )}

            {/* Mobile Search & Filters */}
            {(isMobile || !isLargeScreen) && (
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                {/* Mobile Search Bar */}
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    placeholder="Caută probleme..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                    className="h-10 w-full rounded-full border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/20"
                  />
                </div>
                {/* Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtre
                </Button>
              </div>
            )}
            {loading ? (
              <div className="mb-8 grid gap-5 md:grid-cols-2 pt-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProblemCardSkeleton key={index} />
                ))}
              </div>
            ) : visibleProblems.length > 0 ? (
              <>
                {/* Active Filters Bar */}
                {(filters.difficulty !== "Toate" ||
                  filters.class !== "Toate" ||
                  filters.chapter !== "Toate" ||
                  filters.progress !== "Toate" ||
                  filters.search) && (
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      {/* Difficulty chip */}
                      {filters.difficulty !== "Toate" && (
                        <button
                          onClick={() => handleFilterChange({ ...filters, difficulty: "Toate" })}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-80",
                            filters.difficulty === "Ușor" && "bg-emerald-500/20 text-emerald-300",
                            filters.difficulty === "Mediu" && "bg-amber-500/20 text-amber-300",
                            filters.difficulty === "Avansat" && "bg-rose-500/20 text-rose-300"
                          )}
                        >
                          {filters.difficulty}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Class chip */}
                      {filters.class !== "Toate" && (
                        <button
                          onClick={() => handleFilterChange({ ...filters, class: "Toate", chapter: "Toate" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                        >
                          {filters.class}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Chapter chip */}
                      {filters.chapter !== "Toate" && (
                        <button
                          onClick={() => handleFilterChange({ ...filters, chapter: "Toate" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                        >
                          {filters.chapter.length > 25 ? `${filters.chapter.slice(0, 25)}...` : filters.chapter}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Progress chip */}
                      {filters.progress !== "Toate" && (
                        <button
                          onClick={() => handleFilterChange({ ...filters, progress: "Toate" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                        >
                          {filters.progress}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Search chip */}
                      {filters.search && (
                        <button
                          onClick={() => handleFilterChange({ ...filters, search: "" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                        >
                          "{filters.search.length > 15 ? `${filters.search.slice(0, 15)}...` : filters.search}"
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* Clear all link */}
                      <button
                        onClick={() => handleFilterChange({
                          search: "",
                          category: "Toate",
                          difficulty: "Toate",
                          progress: "Toate",
                          class: "Toate",
                          chapter: "Toate",
                        })}
                        className="ml-2 text-xs text-white/50 transition hover:text-white"
                      >
                        Șterge toate filtrele
                      </button>
                    </div>
                  )}
                <div className="mb-8 grid gap-5 md:grid-cols-2 pt-2 -mt-2">
                  {visibleProblems.map((problem) => {
                    const isPlaceholder = (problem as any).isPlaceholder === true
                    // Access controlled by centralized config - see lib/access-config.ts
                    const canAccess = ALLOW_ALL_PHYSICS_PROBLEMS
                      ? true
                      : !isFree || isPaid || monthlyFreeSet.has(problem.id)
                    const isLocked = isPlaceholder
                      ? true
                      : (ALLOW_ALL_PHYSICS_PROBLEMS ? false : isFree && !canAccess)
                    return (
                      <Suspense key={problem.id} fallback={<ProblemCardSkeleton />}>
                        <ProblemCard
                          problem={problem}
                          solved={solvedProblems.includes(problem.id)}
                          isLocked={isLocked}
                        />
                      </Suspense>
                    )
                  })}
                </div>
                <div className="mt-8 flex justify-center gap-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      {(() => {
                        const pages = [] as JSX.Element[]
                        const neighbor = 1
                        const { totalPages } = paginationData

                        if (totalPages <= 3) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <Button
                                  variant={i === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(i)}
                                  className={cn(
                                    "rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white",
                                    i === currentPage && "border-white bg-white text-black hover:bg-white"
                                  )}
                                >
                                  {i}
                                </Button>
                              </PaginationItem>
                            )
                          }
                        } else {
                          if (currentPage > 1 + neighbor + 1) {
                            pages.push(
                              <PaginationItem key={1}>
                                <Button
                                  variant={1 === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(1)}
                                  className={cn(
                                    "rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white",
                                    1 === currentPage && "border-white bg-white text-black hover:bg-white"
                                  )}
                                >
                                  1
                                </Button>
                              </PaginationItem>
                            )
                            pages.push(<PaginationEllipsis key="start-ellipsis" />)
                          } else {
                            for (let i = 1; i < Math.max(2, currentPage - neighbor); i++) {
                              pages.push(
                                <PaginationItem key={i}>
                                  <Button
                                    variant={i === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i)}
                                    className={cn(
                                      "rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white",
                                      i === currentPage && "border-white bg-white text-black hover:bg-white"
                                    )}
                                  >
                                    {i}
                                  </Button>
                                </PaginationItem>
                              )
                            }
                          }
                          for (let i = Math.max(1, currentPage - neighbor); i <= Math.min(totalPages, currentPage + neighbor); i++) {
                            if (i === 1 || i === totalPages) continue
                            pages.push(
                              <PaginationItem key={i}>
                                <Button
                                  variant={i === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(i)}
                                  className={cn(
                                    "rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white",
                                    i === currentPage && "border-white bg-white text-black hover:bg-white"
                                  )}
                                >
                                  {i}
                                </Button>
                              </PaginationItem>
                            )
                          }
                          if (currentPage < totalPages - neighbor - 1) {
                            pages.push(<PaginationEllipsis key="end-ellipsis" />)
                            pages.push(
                              <PaginationItem key={totalPages}>
                                <Button
                                  variant={totalPages === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(totalPages)}
                                  className={cn(
                                    "rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white",
                                    totalPages === currentPage && "border-white bg-white text-black hover:bg-white"
                                  )}
                                >
                                  {totalPages}
                                </Button>
                              </PaginationItem>
                            )
                          } else {
                            for (let i = currentPage + neighbor + 1; i <= totalPages; i++) {
                              pages.push(
                                <PaginationItem key={i}>
                                  <Button
                                    variant={i === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i)}
                                    className={cn(
                                      "rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white",
                                      i === currentPage && "border-white bg-white text-black hover:bg-white"
                                    )}
                                  >
                                    {i}
                                  </Button>
                                </PaginationItem>
                              )
                            }
                          }
                        }
                        return pages
                      })()}
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(paginationData.totalPages, p + 1))}
                          disabled={currentPage === paginationData.totalPages}
                          className="rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-12 text-center text-white/70 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)]">
                <p className="text-lg text-white">Nu s-au găsit probleme care să corespundă filtrelor selectate.</p>
                <Button
                  onClick={() => setFilters({
                    search: "",
                    category: "Toate",
                    difficulty: "Toate",
                    progress: "Toate",
                    class: "Toate",
                    chapter: "Toate",
                  })}
                  className="mt-6 rounded-full border border-white/15 bg-white/[0.1] px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Resetează filtrele
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}




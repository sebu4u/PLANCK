'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from "react"
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { Problem } from "@/data/problems"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { ALLOW_ALL_PHYSICS_PROBLEMS } from "@/lib/access-config"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProblemCardSkeleton } from "@/components/problems/problem-card-skeleton"
import {
  CATALOG_CHAPTER_OPTIONS,
  CATALOG_CLASS_OPTIONS,
  FilterState,
  ProblemsCatalogSidebar,
  SidebarClassProgress,
} from "@/components/problems/problems-catalog-sidebar"

const ProblemCard = lazy(() => import("@/components/problem-card").then((module) => ({ default: module.ProblemCard })))

const PROBLEMS_PER_PAGE = 15
const CLASS_MAP: Record<number, string> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a",
}

const CLASS_CARD_COPY: Record<(typeof CATALOG_CLASS_OPTIONS)[number], { title: string; subtitle: string }> = {
  "a 9-a": { title: "Clasa a IX-a", subtitle: "Mecanica si optica de baza" },
  "a 10-a": { title: "Clasa a X-a", subtitle: "Termodinamica si electricitate" },
  "a 11-a": { title: "Clasa a XI-a", subtitle: "Oscilatii, unde si optica avansata" },
  "a 12-a": { title: "Clasa a XII-a", subtitle: "Fizica moderna si nucleara" },
}

const problemsCache = new Map<string, { data: Problem[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000
const MONTHLY_FREE_PROBLEM_COUNT = 50
const CATALOG_SELECTED_CLASS_KEY = "catalogSelectedClass"
const PROBLEMS_BG_AVATAR_SRC = "/planck_avatar-1035b250-7b77-452e-a1e1-7a8f1d6dd4a2.png"

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

const normalizeValue = (value?: string | null) => (value ?? "").trim().toLowerCase()

const mapProfileGradeToClass = (grade: unknown): string | null => {
  if (grade == null) return null
  const raw = String(grade).trim()
  if (!raw) return null
  if (["9", "10", "11", "12"].includes(raw)) return `a ${raw}-a`
  const numeric = Number(raw)
  if ([9, 10, 11, 12].includes(numeric)) return `a ${numeric}-a`
  const normalized = normalizeValue(raw)
  const directMatch = CATALOG_CLASS_OPTIONS.find((opt) => normalizeValue(opt) === normalized)
  return directMatch ?? null
}

const mapProblemClassLabel = (problem: Problem): string | null => {
  const normalizedClassString = normalizeValue(problem.classString)
  if (normalizedClassString) {
    const match = CATALOG_CLASS_OPTIONS.find((opt) => normalizeValue(opt) === normalizedClassString)
    if (match) return match
  }
  if (typeof problem.class === "number") return CLASS_MAP[problem.class] ?? null
  return null
}

interface ProblemsClientProps {
  initialProblems: Problem[]
  initialPage?: number
  initialMonthlyFreeSet?: string[]
  initialChapter?: string
}

export default function ProblemsCatalogClient({
  initialProblems,
  initialPage = 1,
  initialMonthlyFreeSet = [],
  initialChapter,
}: ProblemsClientProps) {
  const { user, profile } = useAuth()
  const { isFree, isPaid } = useSubscriptionPlan()
  const isMobile = useIsMobile()
  const didMountRef = useRef(false)

  const normalizedInitialChapter = typeof initialChapter === "string" ? initialChapter.trim() : ""

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "Toate",
    difficulty: "Toate",
    progress: "Toate",
    class: "Toate",
    chapter: normalizedInitialChapter || "Toate",
  })
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [problems, setProblems] = useState<Problem[]>(initialProblems || [])
  const [loading, setLoading] = useState(!initialProblems || initialProblems.length === 0)
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])
  const [visibleProblems, setVisibleProblems] = useState<Problem[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedClassGate, setSelectedClassGate] = useState<string | null>(null)
  const [sidebarScrolling, setSidebarScrolling] = useState(false)
  const sidebarScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const profileClass = useMemo(() => mapProfileGradeToClass(profile?.grade), [profile?.grade])
  const requiresClassSelection = !user || !profileClass
  const catalogReady = !requiresClassSelection || Boolean(selectedClassGate)
  const effectiveUserClass = profileClass ?? selectedClassGate ?? CATALOG_CLASS_OPTIONS[0]

  const fetchProblems = useCallback(async () => {
    const cacheKey = "all-problems"
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
        const mapped = data.map((problem: any) => ({
          ...problem,
          classString: CLASS_MAP[problem.class] || "Toate",
        }))
        problemsCache.set(cacheKey, { data: mapped, timestamp: Date.now() })
        setProblems(mapped)
      }
    } catch (error) {
      console.error("Error fetching problems:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialProblems || initialProblems.length === 0) {
      fetchProblems()
      return
    }

    const normalized = initialProblems.map((problem: any) => ({
      ...problem,
      classString: CLASS_MAP[problem.class as number] || problem.classString || "Toate",
    }))
    setProblems(normalized)
    setLoading(false)
    problemsCache.set("all-problems", { data: normalized, timestamp: Date.now() })
  }, [fetchProblems, initialProblems])

  const fetchSolvedProblems = useCallback(async () => {
    if (!user) {
      setSolvedProblems([])
      return
    }

    try {
      const { data } = await supabase
        .from("solved_problems")
        .select("problem_id")
        .eq("user_id", user.id)

      setSolvedProblems(data ? data.map((row: any) => row.problem_id) : [])
    } catch (error) {
      console.error("Error fetching solved problems:", error)
      setSolvedProblems([])
    }
  }, [user])

  useEffect(() => {
    fetchSolvedProblems()
  }, [fetchSolvedProblems])

  useEffect(() => {
    if (!requiresClassSelection) {
      setSelectedClassGate(null)
      return
    }

    try {
      const storedClass = sessionStorage.getItem(CATALOG_SELECTED_CLASS_KEY)
      if (storedClass && CATALOG_CLASS_OPTIONS.includes(storedClass as (typeof CATALOG_CLASS_OPTIONS)[number])) {
        setSelectedClassGate(storedClass)
      }
    } catch {
      // ignore storage errors
    }
  }, [requiresClassSelection])

  useEffect(() => {
    if (!requiresClassSelection || !selectedClassGate) return
    if (filters.class !== "Toate") return

    setFilters((prev) => ({
      ...prev,
      class: selectedClassGate,
      chapter: "Toate",
    }))
  }, [filters.class, requiresClassSelection, selectedClassGate])

  useEffect(() => {
    if (requiresClassSelection) return
    if (!profileClass) return
    if (filters.class !== "Toate") return

    setFilters((prev) => ({
      ...prev,
      class: profileClass,
      chapter: normalizedInitialChapter || "Toate",
    }))
  }, [filters.class, normalizedInitialChapter, profileClass, requiresClassSelection])

  useEffect(() => {
    if (!requiresClassSelection) return
    if (!catalogReady) return
    if (filters.class !== "Toate") return

    const fallbackClass = selectedClassGate ?? CATALOG_CLASS_OPTIONS[0]
    setFilters((prev) => ({
      ...prev,
      class: fallbackClass,
      chapter: "Toate",
    }))
  }, [catalogReady, filters.class, requiresClassSelection, selectedClassGate])

  const filteredProblems = useMemo(() => {
    const hasSearch = Boolean(filters.search?.trim())
    return problems.filter((problem) => {
      if (hasSearch) {
        const searchLower = filters.search!.toLowerCase().trim()
        const matchesSearch =
          problem.title.toLowerCase().includes(searchLower) ||
          problem.statement.toLowerCase().includes(searchLower) ||
          problem.id.toLowerCase().includes(searchLower) ||
          (problem.tags &&
            (Array.isArray(problem.tags)
              ? problem.tags.some((tag) => tag.toLowerCase().includes(searchLower))
              : problem.tags.toLowerCase().includes(searchLower)))
        if (!matchesSearch) return false
        // Când userul caută, afișăm toate rezultatele care match search-ul, indiferent de filtre
        return true
      }

      if (
        filters.class !== "Toate" &&
        normalizeValue(mapProblemClassLabel(problem)) !== normalizeValue(filters.class)
      ) {
        return false
      }

      if (
        filters.chapter !== "Toate" &&
        normalizeValue(problem.category) !== normalizeValue(filters.chapter)
      ) {
        return false
      }

      if (filters.difficulty !== "Toate" && problem.difficulty !== filters.difficulty) {
        return false
      }

      if (filters.progress === "Rezolvate" && !solvedProblems.includes(problem.id)) return false
      if (filters.progress === "Nerezolvate" && solvedProblems.includes(problem.id)) return false

      return true
    })
  }, [filters, problems, solvedProblems])

  const monthlyFreeSet = useMemo(() => {
    if (initialMonthlyFreeSet.length > 0) {
      return new Set(initialMonthlyFreeSet)
    }

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

  const sortedProblems = useMemo(() => {
    const noFiltersApplied =
      !filters.search &&
      filters.category === "Toate" &&
      filters.difficulty === "Toate" &&
      filters.progress === "Toate" &&
      filters.class === "Toate" &&
      filters.chapter === "Toate"

    const isFreeOnly = isFree && !isPaid

    if (noFiltersApplied && !isFreeOnly) {
      const featuredProblemIds = ["M008", "T001", "M033", "T004", "M025", "T014", "M071", "T034"]
      const featuredProblemsMap = new Map<string, Problem>()
      const otherProblems: Problem[] = []

      filteredProblems.forEach((problem) => {
        if (featuredProblemIds.includes(problem.id)) {
          featuredProblemsMap.set(problem.id, problem)
        } else {
          otherProblems.push(problem)
        }
      })

      const result: Problem[] = []
      featuredProblemIds.forEach((id) => {
        const problem = featuredProblemsMap.get(id)
        if (problem) result.push(problem)
      })
      result.push(...otherProblems)
      return result
    }

    const difficultyOrder: Record<string, number> = { "Ușor": 1, "Mediu": 2, "Avansat": 3 }
    const hasAnyYoutube = filteredProblems.some((p) => typeof p.youtube_url === "string" && p.youtube_url.trim() !== "")

    return [...filteredProblems].sort((a, b) => {
      if (isFreeOnly) {
        const aFree = monthlyFreeSet.has(a.id)
        const bFree = monthlyFreeSet.has(b.id)
        if (aFree !== bFree) return aFree ? -1 : 1
      }

      const aSolved = solvedProblems.includes(a.id)
      const bSolved = solvedProblems.includes(b.id)
      if (aSolved !== bSolved) return aSolved ? 1 : -1

      if (hasAnyYoutube) {
        const aHas = typeof a.youtube_url === "string" && a.youtube_url.trim() !== ""
        const bHas = typeof b.youtube_url === "string" && b.youtube_url.trim() !== ""
        if (aHas !== bHas) return aHas ? -1 : 1
      }

      const aRank = difficultyOrder[a.difficulty] ?? 99
      const bRank = difficultyOrder[b.difficulty] ?? 99
      if (aRank !== bRank) return aRank - bRank

      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return bTime - aTime
    })
  }, [filteredProblems, filters, isFree, isPaid, monthlyFreeSet, solvedProblems])

  const paginationData = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(sortedProblems.length / PROBLEMS_PER_PAGE))
    const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE
    const paginatedProblems = sortedProblems.slice(startIndex, startIndex + PROBLEMS_PER_PAGE)
    return { totalPages, paginatedProblems }
  }, [currentPage, sortedProblems])

  useEffect(() => {
    setVisibleProblems(paginationData.paginatedProblems.slice(0, 4))
    const timer = setTimeout(() => {
      setVisibleProblems(paginationData.paginatedProblems)
    }, 100)
    return () => clearTimeout(timer)
  }, [paginationData.paginatedProblems])

  const handleFilterChange = useCallback((nextFilters: FilterState) => {
    setFilters(nextFilters)
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const scrollContainer = document.querySelector('[data-problems-scroll]')
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "auto" })
    } else {
      window.scrollTo({ top: 0, behavior: "auto" })
    }
  }, [currentPage])

  const progressByClass = useMemo<Record<string, SidebarClassProgress>>(() => {
    const solvedSet = new Set(solvedProblems)
    const result: Record<string, SidebarClassProgress> = {}
    const chapterLookup: Record<string, Record<string, string>> = {}

    CATALOG_CLASS_OPTIONS.forEach((cls) => {
      const chapterProgress = Object.fromEntries(
        CATALOG_CHAPTER_OPTIONS[cls].map((chapter) => [chapter, { total: 0, solved: 0 }]),
      )
      result[cls] = {
        total: 0,
        solved: 0,
        chapters: chapterProgress,
      }

      chapterLookup[cls] = Object.fromEntries(
        CATALOG_CHAPTER_OPTIONS[cls].map((chapter) => [normalizeValue(chapter), chapter]),
      )
    })

    for (const problem of problems) {
      const classLabel = mapProblemClassLabel(problem)
      if (!classLabel || !result[classLabel]) continue

      const classProgress = result[classLabel]
      const solved = solvedSet.has(problem.id)
      classProgress.total += 1
      if (solved) classProgress.solved += 1

      const chapterKey = chapterLookup[classLabel][normalizeValue(problem.category)]
      if (chapterKey && classProgress.chapters[chapterKey]) {
        classProgress.chapters[chapterKey].total += 1
        if (solved) classProgress.chapters[chapterKey].solved += 1
      }
    }

    return result
  }, [problems, solvedProblems])

  const selectClassAndOpenCatalog = (classValue: (typeof CATALOG_CLASS_OPTIONS)[number]) => {
    setSelectedClassGate(classValue)
    setFilters((prev) => ({
      ...prev,
      class: classValue,
      chapter: "Toate",
    }))
    setCurrentPage(1)

    try {
      sessionStorage.setItem(CATALOG_SELECTED_CLASS_KEY, classValue)
    } catch {
      // ignore storage errors
    }
  }

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.difficulty !== "Toate" ||
    filters.progress !== "Toate" ||
    filters.class !== effectiveUserClass ||
    filters.chapter !== "Toate"

  const handleSidebarScroll = useCallback(() => {
    setSidebarScrolling(true)
    if (sidebarScrollTimeoutRef.current) clearTimeout(sidebarScrollTimeoutRef.current)
    sidebarScrollTimeoutRef.current = setTimeout(() => {
      setSidebarScrolling(false)
      sidebarScrollTimeoutRef.current = null
    }, 600)
  }, [])

  return (
    <>
      {catalogReady && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-[340px] bg-white p-0 text-[#2c2f33]"
          >
            <SheetHeader className="border-b border-[#0b0c0f]/10 px-5 py-4">
              <SheetTitle className="text-left text-sm font-semibold text-[#0b0c0f]">Catalog probleme</SheetTitle>
            </SheetHeader>
            <div
              className={cn("catalog-sidebar-scroll h-[calc(100%-58px)] overflow-y-auto px-5 py-4", sidebarScrolling && "is-scrolling")}
              onScroll={handleSidebarScroll}
            >
              <ProblemsCatalogSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                progressByClass={progressByClass}
                totalProblems={problems.length}
                filteredCount={filteredProblems.length}
                lockedClass={effectiveUserClass}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="h-full flex flex-row">
        {catalogReady && (
          <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[300px] bg-white lg:block">
            <div
              className={cn("catalog-sidebar-scroll h-full overflow-y-auto px-5 py-5", sidebarScrolling && "is-scrolling")}
              onScroll={handleSidebarScroll}
            >
              <ProblemsCatalogSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                progressByClass={progressByClass}
                totalProblems={problems.length}
                filteredCount={filteredProblems.length}
                lockedClass={effectiveUserClass}
              />
            </div>
          </aside>
        )}

        <div className={cn("flex-1 relative h-full", catalogReady && "lg:ml-[300px]")}>
          <div className="absolute inset-[3px] top-0 bg-[#f5f4f2] lg:rounded-xl overflow-hidden">
            <div className="catalog-problems-scroll h-full overflow-y-auto" data-problems-scroll>
              <div className="pl-6 pr-[19px] sm:pl-8 sm:pr-[27px] lg:pl-10 lg:pr-[35px] xl:pl-12 xl:pr-[43px] pt-6 pb-12 space-y-6">
          {!catalogReady ? (
            <section className="flex min-h-[56vh] items-center justify-center py-4">
              <div className="w-full max-w-4xl">
                <div className="mx-auto mb-6 max-w-2xl text-center">
                  <h2 className="text-2xl font-semibold text-[#0b0c0f] sm:text-3xl">
                    Alege clasa de la care vrei sa lucrezi probleme
                  </h2>
                  <p className="mt-2 text-sm text-[#2c2f33]/75 sm:text-base">
                    Selecteaza una dintre cele 4 clase pentru a personaliza catalogul.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {CATALOG_CLASS_OPTIONS.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => selectClassAndOpenCatalog(cls)}
                      className="rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 text-left shadow-[0_12px_30px_-25px_rgba(11,12,15,0.4)] transition hover:-translate-y-0.5 hover:border-[#0b0c0f]/20"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2c2f33]/60">{cls}</p>
                      <h3 className="mt-2 text-xl font-semibold text-[#0b0c0f]">{CLASS_CARD_COPY[cls].title}</h3>
                      <p className="mt-2 text-sm text-[#2c2f33]/70">{CLASS_CARD_COPY[cls].subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#0b0c0f] sm:text-4xl">Probleme de fizica</h1>
                <p className="text-sm text-[#2c2f33]/75 sm:text-base">
                  Exerseaza pe capitole, urmareste progresul si deschide rapid orice problema.
                </p>
              </div>

              <div className="flex items-center justify-between lg:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="rounded-full border-[#0b0c0f]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0b0c0f] hover:bg-[#f5f4f2]"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Search si filtre
                </Button>
                {requiresClassSelection && selectedClassGate && profileClass && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedClassGate(null)}
                    className="rounded-full text-xs font-semibold text-[#2c2f33]/70 hover:bg-transparent hover:text-[#0b0c0f]"
                  >
                    Schimba clasa
                  </Button>
                )}
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {filters.difficulty !== "Toate" && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, difficulty: "Toate" })}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                    >
                      {filters.difficulty}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filters.class !== effectiveUserClass && (
                    <button
                      onClick={() =>
                        handleFilterChange({
                          ...filters,
                          class: effectiveUserClass,
                          chapter: "Toate",
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                    >
                      {filters.class}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filters.chapter !== "Toate" && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, chapter: "Toate" })}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                    >
                      {filters.chapter.length > 26 ? `${filters.chapter.slice(0, 26)}...` : filters.chapter}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filters.progress !== "Toate" && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, progress: "Toate" })}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                    >
                      {filters.progress}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filters.search && (
                    <button
                      onClick={() => handleFilterChange({ ...filters, search: "" })}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                    >
                      "{filters.search.length > 16 ? `${filters.search.slice(0, 16)}...` : filters.search}"
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              <div className="relative pt-2">
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-2 top-0 z-0 -translate-y-[65%] sm:right-4 sm:-translate-y-[68%] lg:right-[8%] lg:-translate-y-[72%] xl:right-[11%]"
                >
                  <img
                    src={PROBLEMS_BG_AVATAR_SRC}
                    alt=""
                    className="h-auto w-[110px] select-none sm:w-[120px] lg:w-[145px]"
                  />
                </div>

                <div className="relative z-10">
                  {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <ProblemCardSkeleton key={index} />
                      ))}
                    </div>
                  ) : visibleProblems.length > 0 ? (
                    <>
                      <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleProblems.map((problem) => {
                          const isFreeOnly = isFree && !isPaid
                          const canAccess = ALLOW_ALL_PHYSICS_PROBLEMS
                            ? true
                            : !isFreeOnly || monthlyFreeSet.has(problem.id)
                          const isLocked = ALLOW_ALL_PHYSICS_PROBLEMS ? false : isFreeOnly && !canAccess

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

                      <div className="mt-6 flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2] disabled:opacity-40"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                            </PaginationItem>

                            {(() => {
                              const pages: JSX.Element[] = []
                              const totalPages = paginationData.totalPages
                              const neighbor = 1

                              if (totalPages <= 3) {
                                for (let i = 1; i <= totalPages; i++) {
                                  pages.push(
                                    <PaginationItem key={i}>
                                      <Button
                                        variant={i === currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(i)}
                                        className={cn(
                                          "rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2]",
                                          i === currentPage && "border-[#0b0c0f] bg-[#0b0c0f] text-white hover:bg-[#0b0c0f]",
                                        )}
                                      >
                                        {i}
                                      </Button>
                                    </PaginationItem>,
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
                                          "rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2]",
                                          1 === currentPage && "border-[#0b0c0f] bg-[#0b0c0f] text-white hover:bg-[#0b0c0f]",
                                        )}
                                      >
                                        1
                                      </Button>
                                    </PaginationItem>,
                                  )
                                  pages.push(<PaginationEllipsis key="start-ellipsis" />)
                                }

                                for (
                                  let i = Math.max(2, currentPage - neighbor);
                                  i <= Math.min(totalPages - 1, currentPage + neighbor);
                                  i++
                                ) {
                                  pages.push(
                                    <PaginationItem key={i}>
                                      <Button
                                        variant={i === currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(i)}
                                        className={cn(
                                          "rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2]",
                                          i === currentPage && "border-[#0b0c0f] bg-[#0b0c0f] text-white hover:bg-[#0b0c0f]",
                                        )}
                                      >
                                        {i}
                                      </Button>
                                    </PaginationItem>,
                                  )
                                }

                                if (currentPage < totalPages - neighbor - 1) {
                                  pages.push(<PaginationEllipsis key="end-ellipsis" />)
                                }

                                pages.push(
                                  <PaginationItem key={totalPages}>
                                    <Button
                                      variant={totalPages === currentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(totalPages)}
                                      className={cn(
                                        "rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2]",
                                        totalPages === currentPage &&
                                          "border-[#0b0c0f] bg-[#0b0c0f] text-white hover:bg-[#0b0c0f]",
                                      )}
                                    >
                                      {totalPages}
                                    </Button>
                                  </PaginationItem>,
                                )
                              }

                              return pages
                            })()}

                            <PaginationItem>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((page) => Math.min(paginationData.totalPages, page + 1))}
                                disabled={currentPage === paginationData.totalPages}
                                className="rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2] disabled:opacity-40"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-[#0b0c0f]/10 bg-white px-8 py-12 text-center shadow-sm">
                      <p className="text-lg text-[#0b0c0f]">Nu s-au gasit probleme pentru filtrele selectate.</p>
                      <Button
                        onClick={() =>
                          setFilters({
                            search: "",
                            category: "Toate",
                            difficulty: "Toate",
                            progress: "Toate",
                            class: effectiveUserClass,
                            chapter: "Toate",
                          })
                        }
                        className="mt-6 rounded-full bg-[#0b0c0f] px-6 py-2 text-sm font-semibold text-white hover:bg-[#222428]"
                      >
                        Reseteaza filtrele
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

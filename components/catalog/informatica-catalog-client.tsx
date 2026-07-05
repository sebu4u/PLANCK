"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { useAuth } from "@/components/auth-provider"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { ALLOW_ALL_CODING_PROBLEMS } from "@/lib/access-config"
import { PROBLEMS_BG_AVATAR_SRC } from "@/lib/planck-catalog-avatar"
import { cn } from "@/lib/utils"
import { SubjectCatalogLayout } from "@/components/catalog/subject-catalog-layout"
import {
  CATALOG_CLASS_OPTIONS,
  type FilterState,
} from "@/components/problems/problems-catalog-sidebar"
import {
  CATALOG_CLASS_OPTIONS as CLASS_OPTIONS,
  mapProfileGradeToCatalogClass,
  mapNumericClassToLabel,
} from "@/lib/catalog-class-labels"
import {
  INFORMATICA_CLASS_CARD_COPY,
  mergeInformaticaChaptersByClassLabel,
} from "@/lib/informatica-catalog-config"
import {
  buildProgressByClass,
  DIFFICULTY_ORDER,
  filterSubjectCatalogProblems,
  getCurrentMonthKey,
  PROBLEMS_PER_PAGE,
  scoreProblemForMonth,
} from "@/lib/catalog-subject-utils"
import { CodingProblem } from "@/components/coding-problems/types"
import {
  InformaticaCatalogCard,
  InformaticaCatalogCardSkeleton,
} from "@/components/coding-problems/informatica-catalog-card"
import { PracticeSubjectSwitcher } from "@/components/exerseaza/practice-subject-switcher"
import { CatalogMobileTopBanner } from "@/components/catalog/catalog-mobile-top-banner"

const MONTHLY_FREE_PROBLEM_COUNT = 50
const STORAGE_PREFIX = "informaticaCatalog"
const CODING_PROBLEM_LIST_COLUMNS =
  "id,slug,title,statement_markdown,difficulty,class,chapter,points,time_limit_ms,memory_limit_kb,tags,language,created_at,updated_at"

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}:${key}`
}

interface InformaticaCatalogClientProps {
  initialProblems: CodingProblem[]
  initialCatalogTotalCount?: number
  initialMonthlyFreeSet?: string[]
  initialChapter?: string
}

export function InformaticaCatalogClient({
  initialProblems,
  initialCatalogTotalCount = 0,
  initialMonthlyFreeSet = [],
  initialChapter,
}: InformaticaCatalogClientProps) {
  const { user, profile, isDev, profileSyncedUserId } = useAuth()
  const { isFree, isPaid } = useSubscriptionPlan()
  const showDevEdit = Boolean(user && profileSyncedUserId === user.id && isDev)

  const normalizedInitialChapter = typeof initialChapter === "string" ? initialChapter.trim() : ""
  const defaultFilters: FilterState = {
    search: "",
    category: "Toate",
    difficulty: "Toate",
    progress: "Toate",
    class: "Toate",
    chapter: normalizedInitialChapter || "Toate",
  }

  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [problems, setProblems] = useState<CodingProblem[]>(initialProblems)
  const [loading, setLoading] = useState(initialProblems.length === 0)
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedClassGate, setSelectedClassGate] = useState<string | null>(null)
  const [sidebarScrolling, setSidebarScrolling] = useState(false)
  const sidebarScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const profileClass = useMemo(() => mapProfileGradeToCatalogClass(profile?.grade), [profile?.grade])
  const requiresClassSelection = !user || !profileClass
  const catalogReady = !requiresClassSelection || Boolean(selectedClassGate)
  const effectiveUserClass = profileClass ?? selectedClassGate ?? CLASS_OPTIONS[0]

  const chapterOptions = useMemo(() => {
    const fromDb: Record<string, string[]> = {}
    for (const problem of problems) {
      const classLabel = mapNumericClassToLabel(problem.class)
      if (!classLabel || !problem.chapter?.trim()) continue
      if (!fromDb[classLabel]) fromDb[classLabel] = []
      if (!fromDb[classLabel].includes(problem.chapter)) fromDb[classLabel].push(problem.chapter)
    }
    return mergeInformaticaChaptersByClassLabel(fromDb)
  }, [problems])

  const sidebarConfig = useMemo(
    () => ({
      classOptions: CATALOG_CLASS_OPTIONS,
      chapterOptions,
      difficultyOptions: ["Inițiere", "Ușor", "Mediu", "Avansat", "Concurs"] as const,
      showProgress: true,
    }),
    [chapterOptions],
  )

  const fetchProblems = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) {
      setLoading(true)
    }
    try {
      const { data, error } = await supabase
        .from("coding_problems")
        .select(CODING_PROBLEM_LIST_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setProblems(
          data.map((item) => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : [],
          })) as CodingProblem[],
        )
      }
    } catch (error) {
      console.error("[informatica-catalog] Failed to fetch problems:", error)
    } finally {
      if (!options?.background) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const hasPartialSnapshot =
      initialCatalogTotalCount > 0 &&
      initialProblems.length > 0 &&
      initialProblems.length < initialCatalogTotalCount

    if (initialProblems.length === 0) {
      void fetchProblems()
      return
    }

    if (hasPartialSnapshot) {
      void fetchProblems({ background: true })
    }
  }, [fetchProblems, initialCatalogTotalCount, initialProblems.length])

  const fetchSolvedProblems = useCallback(async () => {
    if (!user) {
      setSolvedProblems([])
      return
    }

    try {
      const { data } = await supabase
        .from("coding_submissions")
        .select("problem_id")
        .eq("user_id", user.id)
        .eq("status", "accepted")

      const unique = Array.from(new Set((data ?? []).map((row) => row.problem_id)))
      setSolvedProblems(unique)
    } catch (error) {
      console.error("[informatica-catalog] Failed to fetch solved problems:", error)
      setSolvedProblems([])
    }
  }, [user])

  useEffect(() => {
    void fetchSolvedProblems()
  }, [fetchSolvedProblems])

  useEffect(() => {
    if (!requiresClassSelection) {
      setSelectedClassGate(null)
      return
    }
    try {
      const storedClass = sessionStorage.getItem(getStorageKey("selectedClass"))
      if (storedClass && CLASS_OPTIONS.includes(storedClass as (typeof CLASS_OPTIONS)[number])) {
        setSelectedClassGate(storedClass)
      }
    } catch {
      // ignore
    }
  }, [requiresClassSelection])

  useEffect(() => {
    if (requiresClassSelection || !profileClass || filters.class !== "Toate") return
    setFilters((prev) => ({
      ...prev,
      class: profileClass,
      chapter: normalizedInitialChapter || "Toate",
    }))
  }, [filters.class, normalizedInitialChapter, profileClass, requiresClassSelection])

  const filteredProblems = useMemo(
    () =>
      filterSubjectCatalogProblems({
        problems,
        filters,
        solvedIds: solvedProblems,
        getClassLabel: (problem) => mapNumericClassToLabel(problem.class),
        getChapter: (problem) => problem.chapter ?? null,
        getId: (problem) => problem.id,
        getSearchText: (problem) => [
          problem.title,
          problem.statement_markdown ?? "",
          problem.slug,
          problem.id,
          ...(Array.isArray(problem.tags) ? problem.tags : []),
        ],
      }),
    [filters, problems, solvedProblems],
  )

  const monthlyFreeSet = useMemo(() => {
    if (initialMonthlyFreeSet.length > 0) return new Set(initialMonthlyFreeSet)
    if (!problems.length) return new Set<string>()
    const monthKey = getCurrentMonthKey()
    const scored = problems.map((problem) => ({
      id: problem.id,
      score: scoreProblemForMonth(problem.id, monthKey),
    }))
    scored.sort((a, b) => a.score - b.score)
    return new Set(scored.slice(0, Math.min(MONTHLY_FREE_PROBLEM_COUNT, scored.length)).map((item) => item.id))
  }, [initialMonthlyFreeSet, problems])

  const sortedProblems = useMemo(() => {
    const isFreeOnly = isFree && !isPaid
    return [...filteredProblems].sort((a, b) => {
      if (isFreeOnly) {
        const aFree = monthlyFreeSet.has(a.id)
        const bFree = monthlyFreeSet.has(b.id)
        if (aFree !== bFree) return aFree ? -1 : 1
      }

      const aRank = DIFFICULTY_ORDER[a.difficulty] ?? 99
      const bRank = DIFFICULTY_ORDER[b.difficulty] ?? 99
      if (aRank !== bRank) return aRank - bRank

      const aSolved = solvedProblems.includes(a.id)
      const bSolved = solvedProblems.includes(b.id)
      if (aSolved !== bSolved) return aSolved ? 1 : -1

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredProblems, isFree, isPaid, monthlyFreeSet, solvedProblems])

  const paginationData = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(sortedProblems.length / PROBLEMS_PER_PAGE))
    const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE
    return {
      totalPages,
      paginatedProblems: sortedProblems.slice(startIndex, startIndex + PROBLEMS_PER_PAGE),
    }
  }, [currentPage, sortedProblems])

  const progressByClass = useMemo(
    () =>
      buildProgressByClass({
        problems,
        solvedIds: solvedProblems,
        chapterOptions,
        getClassLabel: (problem) => mapNumericClassToLabel(problem.class),
        getChapter: (problem) => problem.chapter ?? null,
        getId: (problem) => problem.id,
      }),
    [chapterOptions, problems, solvedProblems],
  )

  const handleFilterChange = useCallback((nextFilters: FilterState) => {
    setFilters(nextFilters)
    setCurrentPage(1)
    setMobileSidebarOpen(false)
  }, [])

  const selectClassAndOpenCatalog = (classValue: (typeof CLASS_OPTIONS)[number]) => {
    setSelectedClassGate(classValue)
    setFilters((prev) => ({ ...prev, class: classValue, chapter: "Toate" }))
    setCurrentPage(1)
    try {
      sessionStorage.setItem(getStorageKey("selectedClass"), classValue)
    } catch {
      // ignore
    }
  }

  const handleSidebarScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setSidebarScrolling(true)
    if (sidebarScrollTimeoutRef.current) clearTimeout(sidebarScrollTimeoutRef.current)
    sidebarScrollTimeoutRef.current = setTimeout(() => {
      setSidebarScrolling(false)
      sidebarScrollTimeoutRef.current = null
    }, 600)
  }, [])

  useEffect(() => {
    return () => {
      if (sidebarScrollTimeoutRef.current) clearTimeout(sidebarScrollTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  return (
    <SubjectCatalogLayout
      catalogReady={catalogReady}
      requiresClassSelection={requiresClassSelection}
      selectedClassGate={selectedClassGate}
      onSelectClass={(cls) => selectClassAndOpenCatalog(cls as (typeof CLASS_OPTIONS)[number])}
      onClearClassGate={() => setSelectedClassGate(null)}
      classOptions={CLASS_OPTIONS}
      classCardCopy={INFORMATICA_CLASS_CARD_COPY}
      title="Probleme de informatica"
      subtitle="Exerseaza pe capitole, urmareste progresul si deschide rapid orice problema in PlanckCode."
      filters={filters}
      onFilterChange={handleFilterChange}
      progressByClass={progressByClass}
      totalProblems={problems.length}
      filteredCount={filteredProblems.length}
      effectiveUserClass={effectiveUserClass}
      sidebarConfig={sidebarConfig}
      mobileSidebarOpen={mobileSidebarOpen}
      setMobileSidebarOpen={setMobileSidebarOpen}
      sidebarScrolling={sidebarScrolling}
      onSidebarScroll={handleSidebarScroll}
      onProblemsScroll={() => {}}
      topSlot={<CatalogMobileTopBanner />}
      headerPrefix={
        <div className="hidden burger:block">
          <PracticeSubjectSwitcher currentSubject="informatica" />
        </div>
      }
    >
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
            <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <InformaticaCatalogCardSkeleton key={index} />
              ))}
            </div>
          ) : paginationData.paginatedProblems.length > 0 ? (
            <>
              <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                {paginationData.paginatedProblems.map((problem) => {
                  const isFreeOnly = isFree && !isPaid
                  const canAccess = ALLOW_ALL_CODING_PROBLEMS ? true : !isFreeOnly || monthlyFreeSet.has(problem.id)
                  const isLocked = ALLOW_ALL_CODING_PROBLEMS ? false : isFreeOnly && !canAccess

                  return (
                    <InformaticaCatalogCard
                      key={problem.id}
                      problem={problem}
                      solved={solvedProblems.includes(problem.id)}
                      isLocked={isLocked}
                      showDevEdit={showDevEdit}
                    />
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

                    {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "rounded-full border-[#0b0c0f]/20 bg-white text-[#2c2f33] hover:bg-[#f5f4f2]",
                            page === currentPage && "border-[#0b0c0f] bg-[#0b0c0f] text-white hover:bg-[#0b0c0f]",
                          )}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ))}

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
                  handleFilterChange({
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
    </SubjectCatalogLayout>
  )
}

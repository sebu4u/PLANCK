"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react"
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react"
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
  type FilterState,
  type CatalogLanguageFilter,
} from "@/components/problems/problems-catalog-sidebar"
import {
  mapNumericClassToLabel,
} from "@/lib/catalog-class-labels"
import {
  INFORMATICA_CATALOG_CLASS_OPTIONS,
  INFORMATICA_CLASS_CARD_COPY,
  mergeInformaticaChaptersByClassLabel,
  type InformaticaCatalogClassLabel,
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
import { CatalogLanguageFilter as CatalogLanguageFilterControl } from "@/components/catalog/catalog-language-filter"
import { useIsMobile } from "@/hooks/use-mobile"

const VALID_LANGUAGE: CatalogLanguageFilter[] = ["Toate", "cpp", "python"]

const MONTHLY_FREE_PROBLEM_COUNT = 50
const STORAGE_PREFIX = "informaticaCatalog"
const VIEW_MODE_STORAGE_KEY = getStorageKey("viewMode")
const VALID_PROGRESS: FilterState["progress"][] = ["Toate", "Nerezolvate", "Rezolvate"]
export type InformaticaCatalogViewMode = "list" | "grid"
const CODING_PROBLEM_LIST_COLUMNS =
  "id,display_id,slug,title,statement_markdown,difficulty,class,chapter,points,time_limit_ms,memory_limit_kb,tags,language,created_at,updated_at"

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}:${key}`
}

function loadStoredFilters(storageKey: string): FilterState | null {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const o = parsed as Record<string, unknown>
    if (
      typeof o.search !== "string" ||
      typeof o.category !== "string" ||
      typeof o.difficulty !== "string" ||
      typeof o.chapter !== "string" ||
      typeof o.class !== "string" ||
      !VALID_PROGRESS.includes(o.progress as FilterState["progress"])
    ) {
      return null
    }
    const languageRaw = o.language
    const language =
      typeof languageRaw === "string" && VALID_LANGUAGE.includes(languageRaw as CatalogLanguageFilter)
        ? (languageRaw as CatalogLanguageFilter)
        : "Toate"
    const classValue = INFORMATICA_CATALOG_CLASS_OPTIONS.includes(o.class as InformaticaCatalogClassLabel)
      ? o.class
      : "Toate"
    return {
      search: o.search,
      category: o.category,
      difficulty: o.difficulty,
      progress: o.progress as FilterState["progress"],
      class: classValue,
      chapter: o.chapter,
      language,
    }
  } catch {
    return null
  }
}

function loadStoredPage(storageKey: string): number | null {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (raw == null) return null
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 1) return null
    return n
  } catch {
    return null
  }
}

function loadStoredSelectedClass(storageKey: string): string | null {
  try {
    const storedClass = sessionStorage.getItem(storageKey)
    if (storedClass && INFORMATICA_CATALOG_CLASS_OPTIONS.includes(storedClass as InformaticaCatalogClassLabel)) {
      return storedClass
    }
  } catch {
    // ignore
  }
  return null
}

function loadStoredViewMode(): InformaticaCatalogViewMode {
  try {
    const stored = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY)
    if (stored === "grid" || stored === "list") return stored
  } catch {
    // ignore
  }
  return "list"
}

function saveStoredViewMode(mode: InformaticaCatalogViewMode) {
  try {
    sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  } catch {
    // ignore
  }
}

function saveStoredFilters(storageKey: string, filters: FilterState) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(filters))
  } catch {
    // ignore
  }
}

function saveStoredPage(storageKey: string, page: number) {
  try {
    sessionStorage.setItem(storageKey, String(page))
  } catch {
    // ignore
  }
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
  const { user, isDev, profileSyncedUserId } = useAuth()
  const { isFree, isPaid } = useSubscriptionPlan()
  const isMobile = useIsMobile()
  const showDevEdit = Boolean(user && profileSyncedUserId === user.id && isDev)

  const filtersStorageKey = getStorageKey("filters")
  const pageStorageKey = getStorageKey("page")
  const selectedClassStorageKey = getStorageKey("selectedClass")

  const normalizedInitialChapter = typeof initialChapter === "string" ? initialChapter.trim() : ""
  const defaultFilters: FilterState = {
    search: "",
    category: "Toate",
    difficulty: "Toate",
    progress: "Toate",
    class: "Toate",
    chapter: normalizedInitialChapter || "Toate",
    language: "Toate",
  }

  const restoredFiltersRef = useRef<FilterState | null | undefined>(undefined)
  if (restoredFiltersRef.current === undefined) {
    restoredFiltersRef.current = loadStoredFilters(filtersStorageKey)
  }
  const restoredFilters = restoredFiltersRef.current

  const restoredSelectedClassRef = useRef<string | null | undefined>(undefined)
  if (restoredSelectedClassRef.current === undefined) {
    restoredSelectedClassRef.current = loadStoredSelectedClass(selectedClassStorageKey)
  }

  const restoredPageRef = useRef<number | null | undefined>(undefined)
  if (restoredPageRef.current === undefined) {
    restoredPageRef.current = loadStoredPage(pageStorageKey)
  }

  const restoredViewModeRef = useRef<InformaticaCatalogViewMode | undefined>(undefined)
  if (restoredViewModeRef.current === undefined) {
    restoredViewModeRef.current = loadStoredViewMode()
  }

  const initialFilters =
    restoredFilters && normalizedInitialChapter && restoredFilters.chapter === "Toate"
      ? { ...restoredFilters, chapter: normalizedInitialChapter }
      : (restoredFilters ?? defaultFilters)

  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [currentPage, setCurrentPage] = useState(restoredPageRef.current ?? 1)
  const [viewMode, setViewMode] = useState<InformaticaCatalogViewMode>(restoredViewModeRef.current ?? "list")
  const effectiveViewMode: InformaticaCatalogViewMode = isMobile ? "grid" : viewMode
  const hasRestoredFiltersRef = useRef(Boolean(restoredFilters))
  const [problems, setProblems] = useState<CodingProblem[]>(
    initialProblems.filter((problem) => problem.class !== 12),
  )
  const [loading, setLoading] = useState(initialProblems.length === 0)
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedClassGate, setSelectedClassGate] = useState<string | null>(restoredSelectedClassRef.current)
  const [sidebarScrolling, setSidebarScrolling] = useState(false)
  const sidebarScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Route loading.tsx already painted the catalog skeleton — skip repeating it on first fetch.
  const suppressInitialGridSkeletonRef = useRef(true)

  // Always ask for class on first visit; restore from sessionStorage within the same tab session.
  const requiresClassSelection = true
  const catalogReady = Boolean(selectedClassGate)
  const effectiveUserClass = selectedClassGate ?? INFORMATICA_CATALOG_CLASS_OPTIONS[0]

  const catalogProblems = useMemo(
    () => problems.filter((problem) => problem.class !== 12),
    [problems],
  )

  const chapterOptions = useMemo(() => {
    const fromDb: Record<string, string[]> = {}
    for (const problem of catalogProblems) {
      const classLabel = mapNumericClassToLabel(problem.class)
      if (!classLabel || !problem.chapter?.trim()) continue
      if (!fromDb[classLabel]) fromDb[classLabel] = []
      if (!fromDb[classLabel].includes(problem.chapter)) fromDb[classLabel].push(problem.chapter)
    }
    return mergeInformaticaChaptersByClassLabel(fromDb)
  }, [catalogProblems])

  const sidebarConfig = useMemo(
    () => ({
      classOptions: INFORMATICA_CATALOG_CLASS_OPTIONS,
      chapterOptions,
      difficultyOptions: ["Inițiere", "Ușor", "Mediu", "Avansat", "Concurs"] as const,
      showProgress: true,
      showLanguageFilter: true,
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
          data
            .map((item) => ({
              ...item,
              tags: Array.isArray(item.tags) ? item.tags : [],
            }))
            .filter((item) => item.class !== 12) as CodingProblem[],
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

  useEffect(() => {
    if (!loading) {
      suppressInitialGridSkeletonRef.current = false
    }
  }, [loading])

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
    if (hasRestoredFiltersRef.current) return
    if (!selectedClassGate) return
    if (filters.class !== "Toate") return

    setFilters((prev) => ({
      ...prev,
      class: selectedClassGate,
      chapter: "Toate",
    }))
  }, [filters.class, selectedClassGate])

  useEffect(() => {
    saveStoredFilters(filtersStorageKey, filters)
  }, [filters, filtersStorageKey])

  useEffect(() => {
    saveStoredPage(pageStorageKey, currentPage)
  }, [currentPage, pageStorageKey])

  useEffect(() => {
    saveStoredViewMode(viewMode)
  }, [viewMode])

  const handleViewModeChange = useCallback((mode: InformaticaCatalogViewMode) => {
    setViewMode(mode)
  }, [])

  const filteredProblems = useMemo(
    () =>
      filterSubjectCatalogProblems({
        problems: catalogProblems,
        filters,
        solvedIds: solvedProblems,
        getClassLabel: (problem) => mapNumericClassToLabel(problem.class),
        getChapter: (problem) => problem.chapter ?? null,
        getId: (problem) => problem.id,
        getLanguage: (problem) => problem.language ?? "cpp",
        getSearchText: (problem) => [
          problem.title,
          problem.statement_markdown ?? "",
          problem.display_id ?? "",
          problem.slug,
          problem.id,
          ...(Array.isArray(problem.tags) ? problem.tags : []),
        ],
      }),
    [filters, catalogProblems, solvedProblems],
  )

  const monthlyFreeSet = useMemo(() => {
    if (initialMonthlyFreeSet.length > 0) return new Set(initialMonthlyFreeSet)
    if (!catalogProblems.length) return new Set<string>()
    const monthKey = getCurrentMonthKey()
    const scored = catalogProblems.map((problem) => ({
      id: problem.id,
      score: scoreProblemForMonth(problem.id, monthKey),
    }))
    scored.sort((a, b) => a.score - b.score)
    return new Set(scored.slice(0, Math.min(MONTHLY_FREE_PROBLEM_COUNT, scored.length)).map((item) => item.id))
  }, [initialMonthlyFreeSet, catalogProblems])

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
        problems: catalogProblems,
        solvedIds: solvedProblems,
        chapterOptions,
        classOptions: INFORMATICA_CATALOG_CLASS_OPTIONS,
        getClassLabel: (problem) => mapNumericClassToLabel(problem.class),
        getChapter: (problem) => problem.chapter ?? null,
        getId: (problem) => problem.id,
      }),
    [chapterOptions, catalogProblems, solvedProblems],
  )

  const handleFilterChange = useCallback((nextFilters: FilterState) => {
    setFilters(nextFilters)
    setCurrentPage(1)
    setMobileSidebarOpen(false)
  }, [])

  const selectClassAndOpenCatalog = (classValue: InformaticaCatalogClassLabel) => {
    const nextFilters = { ...filters, class: classValue, chapter: "Toate" as const }
    setSelectedClassGate(classValue)
    setFilters(nextFilters)
    setCurrentPage(1)
    try {
      sessionStorage.setItem(selectedClassStorageKey, classValue)
      saveStoredFilters(filtersStorageKey, nextFilters)
      saveStoredPage(pageStorageKey, 1)
    } catch {
      // ignore
    }
  }

  const handleSidebarScroll = useCallback((_event: UIEvent<HTMLDivElement>) => {
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

  return (
    <SubjectCatalogLayout
      catalogReady={catalogReady}
      onSelectClass={(cls) => selectClassAndOpenCatalog(cls as InformaticaCatalogClassLabel)}
      classOptions={INFORMATICA_CATALOG_CLASS_OPTIONS}
      classCardCopy={INFORMATICA_CLASS_CARD_COPY}
      title="Probleme de informatica"
      subtitle="Exerseaza pe capitole, urmareste progresul si deschide rapid orice problema in PlanckCode."
      filters={filters}
      onFilterChange={handleFilterChange}
      progressByClass={progressByClass}
      totalProblems={catalogProblems.length}
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

        <div className="relative z-10 animate-fade-in-up">
          {!loading && catalogReady ? (
            <div className="mb-3 hidden items-center justify-between gap-3 pt-1 md:flex">
              <CatalogLanguageFilterControl
                compact
                variant="inline"
                value={filters.language ?? "Toate"}
                onChange={(language: CatalogLanguageFilter) => handleFilterChange({ ...filters, language })}
                className="space-y-0"
              />
              {paginationData.paginatedProblems.length > 0 ? (
              <div
                className="inline-flex rounded-full border border-[#0b0c0f]/15 bg-white p-1 shadow-sm"
                role="group"
                aria-label="Mod afișare probleme"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewModeChange("list")}
                  className={cn(
                    "h-8 rounded-full px-3 text-[#2c2f33]",
                    viewMode === "list" && "bg-[#0b0c0f] text-white hover:bg-[#0b0c0f] hover:text-white",
                  )}
                  aria-pressed={viewMode === "list"}
                  aria-label="Listă"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewModeChange("grid")}
                  className={cn(
                    "h-8 rounded-full px-3 text-[#2c2f33]",
                    viewMode === "grid" && "bg-[#0b0c0f] text-white hover:bg-[#0b0c0f] hover:text-white",
                  )}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Grilă"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              ) : null}
            </div>
          ) : null}

          {loading && !suppressInitialGridSkeletonRef.current ? (
            <div
              className={cn(
                "gap-3 pt-1",
                effectiveViewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col",
              )}
            >
              {Array.from({ length: effectiveViewMode === "grid" ? 8 : 10 }).map((_, index) => (
                <InformaticaCatalogCardSkeleton key={index} variant={effectiveViewMode} />
              ))}
            </div>
          ) : loading ? (
            <div className="min-h-[16rem]" aria-busy="true" aria-label="Se încarcă problemele" />
          ) : paginationData.paginatedProblems.length > 0 ? (
            <>
              <div
                className={cn(
                  "gap-3",
                  effectiveViewMode === "grid" ? "grid pt-1 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2.5",
                )}
              >
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
                      variant={effectiveViewMode}
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
                    language: "Toate",
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

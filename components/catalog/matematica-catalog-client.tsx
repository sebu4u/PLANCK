"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { useAuth } from "@/components/auth-provider"
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
import { mergeMatematicaChaptersByClass, MATEMATICA_CATALOG_CHAPTER_OPTIONS } from "@/lib/matematica-catalog-chapters"
import {
  buildProgressByClass,
  DIFFICULTY_ORDER,
  filterSubjectCatalogProblems,
  PROBLEMS_PER_PAGE,
} from "@/lib/catalog-subject-utils"
import { MathProblem } from "@/components/math-problems/types"
import {
  MatematicaCatalogCard,
  MatematicaCatalogCardSkeleton,
} from "@/components/math-problems/matematica-catalog-card"
import { PracticeSubjectSwitcher } from "@/components/exerseaza/practice-subject-switcher"
import { CatalogMobileTopBanner } from "@/components/catalog/catalog-mobile-top-banner"

const STORAGE_PREFIX = "matematicaCatalog"

const MATEMATICA_CLASS_CARD_COPY: Record<(typeof CLASS_OPTIONS)[number], { title: string; subtitle: string }> = {
  "a 9-a": { title: "Clasa a IX-a", subtitle: "Algebră și geometrie de bază" },
  "a 10-a": { title: "Clasa a X-a", subtitle: "Funcții, ecuații și geometrie" },
  "a 11-a": { title: "Clasa a XI-a", subtitle: "Analiză, trigonometrie și combinatorică" },
  "a 12-a": { title: "Clasa a XII-a", subtitle: "Pregătire BAC și probleme de sinteză" },
}

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}:${key}`
}

interface MatematicaCatalogClientProps {
  initialProblems: MathProblem[]
  initialChapter?: string
}

export function MatematicaCatalogClient({ initialProblems, initialChapter }: MatematicaCatalogClientProps) {
  const { user, profile, isAdmin } = useAuth()

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
  const [problems, setProblems] = useState<MathProblem[]>(initialProblems)
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
      const chapter = problem.chapter?.trim()
      if (!classLabel || !chapter) continue
      if (!fromDb[classLabel]) fromDb[classLabel] = []
      if (!fromDb[classLabel].includes(chapter)) fromDb[classLabel].push(chapter)
    }
    return {
      ...MATEMATICA_CATALOG_CHAPTER_OPTIONS,
      ...mergeMatematicaChaptersByClass(fromDb),
    }
  }, [problems])

  const sidebarConfig = useMemo(
    () => ({
      classOptions: CATALOG_CLASS_OPTIONS,
      chapterOptions,
      difficultyOptions: ["Ușor", "Mediu", "Avansat"] as const,
      showProgress: true,
    }),
    [chapterOptions],
  )

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("math_problems")
        .select("id, title, description, statement, tags, class, difficulty, chapter, image_url, youtube_url, created_at, updated_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setProblems(
          data.map((item) => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : [],
            chapter: typeof item.chapter === "string" ? item.chapter : "",
          })) as MathProblem[],
        )
      }
    } catch (error) {
      console.error("[matematica-catalog] Failed to fetch problems:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialProblems.length === 0) {
      void fetchProblems()
    }
  }, [fetchProblems, initialProblems.length])

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
        getChapter: (problem) => problem.chapter?.trim() || null,
        getId: (problem) => problem.id,
        getSearchText: (problem) => [
          problem.title,
          problem.statement ?? "",
          problem.description ?? "",
          problem.id,
          ...(Array.isArray(problem.tags) ? problem.tags : []),
        ],
      }),
    [filters, problems, solvedProblems],
  )

  const sortedProblems = useMemo(() => {
    return [...filteredProblems].sort((a, b) => {
      const aRank = DIFFICULTY_ORDER[a.difficulty] ?? 99
      const bRank = DIFFICULTY_ORDER[b.difficulty] ?? 99
      if (aRank !== bRank) return aRank - bRank

      const aSolved = solvedProblems.includes(a.id)
      const bSolved = solvedProblems.includes(b.id)
      if (aSolved !== bSolved) return aSolved ? 1 : -1

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredProblems, solvedProblems])

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
        getChapter: (problem) => problem.chapter?.trim() || null,
        getId: (problem) => problem.id,
      }),
    [chapterOptions, problems, solvedProblems],
  )

  const handleProblemUpdated = useCallback((updated: MathProblem) => {
    setProblems((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
  }, [])

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
      classCardCopy={MATEMATICA_CLASS_CARD_COPY}
      title="Probleme de matematica"
      subtitle="Exerseaza pe capitole, urmareste progresul si deschide rapid orice problema."
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
          <PracticeSubjectSwitcher currentSubject="matematica" />
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
                <MatematicaCatalogCardSkeleton key={index} />
              ))}
            </div>
          ) : paginationData.paginatedProblems.length > 0 ? (
            <>
              <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                {paginationData.paginatedProblems.map((problem) => (
                  <MatematicaCatalogCard
                    key={problem.id}
                    problem={problem}
                    solved={solvedProblems.includes(problem.id)}
                    isAdmin={isAdmin}
                    onUpdated={handleProblemUpdated}
                  />
                ))}
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

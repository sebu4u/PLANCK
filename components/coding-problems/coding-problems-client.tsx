"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import {
  CodingProblem,
  CodingProblemFacets,
  CodingProblemFiltersState,
  CodingProblemsApiResponse,
} from "./types"
import { CodingProblemFilterBar } from "./filter-bar"
import { CodingCatalogSidebar } from "./coding-catalog-sidebar"
import { CodingProblemGrid } from "./problem-grid"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { ALLOW_ALL_CODING_PROBLEMS } from "@/lib/access-config"
import { useAuth } from "@/components/auth-provider"

const DEFAULT_FILTERS: CodingProblemFiltersState = {
  search: "",
  class: "Toate",
  difficulty: "Toate",
  chapter: "Toate",
}

interface CodingProblemsClientProps {
  initialProblems: CodingProblem[]
  initialMeta: CodingProblemsApiResponse["meta"]
  initialFacets: CodingProblemFacets | null
  pageSize: number
}

export function CodingProblemsClient({
  initialProblems,
  initialMeta,
  initialFacets,
  pageSize,
}: CodingProblemsClientProps) {
  const [filters, setFilters] = useState<CodingProblemFiltersState>(DEFAULT_FILTERS)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [problems, setProblems] = useState<CodingProblem[]>(initialProblems)
  const [meta, setMeta] = useState<CodingProblemsApiResponse["meta"]>(initialMeta)
  const [facets, setFacets] = useState<CodingProblemFacets | null>(initialFacets)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { isFree, isPaid } = useSubscriptionPlan()
  const { isDev, profileSyncedUserId, user } = useAuth()
  const showDevEdit = Boolean(user && profileSyncedUserId === user.id && isDev)
  const didMountRef = useRef(false)

  useEffect(() => {
    const isFirstRun = !didMountRef.current
    didMountRef.current = true
    const params = new URLSearchParams()
    if (filters.class !== "Toate") params.set("class", String(filters.class))
    if (filters.difficulty !== "Toate") params.set("difficulty", filters.difficulty)
    if (filters.chapter !== "Toate") params.set("chapter", filters.chapter)
    if (filters.search.trim().length > 0) params.set("search", filters.search.trim())
    if (currentPage > 1) params.set("page", String(currentPage))
    params.set("pageSize", String(pageSize))

    const controller = new AbortController()
    const debounceDelay = filters.search.trim().length > 0 ? 250 : 0
    const effectiveDelay = isFirstRun ? 0 : debounceDelay
    setLoading(true)
    setError(null)

    const timeoutId = window.setTimeout(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        const response = await fetch(`/api/coding-problems?${params.toString()}`, {
          signal: controller.signal,
          headers: accessToken
            ? {
              Authorization: `Bearer ${accessToken}`,
            }
            : undefined,
        })

        if (!response.ok) {
          throw new Error(`Eroare la încărcarea problemelor (${response.status})`)
        }

        const payload = (await response.json()) as CodingProblemsApiResponse
        setProblems(payload.data)
        setMeta(payload.meta)
        if (payload.facets) {
          setFacets(payload.facets)
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return
        }
        console.error("[coding-problems-client] Failed to fetch:", err)
        setError(
          err instanceof Error ? err.message : "A apărut o eroare la încărcarea problemelor."
        )
      } finally {
        setLoading(false)
      }
    }, effectiveDelay)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [filters, currentPage, pageSize])

  const totalAvailable = useMemo(() => {
    if (facets?.classes?.length) {
      return facets.classes.reduce((sum, item) => sum + item.count, 0)
    }
    return meta.total
  }, [facets, meta.total])

  const handleFiltersChange = (nextFilters: CodingProblemFiltersState) => {
    setFilters(nextFilters)
    setCurrentPage(1)
    setMobileSidebarOpen(false)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between lg:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMobileSidebarOpen(true)}
          className="rounded-full border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtre și capitole
        </Button>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden w-full shrink-0 lg:block lg:w-[300px]">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0px_24px_60px_-32px_rgba(0,0,0,1)]">
            <CodingCatalogSidebar
              filters={filters}
              chaptersByClass={facets?.chaptersByClass ?? {}}
              totalProblems={totalAvailable}
              filteredCount={meta.total}
              onFilterChange={handleFiltersChange}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-10">
          <CodingProblemFilterBar
            filters={filters}
            facets={facets}
            totalCount={totalAvailable}
            filteredCount={meta.total}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
          />

          {error && (
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-100">
              <div>
                <p className="font-semibold">A apărut o eroare</p>
                <p className="text-red-200/80">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-red-500/40 text-red-100 hover:bg-red-500/20"
                onClick={() => {
                  setFilters((prev) => ({ ...prev }))
                }}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Reîncearcă
              </Button>
            </div>
          )}

          <CodingProblemGrid
            problems={problems}
            loading={loading}
            showDevEdit={showDevEdit}
            canAccessProblem={(problem) => {
              if (ALLOW_ALL_CODING_PROBLEMS) return true
              if (isPaid) return true
              return false
            }}
          />

          {meta.totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-3 text-white/70">
              <p className="text-sm">
                Pagina {currentPage} din {meta.totalPages}
              </p>
              <Pagination>
                <PaginationContent className="flex items-center gap-3">
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-white/20 bg-transparent text-white/80 hover:bg-white/10 disabled:opacity-40"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Înapoi
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-white/20 bg-transparent text-white/80 hover:bg-white/10 disabled:opacity-40"
                      onClick={handleNextPage}
                      disabled={currentPage === meta.totalPages || loading}
                    >
                      Înainte
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[min(100vw,320px)] border-white/10 bg-[#121212] p-0 text-white">
          <SheetHeader className="border-b border-white/10 px-5 py-4">
            <SheetTitle className="text-left text-white">Filtre și capitole</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-4.5rem)] overflow-y-auto p-5">
            <CodingCatalogSidebar
              filters={filters}
              chaptersByClass={facets?.chaptersByClass ?? {}}
              totalProblems={totalAvailable}
              filteredCount={meta.total}
              onFilterChange={handleFiltersChange}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}


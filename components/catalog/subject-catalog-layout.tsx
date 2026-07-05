"use client"

import type { CSSProperties, ReactNode, UIEvent } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import {
  FilterState,
  ProblemsCatalogSidebar,
  SidebarClassProgress,
  type CatalogSidebarConfig,
} from "@/components/problems/problems-catalog-sidebar"

export interface SubjectCatalogLayoutProps {
  catalogReady: boolean
  requiresClassSelection: boolean
  selectedClassGate: string | null
  onSelectClass: (classValue: string) => void
  onClearClassGate?: () => void
  classOptions: readonly string[]
  classCardCopy: Record<string, { title: string; subtitle: string }>
  title: string
  subtitle: string
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  progressByClass: Record<string, SidebarClassProgress>
  totalProblems: number
  filteredCount: number
  effectiveUserClass: string
  sidebarConfig: CatalogSidebarConfig
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  sidebarScrolling: boolean
  onSidebarScroll: (event: UIEvent<HTMLDivElement>) => void
  onProblemsScroll: (event: UIEvent<HTMLDivElement>) => void
  children: ReactNode
  topSlot?: ReactNode
  headerPrefix?: ReactNode
}

export function SubjectCatalogLayout({
  catalogReady,
  requiresClassSelection,
  selectedClassGate,
  onSelectClass,
  onClearClassGate,
  classOptions,
  classCardCopy,
  title,
  subtitle,
  filters,
  onFilterChange,
  progressByClass,
  totalProblems,
  filteredCount,
  effectiveUserClass,
  sidebarConfig,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  sidebarScrolling,
  onSidebarScroll,
  onProblemsScroll,
  children,
  topSlot,
  headerPrefix,
}: SubjectCatalogLayoutProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.difficulty !== "Toate" ||
    filters.progress !== "Toate" ||
    filters.class !== effectiveUserClass ||
    filters.chapter !== "Toate"

  return (
    <>
      {catalogReady && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="!z-[401] flex w-[85vw] max-w-[340px] flex-col bg-white p-0 text-[#2c2f33]"
            overlayClassName="!z-[400]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="flex-shrink-0 border-b border-[#0b0c0f]/10 px-5 py-4">
              <SheetTitle className="text-left text-sm font-semibold text-[#0b0c0f]">Catalog probleme</SheetTitle>
            </SheetHeader>
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                className={cn("catalog-sidebar-scroll absolute inset-0 overflow-y-auto px-5 py-4 pb-28", sidebarScrolling && "is-scrolling")}
                onScroll={onSidebarScroll}
              >
                <ProblemsCatalogSidebar
                  filters={filters}
                  onFilterChange={onFilterChange}
                  progressByClass={progressByClass}
                  totalProblems={totalProblems}
                  filteredCount={filteredCount}
                  lockedClass={effectiveUserClass}
                  config={sidebarConfig}
                />
              </div>
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 via-white/35 to-transparent pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                aria-hidden
              />
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="dashboard-start-glow relative z-10 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] active:translate-y-1 active:shadow-[0_1px_0_#5b21b6]"
                  style={{ "--start-glow-tint": "rgba(221, 211, 255, 0.84)" } as CSSProperties}
                >
                  Salvează
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex h-full min-h-0 flex-row">
        {catalogReady && (
          <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[300px] bg-white lg:block">
            <div
              className={cn("catalog-sidebar-scroll h-full overflow-y-auto px-5 py-5", sidebarScrolling && "is-scrolling")}
              onScroll={onSidebarScroll}
            >
              <ProblemsCatalogSidebar
                filters={filters}
                onFilterChange={onFilterChange}
                progressByClass={progressByClass}
                totalProblems={totalProblems}
                filteredCount={filteredCount}
                lockedClass={effectiveUserClass}
                config={sidebarConfig}
              />
            </div>
          </aside>
        )}

        <div className={cn("relative min-w-0 flex-1", catalogReady && "lg:ml-[300px]", "h-full")}>
          <div className="absolute inset-[3px] top-0 overflow-hidden bg-[#f5f4f2] lg:rounded-xl">
            <div className="catalog-problems-scroll h-full overflow-y-auto" data-problems-scroll onScroll={onProblemsScroll}>
              {topSlot}
              <div
                className={cn(
                  "space-y-6 pb-12 pl-6 pr-[19px] sm:pl-8 sm:pr-[27px] lg:pl-10 lg:pr-[35px] xl:pl-12 xl:pr-[43px]",
                  topSlot ? "pt-2 burger:pt-6" : "pt-6",
                  MOBILE_BOTTOM_NAV_PADDING_CLASS,
                  "burger:pb-12",
                )}
              >
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
                        {classOptions.map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => onSelectClass(cls)}
                            className="rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 text-left shadow-[0_12px_30px_-25px_rgba(11,12,15,0.4)] transition hover:-translate-y-0.5 hover:border-[#0b0c0f]/20"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2c2f33]/60">{cls}</p>
                            <h3 className="mt-2 text-xl font-semibold text-[#0b0c0f]">{classCardCopy[cls]?.title ?? cls}</h3>
                            <p className="mt-2 text-sm text-[#2c2f33]/70">{classCardCopy[cls]?.subtitle ?? ""}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : (
                  <>
                    {headerPrefix}
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-[#0b0c0f] sm:text-4xl">{title}</h1>
                      <p className="text-sm text-[#2c2f33]/75 sm:text-base">{subtitle}</p>
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
                      {requiresClassSelection && selectedClassGate && onClearClassGate && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={onClearClassGate}
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
                            onClick={() => onFilterChange({ ...filters, difficulty: "Toate" })}
                            className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                          >
                            {filters.difficulty}
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {filters.class !== effectiveUserClass && (
                          <button
                            onClick={() =>
                              onFilterChange({
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
                            onClick={() => onFilterChange({ ...filters, chapter: "Toate" })}
                            className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                          >
                            {filters.chapter.length > 26 ? `${filters.chapter.slice(0, 26)}...` : filters.chapter}
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {filters.progress !== "Toate" && (
                          <button
                            onClick={() => onFilterChange({ ...filters, progress: "Toate" })}
                            className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                          >
                            {filters.progress}
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        {filters.search && (
                          <button
                            onClick={() => onFilterChange({ ...filters, search: "" })}
                            className="inline-flex items-center gap-1 rounded-full border border-[#0b0c0f]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#2c2f33]"
                          >
                            "{filters.search.length > 16 ? `${filters.search.slice(0, 16)}...` : filters.search}"
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {children}
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

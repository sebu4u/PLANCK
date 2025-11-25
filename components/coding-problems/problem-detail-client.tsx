"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowLeft, Loader2, Lock } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ProblemStatementSection } from "./problem-statement-section"
import { CodingProblem, CodingProblemExample } from "./types"
import { Button } from "@/components/ui/button"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { useCatalogTheme } from "@/components/catalog-theme-provider"
import { supabase } from "@/lib/supabaseClient"

const EmbeddedIDE = dynamic(() => import("./embedded-ide"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
        <p className="text-sm text-white/60">Se încarcă IDE-ul...</p>
      </div>
    </div>
  ),
})

// Component for applying theme background only to the statement panel
function StatementPanelBackground({ 
  children, 
  defaultBackgroundClass = 'bg-[#121212]' 
}: { 
  children: React.ReactNode
  defaultBackgroundClass?: string 
}) {
  const { themeImage, theme } = useCatalogTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasCustomTheme = mounted && themeImage && theme !== 'default'

  if (hasCustomTheme) {
    return (
      <div className="relative h-full has-custom-theme">
        {/* Absolute background image with blur - only affects this panel */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${themeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.1)', // Scale up to prevent blur edges
          }}
        />
        
        {/* Dark overlay to improve text readability */}
        <div 
          className="absolute inset-0 z-[1] bg-black/40"
          style={{
            backdropFilter: 'blur(2px)',
          }}
        />
        
        {/* Content overlay - ensures content is above background */}
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full ${defaultBackgroundClass}`}>
      {children}
    </div>
  )
}

interface CodingProblemDetailClientProps {
  slug: string
}

type DetailState =
  | { status: "idle" | "loading" }
  | { status: "loaded"; problem: CodingProblem; examples: CodingProblemExample[] }
  | { status: "error"; message: string }
  | { status: "locked" }

export function CodingProblemDetailClient({ slug }: CodingProblemDetailClientProps) {
  const [state, setState] = useState<DetailState>({ status: "idle" })

  const loadDetails = useCallback(async () => {
    setState({ status: "loading" })
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const response = await fetch(`/api/coding-problems/${slug}`, {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      })

      if (response.status === 403) {
        setState({ status: "locked" })
        return
      }

      if (!response.ok) {
        throw new Error(`Nu am putut încărca problema (status ${response.status}).`)
      }

      const payload = (await response.json()) as {
        problem: CodingProblem
        examples: CodingProblemExample[]
      }

      setState({
        status: "loaded",
        problem: payload.problem,
        examples: payload.examples,
      })
    } catch (err) {
      console.error("[problem-detail-client] Failed to load problem:", err)
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "A apărut o eroare neașteptată la încărcarea problemei.",
      })
    }
  }, [slug])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  const loadedProblem = state.status === "loaded" ? state.problem : null
  const loadedExamples = state.status === "loaded" ? state.examples : []

  const classLabel = useMemo(() => {
    if (!loadedProblem) return undefined
    return Number.isFinite(loadedProblem.class) ? `Clasa a ${loadedProblem.class}-a` : undefined
  }, [loadedProblem])

  const metaText = useMemo(() => {
    if (!loadedProblem) return ""
    const items = [loadedProblem.difficulty, classLabel, loadedProblem.chapter].filter(
      (item): item is string => Boolean(item && item.trim().length > 0)
    )
    return items.join(" • ")
  }, [loadedProblem, classLabel])

  const renderStatusContent = () => {
    switch (state.status) {
      case "loading":
      case "idle":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white/80">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p>Se încarcă problema...</p>
          </div>
        )
      case "error":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white/80">
            <p className="text-lg font-semibold text-white">Nu am putut încărca problema</p>
            <p className="max-w-md text-sm text-white/60">{state.message}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={loadDetails} className="rounded-full border border-white/15 bg-white text-black">
                Reîncearcă
              </Button>
              <Link href="/informatica/probleme">
                <Button variant="outline" className="rounded-full border-white/30 text-white">
                  Înapoi la catalog
                </Button>
              </Link>
            </div>
          </div>
        )
      case "locked":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">Problemă disponibilă cu planul PLUS+</p>
              <p className="text-white/60">
                Această problemă face parte din catalogul premium. Fă upgrade la PLUS+ sau conectează-te cu un cont
                activ pentru a continua.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/insight">
                <Button className="rounded-full bg-white text-black hover:bg-white/90">Vezi PLANCK PLUS+</Button>
              </Link>
              <Link href="/informatica/probleme">
                <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
                  Înapoi la catalog
                </Button>
              </Link>
            </div>
          </div>
        )
      case "loaded":
        return null
    }
  }

  const isReady = state.status === "loaded" && loadedProblem

  return (
    <PlanckCodeSettingsProvider>
      <CatalogThemeProvider catalogType="info" pageType="detail">
        <div className="h-screen-mobile bg-[#070707] text-white overflow-hidden flex flex-col">
          <Navigation />
          <PlanckCodeSidebar />
          
          <main className="md:ml-16 mt-16 h-screen-minus-64 flex overflow-hidden">
            {isReady ? (
              <ResizablePanelGroup direction="horizontal" className="flex-1 max-md:flex-col">
                <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="max-md:!h-auto max-md:!min-h-[50vh]">
                  <StatementPanelBackground defaultBackgroundClass="bg-[#121212]">
                    <ScrollArea className="h-full">
                      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 lg:px-12">
                        <div className="mb-8 flex flex-wrap items-center gap-3">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="font-vt323 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                          >
                            <Link
                              href="/informatica/probleme"
                              className="inline-flex items-center gap-2 px-2"
                            >
                              <ArrowLeft className="h-4 w-4" />
                              <span className="relative top-[1px]">Înapoi la catalog</span>
                            </Link>
                          </Button>
                          {metaText && (
                            <span className="font-vt323 text-sm uppercase tracking-[0.18em] text-white/50">
                              {metaText}
                            </span>
                          )}
                          {loadedProblem?.isFreeMonthly && (
                            <span className="font-vt323 text-xs uppercase tracking-[0.3em] text-emerald-300">
                              Free luna aceasta
                            </span>
                          )}
                        </div>
                        <ProblemStatementSection problem={loadedProblem} examples={loadedExamples} />
                      </div>
                    </ScrollArea>
                  </StatementPanelBackground>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-white/10 hover:bg-white/20 transition-colors max-md:hidden" />

                <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="max-md:!h-[50vh]">
                  <div className="h-full overflow-hidden bg-black">
                    <EmbeddedIDE initialCode={loadedProblem?.boilerplate_cpp || undefined} />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex h-full flex-1 items-center justify-center px-6">
                {renderStatusContent()}
              </div>
            )}
          </main>
        </div>
      </CatalogThemeProvider>
    </PlanckCodeSettingsProvider>
  )
}


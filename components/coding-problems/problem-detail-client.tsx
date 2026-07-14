"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { ArrowLeft, Loader2, Lock, Pencil, Sparkles, X } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/components/auth-provider"
import { ProblemStatementSection, ProblemStatementTabsList, type ProblemContentTab } from "./problem-statement-section"
import { CodingProblem, CodingProblemExample } from "./types"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import { canAccessCatalog } from "@/lib/dev-subjects"
import {
  buildPatchPayloadFromDraft,
  problemToContentDraft,
  type InformaticsContentDraft,
  type InformaticsPatchMetadata,
} from "@/lib/informatics-problem-content"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"
import { usePlanckIdeFloatingOptional } from "@/components/planckcode-floating-provider"
import type { FileItem } from "@/lib/types"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { useCatalogTheme } from "@/components/catalog-theme-provider"
import { supabase } from "@/lib/supabaseClient"
import { ProblemAgentChatPanel } from "./problem-agent-chat-panel"
import type { EmbeddedIdeAgentBridge } from "@/lib/planckcode/embedded-ide-agent-bridge"

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

async function getAuthJsonHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function CodingProblemDetailClient({ slug }: CodingProblemDetailClientProps) {
  const pathname = usePathname()
  const { isDev, devSubjects, isAdmin, profileSyncedUserId, user } = useAuth()
  const floatingIde = usePlanckIdeFloatingOptional()
  const registerLiveSession = floatingIde?.registerLiveSession
  const [state, setState] = useState<DetailState>({ status: "idle" })
  const [isAgentOpen, setIsAgentOpen] = useState(false)
  const [agentBridge, setAgentBridge] = useState<EmbeddedIdeAgentBridge | null>(null)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<InformaticsContentDraft | null>(null)
  const [editMetadata, setEditMetadata] = useState<InformaticsPatchMetadata>({})
  const [editBusy, setEditBusy] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editFlash, setEditFlash] = useState<string | null>(null)
  const [ideRevision, setIdeRevision] = useState(0)
  const [contentTab, setContentTab] = useState<ProblemContentTab>("enunt")

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktopViewport(typeof window !== "undefined" && window.innerWidth >= 1024)
    }
    syncViewport()
    window.addEventListener("resize", syncViewport)
    return () => window.removeEventListener("resize", syncViewport)
  }, [])

  const loadDetails = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setState({ status: "loading" })
    }
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

  const problemMetaLine = useMemo(() => {
    if (!loadedProblem) return []
    return [
      loadedProblem.difficulty?.trim() || null,
      classLabel ?? null,
      loadedProblem.chapter?.trim() || null,
    ].filter((item): item is string => Boolean(item))
  }, [loadedProblem, classLabel])

  const profileSynced = Boolean(user && profileSyncedUserId === user.id)
  const canEditProblem =
    profileSynced && canAccessCatalog(isDev, devSubjects, "informatics", isAdmin)

  const handleEnterEdit = useCallback(async () => {
    if (!loadedProblem) return
    setEditError(null)
    setEditFlash(null)
    setEditLoading(true)
    try {
      const headers = await getAuthJsonHeaders()
      if (!headers) {
        setEditError("Sesiune indisponibilă.")
        return
      }

      const res = await fetch(`/api/dev/problems/${encodeURIComponent(slug)}`, { headers })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEditError(typeof data.error === "string" ? data.error : "Nu am putut încărca datele pentru editare.")
        return
      }

      const problem = data.problem as Record<string, unknown>
      const tests = (data.tests as Array<Record<string, unknown>>) ?? []
      setEditDraft(problemToContentDraft(problem, tests))
      setEditMetadata({
        is_active: problem.is_active !== false,
        explanation_markdown:
          typeof problem.explanation_markdown === "string" ? problem.explanation_markdown : "",
      })
      setIsEditing(true)
    } finally {
      setEditLoading(false)
    }
  }, [loadedProblem, slug])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditDraft(null)
    setEditMetadata({})
    setEditError(null)
    setEditFlash(null)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!loadedProblem || !editDraft) return
    setEditBusy(true)
    setEditError(null)
    setEditFlash(null)
    try {
      const headers = await getAuthJsonHeaders()
      if (!headers) {
        setEditError("Sesiune indisponibilă.")
        return
      }

      const res = await fetch(`/api/dev/problems/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(buildPatchPayloadFromDraft(loadedProblem, editDraft, editMetadata)),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEditError(typeof data.error === "string" ? data.error : "Eroare la salvare.")
        return
      }

      setEditFlash("Problema a fost actualizată.")
      setIsEditing(false)
      setEditDraft(null)
      setEditMetadata({})
      setIdeRevision((n) => n + 1)
      await loadDetails({ silent: true })
    } finally {
      setEditBusy(false)
    }
  }, [loadedProblem, editDraft, editMetadata, slug, loadDetails])

  const handleDraftChange = useCallback((patch: Partial<InformaticsContentDraft>) => {
    setEditDraft((current) => (current ? { ...current, ...patch } : current))
  }, [])

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
              <Button onClick={() => void loadDetails()} className="rounded-full border border-white/15 bg-white text-black">
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
  const showPremiumHintsContent = Boolean(
    isEditing || loadedProblem?.canAccessPremiumHints
  )
  const floatingSession = floatingIde?.session
  const restoreFloatingWorkspace =
    Boolean(floatingSession && floatingSession.returnPath === pathname && floatingSession.files.length > 0)

  const handleFloatingWorkspaceChange = useCallback(
    (files: FileItem[], activeFileId: string) => {
      if (!registerLiveSession || !pathname) return
      registerLiveSession({
        returnPath: pathname,
        source: "problem",
        problemSlug: slug,
        defaultLanguage: loadedProblem?.language === "python" ? "python" : "cpp",
        files,
        activeFileId,
      })
    },
    [registerLiveSession, pathname, slug, loadedProblem?.language],
  )

  return (
    <CatalogThemeProvider catalogType="info" pageType="detail">
        <div className="h-screen-mobile bg-black text-white overflow-hidden flex flex-col">
          <Navigation />
          <PlanckCodeSidebar />
          
          <main className="md:ml-16 mt-16 h-screen-minus-64 flex overflow-hidden">
            {isReady ? (
              <ResizablePanelGroup direction="horizontal" className="flex-1 max-md:flex-col">
                <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="max-md:!h-auto max-md:!min-h-[50vh]">
                  <StatementPanelBackground defaultBackgroundClass="bg-[#121212]">
                    <Tabs
                      value={contentTab}
                      onValueChange={(value) => setContentTab(value as ProblemContentTab)}
                      className="flex h-full min-h-0 flex-col"
                    >
                      <div className="z-20 w-full shrink-0 bg-[#282828]">
                        <ProblemStatementTabsList
                          showPremiumContent={showPremiumHintsContent}
                          theme="dark"
                          variant="panel-header"
                        />
                      </div>
                      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
                      <ResizablePanel defaultSize={isAgentOpen ? 58 : 100} minSize={30}>
                        <ScrollArea className="h-full">
                          <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 lg:px-12">
                            <div className="mb-8 space-y-3">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                {problemMetaLine.map((item, index) => (
                                  <span key={item} className="inline-flex items-center gap-2">
                                    {index > 0 ? (
                                      <span className="text-white/25" aria-hidden>
                                        •
                                      </span>
                                    ) : null}
                                    <span className="text-white/60">{item}</span>
                                  </span>
                                ))}
                                {loadedProblem.language ? (
                                  <span className="inline-flex items-center gap-2">
                                    {problemMetaLine.length > 0 ? (
                                      <span className="text-white/25" aria-hidden>
                                        •
                                      </span>
                                    ) : null}
                                    {loadedProblem.language === "python" ? (
                                      <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-100">
                                        Python
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-100/90">
                                        C++
                                      </span>
                                    )}
                                  </span>
                                ) : null}
                                {loadedProblem.isFreeMonthly ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span className="text-white/25" aria-hidden>
                                      •
                                    </span>
                                    <span className="text-xs font-medium text-emerald-300">Free luna aceasta</span>
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                              >
                                <Link
                                  href="/informatica/probleme"
                                  className="inline-flex items-center gap-2 px-2 text-sm font-medium"
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                  Înapoi la catalog
                                </Link>
                              </Button>
                              {canEditProblem && !isEditing ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={editLoading}
                                  onClick={() => void handleEnterEdit()}
                                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                                >
                                  {editLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Pencil className="h-4 w-4" />
                                  )}
                                  Editează
                                </Button>
                              ) : null}
                              {isEditing ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={editBusy}
                                    onClick={() => void handleSaveEdit()}
                                    className="rounded-full bg-white text-black hover:bg-white/90"
                                  >
                                    {editBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvează"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={editBusy}
                                    onClick={handleCancelEdit}
                                    className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                                  >
                                    <X className="h-4 w-4" />
                                    Anulează
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAgentOpen((open) => !open)}
                                aria-pressed={isAgentOpen}
                                disabled={isEditing}
                                className={`rounded-full border-white/20 text-white hover:bg-white/20 ${
                                  isAgentOpen ? "bg-white/15" : "bg-white/10"
                                }`}
                              >
                                <Sparkles className="h-4 w-4" />
                                {isAgentOpen ? "Închide Agent" : "Planck Agent"}
                              </Button>
                              </div>
                            </div>
                            {editFlash ? (
                              <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                {editFlash}
                              </p>
                            ) : null}
                            {editError ? (
                              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                {editError}
                              </p>
                            ) : null}
                            <ProblemStatementSection
                              problem={loadedProblem}
                              examples={loadedExamples}
                              mode={isEditing && editDraft ? "edit" : "view"}
                              draft={editDraft ?? undefined}
                              onDraftChange={handleDraftChange}
                              editDisabled={editBusy}
                              activeTab={contentTab}
                              onActiveTabChange={setContentTab}
                              tabsRootPlacement="external"
                            />
                          </div>
                        </ScrollArea>
                      </ResizablePanel>

                      {isAgentOpen && isDesktopViewport ? (
                        <>
                          <ResizableHandle withHandle className="bg-white/10 hover:bg-white/20 transition-colors" />
                          <ResizablePanel defaultSize={42} minSize={24} maxSize={60}>
                            <ProblemAgentChatPanel
                              isOpen={isAgentOpen}
                              onClose={() => setIsAgentOpen(false)}
                              problem={loadedProblem}
                              examples={loadedExamples}
                              agentBridge={agentBridge}
                            />
                          </ResizablePanel>
                        </>
                      ) : null}
                    </ResizablePanelGroup>
                    </Tabs>
                  </StatementPanelBackground>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-white/10 hover:bg-white/20 transition-colors max-md:hidden" />

                <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="max-md:!h-[50vh]">
                  <div className="h-full overflow-hidden bg-black">
                    <EmbeddedIDE
                      key={`${slug}-${ideRevision}`}
                      defaultLanguage={loadedProblem.language === "python" ? "python" : "cpp"}
                      initialFiles={restoreFloatingWorkspace ? floatingSession!.files : undefined}
                      initialActiveFileId={
                        restoreFloatingWorkspace ? floatingSession!.activeFileId : undefined
                      }
                      initialCode={
                        restoreFloatingWorkspace
                          ? undefined
                          : loadedProblem.language === "python"
                            ? loadedProblem.boilerplate_python ?? undefined
                            : loadedProblem.boilerplate_cpp ?? undefined
                      }
                      problemSlug={loadedProblem.language === "python" ? slug : undefined}
                      onWorkspaceChange={handleFloatingWorkspaceChange}
                      onAgentBridgeChange={setAgentBridge}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex h-full flex-1 items-center justify-center px-6">
                {renderStatusContent()}
              </div>
            )}
          </main>

          {isReady && isAgentOpen && !isDesktopViewport ? (
            <>
              <div
                className="fixed inset-0 top-16 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                onClick={() => setIsAgentOpen(false)}
                aria-hidden="true"
              />
              <aside className="fixed inset-x-0 bottom-0 top-[42%] z-50 flex flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#141414] shadow-2xl lg:hidden">
                <ProblemAgentChatPanel
                  isOpen={isAgentOpen}
                  onClose={() => setIsAgentOpen(false)}
                  problem={loadedProblem}
                  examples={loadedExamples}
                  agentBridge={agentBridge}
                />
              </aside>
            </>
          ) : null}
        </div>
      </CatalogThemeProvider>
  )
}


"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
} from "react"
import { GRILE_INSIGHT_STARTER_CHIPS } from "@/lib/grile-insight-context"

const InsightChatSidebar = lazy(() => import("@/components/insight-chat-sidebar"))

export type OpenGrileInsightChatArgs = {
  problemStatement: string
  problemId: string
}

type GrileInsightChatContextValue = {
  openGrileChat: (args: OpenGrileInsightChatArgs) => void
  /** True while panel is mounted (includes slide-out). */
  grileChatDocked: boolean
  isDesktopViewport: boolean
}

const GrileInsightChatContext = createContext<GrileInsightChatContextValue | null>(null)

export function useGrileInsightChat(): GrileInsightChatContextValue | null {
  return useContext(GrileInsightChatContext)
}

export function GrileInsightChatProvider({ children }: { children: React.ReactNode }) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [problemStatement, setProblemStatement] = useState("")
  const [problemContextPreamble, setProblemContextPreamble] = useState("")
  const [problemId, setProblemId] = useState("grile-catalog")

  useEffect(() => {
    const sync = () => setIsDesktopViewport(typeof window !== "undefined" && window.innerWidth >= 1024)
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  const finalizePanelClose = useCallback(() => {
    setPanelMounted(false)
    setPanelOpen(false)
  }, [])

  const openGrileChat = useCallback((args: OpenGrileInsightChatArgs) => {
    setProblemStatement(args.problemStatement)
    setProblemContextPreamble("")
    setProblemId(args.problemId)
    if (panelMounted && panelOpen) {
      return
    }
    setPanelMounted(true)
    setPanelOpen(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelOpen(true)
      })
    })
  }, [panelMounted, panelOpen])

  const closeInsight = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const embedOnDesktop = panelMounted && isDesktopViewport
  const problemLightTheme = true

  const value = useMemo(
    () => ({
      openGrileChat,
      grileChatDocked: panelMounted,
      isDesktopViewport,
    }),
    [openGrileChat, panelMounted, isDesktopViewport]
  )

  return (
    <GrileInsightChatContext.Provider value={value}>
      {children}
      {panelMounted ? (
        <Suspense fallback={null}>
          <InsightChatSidebar
            isOpen={panelOpen}
            onClose={closeInsight}
            problemId={problemId}
            problemStatement={problemStatement}
            problemContextPreamble={problemContextPreamble}
            persona="problem_tutor"
            embedOnDesktop={embedOnDesktop}
            problemLightTheme={problemLightTheme}
            lightChromeWhenSlideOver={false}
            showCloseWhenDesktopEmbedded={embedOnDesktop}
            embedDesktopTopClass="top-16"
            embedDesktopHeightClass="h-[calc(100dvh-4rem)]"
            initialUserMessage={null}
            initialUserMessageDisplay={null}
            onExitAnimationComplete={finalizePanelClose}
            starterQuestionChips={GRILE_INSIGHT_STARTER_CHIPS}
          />
        </Suspense>
      ) : null}
    </GrileInsightChatContext.Provider>
  )
}

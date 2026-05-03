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
import { LEARNING_PATH_EXPLAIN_INITIAL_PROMPT } from "@/lib/learning-path-insight-context"

const InsightChatSidebar = lazy(() => import("@/components/insight-chat-sidebar"))

export type OpenLearningPathExplainChatArgs = {
  problemStatement: string
  /** Pass "" to omit default „Rezolva problema asta” prefix. */
  problemContextPreamble?: string
  initialUserMessage?: string
  /** Shown as user bubble; defaults to initialUserMessage. */
  initialUserMessageDisplay?: string | null
  /** Override session key segment (default: learning-path-item:{currentItemId}). */
  problemId?: string
}

type LearningPathExplainChatContextValue = {
  openExplainChat: (args: OpenLearningPathExplainChatArgs) => void
  /** True while panel is mounted (includes slide-out so layout stays until exit ends). */
  insightOpen: boolean
  isDesktopViewport: boolean
}

const LearningPathExplainChatContext = createContext<LearningPathExplainChatContextValue | null>(
  null
)

export function useLearningPathExplainChat(): LearningPathExplainChatContextValue | null {
  return useContext(LearningPathExplainChatContext)
}

export function LearningPathExplainChatProvider({
  currentItemId,
  children,
}: {
  currentItemId: string
  children: React.ReactNode
}) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [problemStatement, setProblemStatement] = useState("")
  const [problemContextPreamble, setProblemContextPreamble] = useState("")
  const [problemId, setProblemId] = useState(`learning-path-item:${currentItemId}`)
  const [initialUserMessage, setInitialUserMessage] = useState<string | null>(null)
  const [initialUserMessageDisplay, setInitialUserMessageDisplay] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setIsDesktopViewport(typeof window !== "undefined" && window.innerWidth >= 1024)
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  useEffect(() => {
    setProblemId(`learning-path-item:${currentItemId}`)
  }, [currentItemId])

  const finalizePanelClose = useCallback(() => {
    setPanelMounted(false)
    setPanelOpen(false)
    setInitialUserMessage(null)
    setInitialUserMessageDisplay(null)
  }, [])

  const openExplainChat = useCallback((args: OpenLearningPathExplainChatArgs) => {
    setProblemStatement(args.problemStatement)
    setProblemContextPreamble(args.problemContextPreamble ?? "")
    setProblemId(args.problemId ?? `learning-path-item:${currentItemId}`)
    const userMsg = (args.initialUserMessage ?? LEARNING_PATH_EXPLAIN_INITIAL_PROMPT).trim()
    setInitialUserMessage(userMsg)
    setInitialUserMessageDisplay(
      args.initialUserMessageDisplay !== undefined
        ? args.initialUserMessageDisplay
        : userMsg
    )
    setPanelMounted(true)
    setPanelOpen(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelOpen(true)
      })
    })
  }, [currentItemId])

  const closeInsight = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const onInitialMessageSent = useCallback(() => {
    setInitialUserMessage(null)
    setInitialUserMessageDisplay(null)
  }, [])

  const embedOnDesktop = panelMounted && isDesktopViewport
  const problemLightTheme = true

  const value = useMemo(
    () => ({
      openExplainChat,
      insightOpen: panelMounted,
      isDesktopViewport,
    }),
    [openExplainChat, panelMounted, isDesktopViewport]
  )

  return (
    <LearningPathExplainChatContext.Provider value={value}>
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
            embedDesktopTopClass="top-14"
            embedDesktopHeightClass="h-[calc(100dvh-3.5rem)]"
            initialUserMessage={initialUserMessage}
            initialUserMessageDisplay={initialUserMessageDisplay}
            onInitialMessageSent={onInitialMessageSent}
            onExitAnimationComplete={finalizePanelClose}
          />
        </Suspense>
      ) : null}
    </LearningPathExplainChatContext.Provider>
  )
}

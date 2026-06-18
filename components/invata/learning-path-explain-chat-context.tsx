"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { LEARNING_PATH_EXPLAIN_INITIAL_PROMPT } from "@/lib/learning-path-insight-context"
import { mergeLearningPathAiContext } from "@/lib/learning-path-item-ai-context"
import { LearningPathItemAiChatPanel } from "@/components/invata/learning-path-item-ai-chat-panel"
import { LearningPathItemAiChatFab } from "@/components/invata/learning-path-item-ai-chat-fab"
import { useLearningPathItemChrome } from "@/components/invata/learning-path-item-chrome-context"

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
  toggleAiChat: () => void
  /** True while panel is open or animating closed (layout margin). */
  insightOpen: boolean
  isDesktopViewport: boolean
}

const LearningPathExplainChatContext = createContext<LearningPathExplainChatContextValue | null>(
  null,
)

export function useLearningPathExplainChat(): LearningPathExplainChatContextValue | null {
  return useContext(LearningPathExplainChatContext)
}

export function LearningPathExplainChatProvider({
  currentItemId,
  baseAiContext,
  isTest = false,
  children,
}: {
  currentItemId: string
  baseAiContext: string
  isTest?: boolean
  children: React.ReactNode
}) {
  const chrome = useLearningPathItemChrome()
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [explainStatement, setExplainStatement] = useState<string | null>(null)
  const [problemContextPreamble, setProblemContextPreamble] = useState("")
  const [problemId, setProblemId] = useState(`learning-path-item:${currentItemId}`)
  const [initialUserMessage, setInitialUserMessage] = useState<string | null>(null)
  const [initialUserMessageDisplay, setInitialUserMessageDisplay] = useState<string | null>(null)
  const baseAiContextRef = useRef(baseAiContext)
  baseAiContextRef.current = baseAiContext

  useEffect(() => {
    const sync = () => setIsDesktopViewport(typeof window !== "undefined" && window.innerWidth >= 1024)
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  useEffect(() => {
    setProblemId(`learning-path-item:${currentItemId}`)
    setExplainStatement(null)
    setProblemContextPreamble("")
    setInitialUserMessage(null)
    setInitialUserMessageDisplay(null)
    if (!panelOpen) {
      setPanelMounted(false)
    }
  }, [currentItemId])

  const resolveContextStatement = useCallback(() => {
    if (explainStatement?.trim()) return explainStatement.trim()
    const dynamic = chrome?.getAiContext() ?? null
    return mergeLearningPathAiContext(baseAiContextRef.current, dynamic)
  }, [chrome, explainStatement])

  const openPanel = useCallback(() => {
    if (!isDesktopViewport || isTest) return
    setPanelMounted(true)
    setPanelOpen(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelOpen(true)
      })
    })
  }, [isDesktopViewport, isTest])

  const openExplainChat = useCallback(
    (args: OpenLearningPathExplainChatArgs) => {
      if (!isDesktopViewport || isTest) return
      setExplainStatement(args.problemStatement)
      setProblemContextPreamble(args.problemContextPreamble ?? "")
      setProblemId(args.problemId ?? `learning-path-item:${currentItemId}`)
      const userMsg = (args.initialUserMessage ?? LEARNING_PATH_EXPLAIN_INITIAL_PROMPT).trim()
      setInitialUserMessage(userMsg)
      setInitialUserMessageDisplay(
        args.initialUserMessageDisplay !== undefined
          ? args.initialUserMessageDisplay
          : userMsg,
      )
      openPanel()
    },
    [currentItemId, isDesktopViewport, isTest, openPanel],
  )

  const toggleAiChat = useCallback(() => {
    if (!isDesktopViewport || isTest) return
    if (panelOpen) {
      setPanelOpen(false)
      return
    }
    setExplainStatement(null)
    setProblemContextPreamble("")
    setInitialUserMessage(null)
    setInitialUserMessageDisplay(null)
    openPanel()
  }, [isDesktopViewport, isTest, openPanel, panelOpen])

  const closeInsight = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const onInitialMessageSent = useCallback(() => {
    setInitialUserMessage(null)
    setInitialUserMessageDisplay(null)
  }, [])

  const layoutOpen = panelMounted && panelOpen && isDesktopViewport

  const value = useMemo(
    () => ({
      openExplainChat,
      toggleAiChat,
      insightOpen: layoutOpen,
      isDesktopViewport,
    }),
    [openExplainChat, toggleAiChat, layoutOpen, isDesktopViewport],
  )

  const showFab = !isTest && isDesktopViewport && !panelOpen

  return (
    <LearningPathExplainChatContext.Provider value={value}>
      {children}
      {!isTest && isDesktopViewport && panelMounted ? (
        <LearningPathItemAiChatPanel
          isOpen={panelOpen}
          onClose={closeInsight}
          resetKey={currentItemId}
          problemId={problemId}
          getContextStatement={resolveContextStatement}
          problemContextPreamble={problemContextPreamble}
          initialUserMessage={initialUserMessage}
          initialUserMessageDisplay={initialUserMessageDisplay}
          onInitialMessageSent={onInitialMessageSent}
        />
      ) : null}
      <LearningPathItemAiChatFab visible={showFab} onClick={toggleAiChat} />
    </LearningPathExplainChatContext.Provider>
  )
}

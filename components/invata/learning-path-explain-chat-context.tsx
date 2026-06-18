"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { LEARNING_PATH_EXPLAIN_INITIAL_PROMPT } from "@/lib/learning-path-insight-context"
import { useInsightGlobal } from "@/components/insight-global-provider"

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
  /** Always false now; the global provider handles panel lifecycle. */
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
  const insightGlobal = useInsightGlobal()
  const closeInsight = insightGlobal?.closeInsight
  const previousItemIdRef = useRef(currentItemId)

  useEffect(() => {
    if (previousItemIdRef.current === currentItemId) return

    previousItemIdRef.current = currentItemId
    closeInsight?.()
  }, [closeInsight, currentItemId])

  const openExplainChat = useCallback(
    (args: OpenLearningPathExplainChatArgs) => {
      const userMsg = (args.initialUserMessage ?? LEARNING_PATH_EXPLAIN_INITIAL_PROMPT).trim()
      insightGlobal?.openInsight({
        problemStatement: args.problemStatement,
        problemContextPreamble: args.problemContextPreamble ?? "",
        problemId: args.problemId ?? `learning-path-item:${currentItemId}`,
        initialUserMessage: userMsg,
        initialUserMessageDisplay:
          args.initialUserMessageDisplay !== undefined
            ? args.initialUserMessageDisplay
            : userMsg,
        persona: "problem_tutor",
      })
    },
    [insightGlobal, currentItemId]
  )

  const value = useMemo(
    () => ({
      openExplainChat,
      insightOpen: false,
      isDesktopViewport:
        typeof window !== "undefined" && window.innerWidth >= 1024,
    }),
    [openExplainChat]
  )

  return (
    <LearningPathExplainChatContext.Provider value={value}>
      {children}
    </LearningPathExplainChatContext.Provider>
  )
}

"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { useGrileSubject } from "./grile-subject-context"
import { useInsightGlobal } from "@/components/insight-global-provider"

export type OpenGrileInsightChatArgs = {
  problemStatement: string
  problemId: string
}

type GrileInsightChatContextValue = {
  openGrileChat: (args: OpenGrileInsightChatArgs) => void
  /** Always false now; the global provider handles panel lifecycle. */
  grileChatDocked: boolean
  isDesktopViewport: boolean
}

const GrileInsightChatContext = createContext<GrileInsightChatContextValue | null>(null)

export function useGrileInsightChat(): GrileInsightChatContextValue | null {
  return useContext(GrileInsightChatContext)
}

export function GrileInsightChatProvider({ children }: { children: React.ReactNode }) {
  const { insightStarterChips } = useGrileSubject()
  const insightGlobal = useInsightGlobal()
  const openInsight = insightGlobal?.openInsight
  const setInsightPageContext = insightGlobal?.setPageContext
  const clearInsightPageContext = insightGlobal?.clearPageContext

  useEffect(() => {
    if (!setInsightPageContext) return

    setInsightPageContext({
      problemId: "grile-catalog",
      problemStatement: "",
      problemContextPreamble: "",
      persona: "problem_tutor",
      starterQuestionChips: insightStarterChips,
    })

    return () => {
      clearInsightPageContext?.()
    }
  }, [clearInsightPageContext, insightStarterChips, setInsightPageContext])

  const openGrileChat = useCallback(
    (args: OpenGrileInsightChatArgs) => {
      openInsight?.({
        problemId: args.problemId,
        problemStatement: args.problemStatement,
        problemContextPreamble: "",
        persona: "problem_tutor",
        starterQuestionChips: insightStarterChips,
      })
    },
    [insightStarterChips, openInsight]
  )

  const value = useMemo(
    () => ({
      openGrileChat,
      grileChatDocked: false,
      isDesktopViewport: typeof window !== "undefined" && window.innerWidth >= 1024,
    }),
    [openGrileChat]
  )

  return (
    <GrileInsightChatContext.Provider value={value}>
      {children}
    </GrileInsightChatContext.Provider>
  )
}

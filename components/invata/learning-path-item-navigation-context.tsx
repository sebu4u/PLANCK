"use client"

import { createContext, useCallback, useContext } from "react"
import { useRouter } from "next/navigation"
import type { LearningPathSlideDirection } from "@/components/invata/learning-path-item-slide-container"

export interface LearningPathItemNavigationContextValue {
  itemIndex: number
  nextItemHref: string
  prevItemHref: string | null
  isLastItem: boolean
  isNavigating: boolean
  slideDirection: LearningPathSlideDirection
  goToNextItem: () => Promise<void>
  goToPrevItem: () => Promise<void>
  usesFizicaLessonCompletionScreen?: boolean
  animateFirstItemEntry?: boolean
}

const LearningPathItemNavigationContext =
  createContext<LearningPathItemNavigationContextValue | null>(null)

export function LearningPathItemNavigationProvider({
  value,
  children,
}: {
  value: LearningPathItemNavigationContextValue
  children: React.ReactNode
}) {
  return (
    <LearningPathItemNavigationContext.Provider value={value}>
      {children}
    </LearningPathItemNavigationContext.Provider>
  )
}

export function useLearningPathItemNavigation(): LearningPathItemNavigationContextValue {
  const ctx = useContext(LearningPathItemNavigationContext)
  if (!ctx) {
    throw new Error("useLearningPathItemNavigation must be used within LearningPathItemNavigationProvider")
  }
  return ctx
}

export function useOptionalLearningPathItemNavigation(): LearningPathItemNavigationContextValue | null {
  return useContext(LearningPathItemNavigationContext)
}

export function useNavigateToNextLearningPathItem(nextItemHref: string) {
  const nav = useOptionalLearningPathItemNavigation()
  const router = useRouter()

  return useCallback(async () => {
    if (nav) {
      await nav.goToNextItem()
      return
    }
    router.push(nextItemHref)
  }, [nav, nextItemHref, router])
}

export function useNavigateToPrevLearningPathItem(prevItemHref: string | null) {
  const nav = useOptionalLearningPathItemNavigation()
  const router = useRouter()

  return useCallback(async () => {
    if (!prevItemHref) return
    if (nav) {
      await nav.goToPrevItem()
      return
    }
    router.push(prevItemHref)
  }, [nav, prevItemHref, router])
}

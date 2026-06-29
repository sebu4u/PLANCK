"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { LearningPathHubChapter } from "@/lib/supabase-learning-paths"

const InvataHubNavContext = createContext<LearningPathHubChapter[] | null>(null)
const InvataHubNavUpdateContext = createContext<((chapters: LearningPathHubChapter[]) => void) | null>(null)

export function InvataHubNavProvider({
  chapters,
  children,
}: {
  chapters: LearningPathHubChapter[]
  children: ReactNode
}) {
  const [currentChapters, setCurrentChapters] = useState(chapters)

  useEffect(() => {
    setCurrentChapters(chapters)
  }, [chapters])

  return (
    <InvataHubNavUpdateContext.Provider value={setCurrentChapters}>
      <InvataHubNavContext.Provider value={currentChapters.length ? currentChapters : null}>
        {children}
      </InvataHubNavContext.Provider>
    </InvataHubNavUpdateContext.Provider>
  )
}

export function useInvataHubChapters(): LearningPathHubChapter[] | null {
  return useContext(InvataHubNavContext)
}

export function useSetInvataHubChapters(): ((chapters: LearningPathHubChapter[]) => void) | null {
  return useContext(InvataHubNavUpdateContext)
}

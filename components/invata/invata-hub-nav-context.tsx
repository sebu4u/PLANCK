"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { LearningPathChapter } from "@/lib/supabase-learning-paths"

const InvataHubNavContext = createContext<LearningPathChapter[] | null>(null)

export function InvataHubNavProvider({
  chapters,
  children,
}: {
  chapters: LearningPathChapter[]
  children: ReactNode
}) {
  return (
    <InvataHubNavContext.Provider value={chapters.length ? chapters : null}>
      {children}
    </InvataHubNavContext.Provider>
  )
}

export function useInvataHubChapters(): LearningPathChapter[] | null {
  return useContext(InvataHubNavContext)
}

"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

/**
 * Shared state between the personalized course generator and the learning paths
 * list on /invata. When the generator kicks off a new course, it pushes an
 * optimistic in-progress chapter here so the list shows a progress card
 * INSTANTLY — before any server refresh — at the top of the chapter list.
 * The progress card polls the status endpoint and calls router.refresh() when
 * the chapter flips to "ready", at which point the server-rendered real chapter
 * replaces the optimistic one.
 */

export interface OptimisticInProgressChapter {
  id: string
  slug: string
  title: string
  description: string | null
  is_personalized: true
  is_active: false
  generation_status: "creating"
  generation_metadata: Record<string, unknown> | null
  // Marker so the list can drop the optimistic entry once the real one appears.
  __optimistic: true
}

interface PersonalizedCourseGenerationContextValue {
  optimisticChapters: OptimisticInProgressChapter[]
  addOptimisticChapter: (chapter: OptimisticInProgressChapter) => void
  removeOptimisticChapter: (id: string) => void
}

const PersonalizedCourseGenerationContext = createContext<PersonalizedCourseGenerationContextValue | null>(null)

export function PersonalizedCourseGenerationProvider({ children }: { children: ReactNode }) {
  const [optimisticChapters, setOptimisticChapters] = useState<OptimisticInProgressChapter[]>([])

  const addOptimisticChapter = useCallback((chapter: OptimisticInProgressChapter) => {
    setOptimisticChapters((current) => {
      // Avoid duplicates (e.g. if the user double-clicks).
      if (current.some((c) => c.id === chapter.id)) return current
      return [chapter, ...current]
    })
  }, [])

  const removeOptimisticChapter = useCallback((id: string) => {
    setOptimisticChapters((current) => current.filter((c) => c.id !== id))
  }, [])

  const value = useMemo(
    () => ({ optimisticChapters, addOptimisticChapter, removeOptimisticChapter }),
    [optimisticChapters, addOptimisticChapter, removeOptimisticChapter],
  )

  return (
    <PersonalizedCourseGenerationContext.Provider value={value}>
      {children}
    </PersonalizedCourseGenerationContext.Provider>
  )
}

export function usePersonalizedCourseGeneration(): PersonalizedCourseGenerationContextValue | null {
  return useContext(PersonalizedCourseGenerationContext)
}

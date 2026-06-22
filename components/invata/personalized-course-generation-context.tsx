"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "@/lib/sonner"
import { PERSONALIZED_GENERATION_STALE_REASON } from "@/lib/personalized-courses/generation-stale"

export type GenerationOverlayPhase = "intro" | "videoCenter" | "corner" | null

export interface GenerationProgress {
  stage: string | null
  percent: number
  message: string | null
}

export interface ActiveGeneration {
  chapterId: string
  chapterSlug: string
  title: string
  topicLabel: string
  overlayPhase: GenerationOverlayPhase
  progress: GenerationProgress
}

export interface StartActiveGenerationInput {
  chapterId: string
  chapterSlug: string
  title: string
  topicLabel: string
  skipIntro?: boolean
  initialProgress?: GenerationProgress | null
}

interface PersonalizedCourseGenerationContextValue {
  activeGeneration: ActiveGeneration | null
  startActiveGeneration: (input: StartActiveGenerationInput) => void
  advanceOverlayPhase: (phase: GenerationOverlayPhase) => void
  clearActiveGeneration: () => void
  cancelActiveGeneration: () => Promise<void>
}

const POLL_INTERVAL_MS = 5000

const PersonalizedCourseGenerationContext = createContext<PersonalizedCourseGenerationContextValue | null>(null)

export function PersonalizedCourseGenerationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null)
  const handledTerminalRef = useRef<string | null>(null)
  const hydratedRef = useRef(false)
  const userInitiatedRef = useRef(false)
  const activeGenerationRef = useRef<ActiveGeneration | null>(null)

  useEffect(() => {
    activeGenerationRef.current = activeGeneration
  }, [activeGeneration])

  const clearActiveGeneration = useCallback(() => {
    setActiveGeneration(null)
  }, [])

  const startActiveGeneration = useCallback((input: StartActiveGenerationInput) => {
    userInitiatedRef.current = true
    handledTerminalRef.current = null
    setActiveGeneration({
      chapterId: input.chapterId,
      chapterSlug: input.chapterSlug,
      title: input.title,
      topicLabel: input.topicLabel,
      overlayPhase: input.skipIntro ? "corner" : "intro",
      progress: input.initialProgress ?? { stage: null, percent: 0, message: null },
    })
  }, [])

  const advanceOverlayPhase = useCallback((phase: GenerationOverlayPhase) => {
    setActiveGeneration((current) => {
      if (!current) return current
      return { ...current, overlayPhase: phase }
    })
  }, [])

  const handleReady = useCallback(
    (generation: ActiveGeneration) => {
      if (handledTerminalRef.current === generation.chapterId) return
      handledTerminalRef.current = generation.chapterId

      toast.success("Traseul tău e gata!", {
        description: generation.title,
        action: {
          label: "Deschide",
          onClick: () => router.push(`/invata/${generation.chapterSlug}`),
        },
      })

      userInitiatedRef.current = false
      setActiveGeneration(null)

      if (pathname === "/invata") {
        router.refresh()
      }
    },
    [pathname, router],
  )

  const handleFailed = useCallback(
    (generation: ActiveGeneration, reason: string | null, options?: { silent?: boolean }) => {
      if (handledTerminalRef.current === generation.chapterId) return
      handledTerminalRef.current = generation.chapterId

      const silent =
        options?.silent === true ||
        reason === PERSONALIZED_GENERATION_STALE_REASON ||
        !userInitiatedRef.current

      if (!silent) {
        toast.error("Generarea traseului a eșuat", {
          description: reason ?? "Încearcă din nou.",
        })
      }

      userInitiatedRef.current = false
      setActiveGeneration(null)
    },
    [],
  )

  const cancelActiveGeneration = useCallback(async () => {
    const current = activeGenerationRef.current
    if (!current) return

    try {
      const res = await fetch("/api/personalized-courses/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: current.chapterId }),
        credentials: "same-origin",
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        toast.error("Nu am putut opri generarea", {
          description: data.error?.trim() || "Încearcă din nou.",
        })
        return
      }

      handledTerminalRef.current = current.chapterId
      userInitiatedRef.current = false
      setActiveGeneration(null)
      toast.success("Generarea traseului a fost oprită.")

      if (pathname === "/invata") {
        router.refresh()
      }
    } catch {
      toast.error("Conexiunea a eșuat. Încearcă din nou.")
    }
  }, [pathname, router])

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    void (async () => {
      try {
        const res = await fetch("/api/personalized-courses/active", { credentials: "same-origin" })
        if (!res.ok) return
        const data = (await res.json().catch(() => ({}))) as {
          chapters?: Array<{
            id: string
            slug: string
            title: string
            progress?: GenerationProgress | null
          }>
        }
        const chapter = data.chapters?.[0]
        if (!chapter) return

        setActiveGeneration((current) => {
          if (current) return current
          return {
            chapterId: chapter.id,
            chapterSlug: chapter.slug,
            title: chapter.title,
            topicLabel: chapter.title,
            overlayPhase: "corner",
            progress: chapter.progress ?? { stage: null, percent: 0, message: null },
          }
        })
      } catch {
        // ignore hydration errors
      }
    })()
  }, [])

  useEffect(() => {
    const chapterId = activeGeneration?.chapterId
    if (!chapterId) return

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/personalized-courses/status?chapterId=${chapterId}`, {
          credentials: "same-origin",
        })
        if (!res.ok || cancelled) return

        const data = (await res.json().catch(() => ({}))) as {
          status?: "creating" | "ready" | "failed"
          stage?: string | null
          percent?: number
          message?: string | null
          failureReason?: string | null
          stale?: boolean
        }

        if (cancelled) return

        setActiveGeneration((current) => {
          if (!current || current.chapterId !== chapterId) return current
          const nextPercent =
            typeof data.percent === "number"
              ? Math.max(current.progress.percent, data.percent)
              : current.progress.percent
          return {
            ...current,
            progress: {
              stage: data.stage ?? current.progress.stage,
              percent: nextPercent,
              message: data.message ?? current.progress.message,
            },
          }
        })

        const current = activeGenerationRef.current
        if (!current || current.chapterId !== chapterId) return

        if (data.status === "ready") {
          handleReady(current)
        } else if (data.status === "failed") {
          handleFailed(current, data.failureReason ?? data.message ?? null, {
            silent: data.stale === true,
          })
        }
      } catch {
        // network blip
      }
    }

    void poll()
    const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [activeGeneration?.chapterId, handleFailed, handleReady])

  const value = useMemo(
    () => ({
      activeGeneration,
      startActiveGeneration,
      advanceOverlayPhase,
      clearActiveGeneration,
      cancelActiveGeneration,
    }),
    [activeGeneration, startActiveGeneration, advanceOverlayPhase, clearActiveGeneration, cancelActiveGeneration],
  )

  return (
    <PersonalizedCourseGenerationContext.Provider value={value}>
      {children}
    </PersonalizedCourseGenerationContext.Provider>
  )
}

export function usePersonalizedCourseGeneration(): PersonalizedCourseGenerationContextValue {
  const context = useContext(PersonalizedCourseGenerationContext)
  if (!context) {
    throw new Error("usePersonalizedCourseGeneration must be used within PersonalizedCourseGenerationProvider")
  }
  return context
}

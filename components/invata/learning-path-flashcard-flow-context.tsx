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
import type { LearningPathSlideDirection } from "@/components/invata/learning-path-item-slide-container"
import {
  assessFlashcard,
  completeFlashcardSession,
  generateFlashcards,
  skipFlashcardOffer,
} from "@/lib/learning-path-flashcard-client"
import {
  buildFlashcardOfferParams,
  type LearningPathFlashcardBridge,
} from "@/lib/learning-path-flashcard-bridge"
import type { FlashcardSessionPayload } from "@/lib/learning-path-flashcard-types"

export type LearningPathFlashcardPhase = "idle" | "offer" | "session"

interface OpenFlashcardOfferParams {
  bridge: LearningPathFlashcardBridge
  nextItemHref: string
}

interface LearningPathFlashcardFlowContextValue {
  phase: LearningPathFlashcardPhase
  isActive: boolean
  slideKey: string
  slideDirection: LearningPathSlideDirection
  session: FlashcardSessionPayload | null
  generating: boolean
  generateError: string | null
  openOffer: (params: OpenFlashcardOfferParams) => void
  skipOffer: () => Promise<void>
  acceptOffer: () => Promise<void>
  assessCard: (cardId: string, knew: boolean) => Promise<void>
  completeSession: () => Promise<void>
}

const LearningPathFlashcardFlowContext =
  createContext<LearningPathFlashcardFlowContextValue | null>(null)

export function LearningPathFlashcardFlowProvider({
  children,
  currentItemId,
  goToNextItem,
}: {
  children: ReactNode
  currentItemId: string
  goToNextItem: () => Promise<void>
}) {
  const [phase, setPhase] = useState<LearningPathFlashcardPhase>("idle")
  const [slideDirection, setSlideDirection] = useState<LearningPathSlideDirection>("forward")
  const [session, setSession] = useState<FlashcardSessionPayload | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const pendingRef = useRef<OpenFlashcardOfferParams | null>(null)
  const sourceItemIdRef = useRef<string | null>(null)

  useEffect(() => {
    setPhase("idle")
    setSession(null)
    setGenerating(false)
    setGenerateError(null)
    pendingRef.current = null
    sourceItemIdRef.current = null
  }, [currentItemId])

  const slideKey = useMemo(() => {
    if (phase === "offer" && sourceItemIdRef.current) {
      return `flashcard-offer-${sourceItemIdRef.current}`
    }
    if (phase === "session" && session) {
      return `flashcard-session-${session.sessionId}`
    }
    return currentItemId
  }, [currentItemId, phase, session])

  const isActive = phase !== "idle"

  const openOffer = useCallback((params: OpenFlashcardOfferParams) => {
    pendingRef.current = params
    sourceItemIdRef.current = params.bridge.meta.itemId
    setGenerateError(null)
    setSlideDirection("forward")
    setPhase("offer")
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  const skipOffer = useCallback(async () => {
    const pending = pendingRef.current
    if (pending) {
      try {
        await skipFlashcardOffer(pending.bridge.meta.itemId)
      } catch {
        // Continue navigation even if skip recording fails
      }
    }
    await goToNextItem()
  }, [goToNextItem])

  const acceptOffer = useCallback(async () => {
    const pending = pendingRef.current
    if (!pending) return
    setGenerating(true)
    setGenerateError(null)
    try {
      const payload = await generateFlashcards(
        buildFlashcardOfferParams(pending.bridge, pending.nextItemHref)
      )
      setSession(payload)
      setSlideDirection("forward")
      setPhase("session")
      window.scrollTo({ top: 0, behavior: "instant" })
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Generarea a eșuat")
    } finally {
      setGenerating(false)
    }
  }, [])

  const assessCard = useCallback(
    async (cardId: string, knew: boolean) => {
      if (!session) return
      await assessFlashcard(session.sessionId, cardId, knew)
    },
    [session]
  )

  const completeSession = useCallback(async () => {
    if (session) {
      try {
        await completeFlashcardSession(session.sessionId)
      } catch {
        // Continue navigation even if completion recording fails
      }
    }
    await goToNextItem()
  }, [goToNextItem, session])

  const value = useMemo(
    () => ({
      phase,
      isActive,
      slideKey,
      slideDirection,
      session,
      generating,
      generateError,
      openOffer,
      skipOffer,
      acceptOffer,
      assessCard,
      completeSession,
    }),
    [
      acceptOffer,
      assessCard,
      completeSession,
      generateError,
      generating,
      isActive,
      openOffer,
      phase,
      session,
      skipOffer,
      slideDirection,
      slideKey,
    ]
  )

  return (
    <LearningPathFlashcardFlowContext.Provider value={value}>
      {children}
    </LearningPathFlashcardFlowContext.Provider>
  )
}

export function useLearningPathFlashcardFlow(): LearningPathFlashcardFlowContextValue {
  const ctx = useContext(LearningPathFlashcardFlowContext)
  if (!ctx) {
    throw new Error(
      "useLearningPathFlashcardFlow must be used within LearningPathFlashcardFlowProvider"
    )
  }
  return ctx
}

export function useOptionalLearningPathFlashcardFlow(): LearningPathFlashcardFlowContextValue | null {
  return useContext(LearningPathFlashcardFlowContext)
}

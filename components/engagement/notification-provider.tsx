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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { EngagementCard } from "@/components/engagement/engagement-card"
import { ENGAGEMENT_QUEUE_LIMIT } from "@/lib/engagement/cooldowns"
import {
  getMsUntilGlobalAvailable,
  isEngagementCardDismissed,
  logEngagementNotificationShown,
  markEngagementCardDismissed,
  markEngagementNotificationShown,
  shouldSkipEngagementNotification,
} from "@/lib/engagement/storage"
import type {
  EngagementNotification,
  EngagementNotificationInput,
} from "@/lib/engagement/types"

interface EngagementContextValue {
  push: (notification: EngagementNotificationInput) => void
}

const EngagementContext = createContext<EngagementContextValue | null>(null)

function createNotification(input: EngagementNotificationInput): EngagementNotification {
  const fallbackId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    ...input,
    id: input.id ?? fallbackId,
  }
}

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const [queue, setQueue] = useState<EngagementNotification[]>([])
  const [activeCard, setActiveCard] = useState<EngagementNotification | null>(null)
  const [cardVisible, setCardVisible] = useState(false)
  const processingRef = useRef(false)

  const renderNotification = useCallback(
    (notification: EngagementNotification) => {
      markEngagementNotificationShown(notification, user?.id)
      logEngagementNotificationShown(notification, user?.id)

      const { payload } = notification
      if (notification.surface === "toast") {
        toast(payload.title, {
          description: payload.description,
          action: payload.cta
            ? {
                label: payload.cta.label,
                onClick: () => {
                  payload.cta?.onClick?.()
                  if (payload.cta?.href) router.push(payload.cta.href)
                },
              }
            : undefined,
        })
        return
      }

      setActiveCard(notification)
      window.setTimeout(() => setCardVisible(true), 50)
    },
    [router, user?.id]
  )

  const processQueue = useCallback(() => {
    if (processingRef.current || activeCard) return
    processingRef.current = true

    setQueue((currentQueue) => {
      const next = [...currentQueue].sort((a, b) => b.priority - a.priority)
      const notification = next.shift()

      if (!notification) {
        processingRef.current = false
        return currentQueue
      }

      if (
        isEngagementCardDismissed(notification, user?.id) ||
        shouldSkipEngagementNotification(notification, user?.id)
      ) {
        processingRef.current = false
        return next
      }

      renderNotification(notification)
      processingRef.current = false
      return next
    })
  }, [activeCard, renderNotification, user?.id])

  const push = useCallback(
    (input: EngagementNotificationInput) => {
      const notification = createNotification(input)
      if (
        isEngagementCardDismissed(notification, user?.id) ||
        shouldSkipEngagementNotification(notification, user?.id)
      ) {
        const waitMs = getMsUntilGlobalAvailable(user?.id)
        if (waitMs <= 0) return

        setQueue((currentQueue) =>
          [...currentQueue, notification]
            .sort((a, b) => b.priority - a.priority)
            .slice(0, ENGAGEMENT_QUEUE_LIMIT)
        )
        return
      }

      if (!activeCard) {
        renderNotification(notification)
        return
      }

      setQueue((currentQueue) =>
        [...currentQueue, notification]
          .sort((a, b) => b.priority - a.priority)
          .slice(0, ENGAGEMENT_QUEUE_LIMIT)
      )
    },
    [activeCard, renderNotification, user?.id]
  )

  useEffect(() => {
    if (!queue.length || activeCard) return
    const waitMs = Math.max(500, getMsUntilGlobalAvailable(user?.id))
    const timer = window.setTimeout(processQueue, waitMs)
    return () => window.clearTimeout(timer)
  }, [activeCard, processQueue, queue.length, user?.id])

  const dismissActiveCard = useCallback(() => {
    if (!activeCard) return
    markEngagementCardDismissed(activeCard, user?.id)
    setCardVisible(false)
    window.setTimeout(() => {
      setActiveCard(null)
      processQueue()
    }, 250)
  }, [activeCard, processQueue, user?.id])

  const value = useMemo<EngagementContextValue>(() => ({ push }), [push])

  return (
    <EngagementContext.Provider value={value}>
      {children}
      {activeCard ? (
        <EngagementCard
          notification={activeCard}
          visible={cardVisible}
          onDismiss={dismissActiveCard}
        />
      ) : null}
    </EngagementContext.Provider>
  )
}

export function useEngagement() {
  const ctx = useContext(EngagementContext)
  if (!ctx) {
    return {
      push: () => {},
    } satisfies EngagementContextValue
  }
  return ctx
}


"use client"

import { useEffect, useRef, useState } from "react"
import {
  AI_CHAT_FAB_NUDGE_ENTER_MS,
  AI_CHAT_FAB_NUDGE_EXIT_MS,
  AI_CHAT_FAB_NUDGE_VISIBLE_MS,
  pickRandomAiChatFabNudgeMessage,
  randomAiChatFabNudgeIntervalMs,
} from "@/lib/ai-chat-fab-nudge-messages"

export type AiChatFabNudgePhase = "hidden" | "entering" | "visible" | "exiting"

export function useAiChatFabNudge(enabled: boolean) {
  const [message, setMessage] = useState<string | null>(null)
  const [phase, setPhase] = useState<AiChatFabNudgePhase>("hidden")
  const lastMessageRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled) {
      setPhase("hidden")
      setMessage(null)
      return
    }

    let cancelled = false
    const timeouts: number[] = []

    const schedule = (delay: number, fn: () => void) => {
      timeouts.push(window.setTimeout(fn, delay))
    }

    const showNextNudge = () => {
      if (cancelled) return

      const nextMessage = pickRandomAiChatFabNudgeMessage(lastMessageRef.current)
      lastMessageRef.current = nextMessage
      setMessage(nextMessage)
      setPhase("entering")

      schedule(AI_CHAT_FAB_NUDGE_ENTER_MS, () => {
        if (cancelled) return
        setPhase("visible")
      })

      schedule(AI_CHAT_FAB_NUDGE_ENTER_MS + AI_CHAT_FAB_NUDGE_VISIBLE_MS, () => {
        if (cancelled) return
        setPhase("exiting")
      })

      schedule(
        AI_CHAT_FAB_NUDGE_ENTER_MS + AI_CHAT_FAB_NUDGE_VISIBLE_MS + AI_CHAT_FAB_NUDGE_EXIT_MS,
        () => {
          if (cancelled) return
          setPhase("hidden")
          setMessage(null)
          schedule(randomAiChatFabNudgeIntervalMs(), showNextNudge)
        },
      )
    }

    schedule(randomAiChatFabNudgeIntervalMs(), showNextNudge)

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [enabled])

  const isBubbleVisible = phase !== "hidden" && Boolean(message)

  return { message, phase, isBubbleVisible }
}

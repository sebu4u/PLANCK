"use client"

import { cn } from "@/lib/utils"
import type { AiChatFabNudgePhase } from "@/hooks/use-ai-chat-fab-nudge"

interface AiChatFabSpeechBubbleProps {
  message: string
  phase: AiChatFabNudgePhase
}

export function AiChatFabSpeechBubble({ message, phase }: AiChatFabSpeechBubbleProps) {
  if (phase === "hidden") return null

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-full right-0 mb-3 max-w-[min(16rem,calc(100vw-6rem))]",
        phase === "entering" && "ai-chat-fab-nudge-enter",
        phase === "visible" && "ai-chat-fab-nudge-visible",
        phase === "exiting" && "ai-chat-fab-nudge-exit",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative rounded-2xl bg-white px-3.5 py-2.5 text-sm font-medium leading-snug text-[#1a1a1a] shadow-[0_8px_28px_rgba(11,12,15,0.16)] ring-1 ring-black/[0.06]">
        {message}
        <span
          aria-hidden
          className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white ring-1 ring-black/[0.06]"
        />
      </div>
    </div>
  )
}

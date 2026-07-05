"use client"

import { cn } from "@/lib/utils"
import { useAiChatFabNudge } from "@/hooks/use-ai-chat-fab-nudge"
import { AiChatFabSpeechBubble } from "@/components/invata/ai-chat-fab-speech-bubble"

interface LearningPathItemAiChatFabProps {
  visible: boolean
  onClick: () => void
  className?: string
  nudgeEnabled?: boolean
  /** When false, FAB is desktop-only (lg+). Default false. */
  showOnMobile?: boolean
}

export function LearningPathItemAiChatFab({
  visible,
  onClick,
  className,
  nudgeEnabled = true,
  showOnMobile = false,
}: LearningPathItemAiChatFabProps) {
  const { message, phase, isBubbleVisible } = useAiChatFabNudge(visible && nudgeEnabled)

  if (!visible) return null

  return (
    <div
      className={cn(
        "fizica-ai-fab-enter relative fixed bottom-8 right-8 z-[310]",
        showOnMobile ? "flex" : "hidden lg:block",
        className,
      )}
    >
      {isBubbleVisible && message ? (
        <AiChatFabSpeechBubble message={message} phase={phase} />
      ) : null}

      <button
        type="button"
        onClick={onClick}
        aria-label="Deschide asistent AI"
        className={cn(
          "relative flex h-24 w-24 shrink-0 items-center justify-center",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0c0f]/20 focus-visible:ring-offset-2",
        )}
      >
        <img
          src="/streak-icon.png"
          alt=""
          className="h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(11,12,15,0.28)]"
          width={96}
          height={96}
        />
      </button>
    </div>
  )
}

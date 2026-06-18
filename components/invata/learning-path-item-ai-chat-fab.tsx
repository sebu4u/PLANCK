"use client"

import { cn } from "@/lib/utils"

interface LearningPathItemAiChatFabProps {
  visible: boolean
  onClick: () => void
}

export function LearningPathItemAiChatFab({ visible, onClick }: LearningPathItemAiChatFabProps) {
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Deschide asistent AI"
      className={cn(
        "fizica-ai-fab-enter fixed bottom-8 right-8 z-[310] hidden h-24 w-24 items-center justify-center",
        "transition-transform duration-200 hover:scale-105 active:scale-95 lg:flex",
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
  )
}

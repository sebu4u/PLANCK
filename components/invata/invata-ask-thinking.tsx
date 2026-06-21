"use client"

import { cn } from "@/lib/utils"

export function InvataAskThinkingDots({ className }: { className?: string }) {
  return (
    <div className={cn("invata-ask-thinking-dots flex items-center gap-1.5", className)} aria-hidden="true">
      <span className="invata-ask-thinking-dot" />
      <span className="invata-ask-thinking-dot invata-ask-thinking-dot-delay-1" />
      <span className="invata-ask-thinking-dot invata-ask-thinking-dot-delay-2" />
      <span className="invata-ask-thinking-dot invata-ask-thinking-dot-delay-3" />
    </div>
  )
}

export function InvataAskUserBubble({ message }: { message: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#f3f3f3] px-3.5 py-2.5 text-sm leading-relaxed text-[#111111]">
        {message}
      </div>
    </div>
  )
}

export function InvataAskThinkingPanel({ userMessage }: { userMessage: string }) {
  return (
    <div className="space-y-4 pt-1">
      <InvataAskThinkingDots />
      <InvataAskUserBubble message={userMessage} />
    </div>
  )
}

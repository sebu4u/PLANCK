"use client"

import { Sparkles } from "lucide-react"
import { MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

interface ProblemOrbButtonProps {
  onOpenSidebar?: () => void
}

export default function ProblemOrbButton({ onOpenSidebar }: ProblemOrbButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenSidebar?.()}
      aria-label="Deschide asistent AI"
      className={cn(
        "fixed right-4 z-[91] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-[#252525] shadow-2xl transition-[transform,box-shadow,background-color] duration-200",
        "hover:bg-[#2a2a2a] hover:shadow-[0_12px_32px_-8px_rgba(11,13,16,0.45)]",
        "active:scale-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0d10]/20 focus-visible:ring-offset-2",
        "lg:hidden",
        MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS,
      )}
    >
      <Sparkles className="h-8 w-8 text-white" strokeWidth={2.25} />
      <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
      </span>
    </button>
  )
}

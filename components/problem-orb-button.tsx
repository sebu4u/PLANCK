"use client"

import { Sparkles } from "lucide-react"
import type { CSSProperties } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS, shouldShowMobileBottomNav } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

interface ProblemOrbButtonProps {
  onOpenSidebar?: () => void
  className?: string
  style?: CSSProperties
}

export default function ProblemOrbButton({ onOpenSidebar, className, style }: ProblemOrbButtonProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const aboveBottomNav = shouldShowMobileBottomNav(pathname, Boolean(user))

  return (
    <button
      type="button"
      onClick={() => onOpenSidebar?.()}
      aria-label="Deschide asistent AI"
      style={style}
      className={cn(
        "fixed right-4 z-[91] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-[#252525] shadow-2xl transition-[transform,box-shadow,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
        "hover:bg-[#2a2a2a] hover:shadow-[0_12px_32px_-8px_rgba(11,13,16,0.45)]",
        "active:scale-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b0d10]/20 focus-visible:ring-offset-2",
        "lg:hidden",
        aboveBottomNav && !className && style?.bottom == null ? MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS : null,
        !aboveBottomNav && !className && style?.bottom == null ? "bottom-4" : null,
        className,
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

"use client"

import { useEffect, useState } from "react"
import { Monitor, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS, shouldShowMobileBottomNav } from "@/lib/mobile-app-nav"

const STORAGE_KEY = "planck-informatica-mobile-desktop-hint-dismissed"

interface MobileDesktopRecommendationCardProps {
  className?: string
}

export function MobileDesktopRecommendationCard({
  className,
}: MobileDesktopRecommendationCardProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(true)
  const aboveBottomNav = shouldShowMobileBottomNav(pathname, Boolean(user))

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore quota / private mode
    }
  }

  if (dismissed) return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[290] md:hidden",
        aboveBottomNav ? cn(MOBILE_BOTTOM_NAV_OFFSET_CLASS, "pb-3") : "bottom-0",
        className,
      )}
      style={
        aboveBottomNav
          ? undefined
          : { paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }
      }
    >
      <div className="pointer-events-auto mx-3 overflow-hidden rounded-2xl border border-white/12 bg-[#1a1a1a]/95 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Monitor className="h-5 w-5 text-white/85" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[15px] font-semibold tracking-tight text-white">
              Rezolvă pe desktop
            </p>
            <p className="mt-0.5 text-sm leading-snug text-white/55">
              Editorul de cod e optimizat pentru ecran mare. Citește enunțul aici, apoi deschide
              problema pe calculator.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Închide recomandarea"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const TIPS_MESSAGES = [
  "Tips: Explorează secțiunea \"Grile\" pentru a-ți testa rapid cunoștințele!",
  "Tips: Poți salva proiectele tale pe PlanckCode pentru a reveni oricând la ele.",
  "Tips: Folosește AI Tutor pentru explicații pas cu pas la problemele dificile.",
]

export function GlobalLoadingOverlay() {
  const { loading } = useAuth()
  const pathname = usePathname()
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [randomTip, setRandomTip] = useState<string | null>(null)
  
  // Select a random tip message only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsInitialMount(false)
    // Generate random tip only on client
    setRandomTip(TIPS_MESSAGES[Math.floor(Math.random() * TIPS_MESSAGES.length)])
  }, [])

  // Show overlay during initial auth loading or on initial mount
  // Don't show on dashboard (dashboard has its own loading)
  // Don't show on homepage if user is logged in (DashboardRedirect handles that)
  const shouldShow = (loading || isInitialMount) && pathname !== '/dashboard'

  if (!shouldShow) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#121212]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#595959] border-r-transparent"></div>
      </div>
      {randomTip && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-[#595959] max-w-xl sm:max-w-2xl text-center px-4 line-clamp-2">
          {randomTip}
        </p>
      )}
    </div>
  )
}

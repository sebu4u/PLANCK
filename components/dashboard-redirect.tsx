"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

const TIPS_MESSAGES = [
  "Tips: Explorează secțiunea \"Grile\" pentru a-ți testa rapid cunoștințele!",
  "Tips: Poți salva proiectele tale pe PlanckCode pentru a reveni oricând la ele.",
  "Tips: Folosește AI Tutor pentru explicații pas cu pas la problemele dificile.",
]

export function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [randomTip, setRandomTip] = useState<string | null>(null)

  // Select a random tip message only on client side to avoid hydration mismatch
  useEffect(() => {
    // Generate random tip only on client
    setRandomTip(TIPS_MESSAGES[Math.floor(Math.random() * TIPS_MESSAGES.length)])
  }, [])

  useEffect(() => {
    // Only redirect if we're done loading and user is logged in
    if (!loading && user) {
      setIsRedirecting(true)
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  // Show loading screen while checking authentication or redirecting to prevent homepage flash
  // z-[400] ensures this overlay is above the Navigation (z-[300])
  if (loading || user || isRedirecting) {
    return (
      <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-[#121212]">
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

  return null
}


"use client"

import { ReactNode, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { ConcursRezultateOnboarding } from "@/components/concurs/concurs-rezultate-onboarding"

const CONCURS_REZULTATE_ONBOARDING_SEEN_KEY = "planck_concurs_rezultate_onboarding_seen"

type ConcursRezultateClientShellProps = {
  children: ReactNode
}

export function ConcursRezultateClientShell({ children }: ConcursRezultateClientShellProps) {
  const [hydrated, setHydrated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(CONCURS_REZULTATE_ONBOARDING_SEEN_KEY) === "1"
    setShowOnboarding(!hasSeenOnboarding)
    setHydrated(true)
  }, [])

  const markOnboardingSeen = () => {
    localStorage.setItem(CONCURS_REZULTATE_ONBOARDING_SEEN_KEY, "1")
  }

  const finishOnboarding = () => {
    markOnboardingSeen()
    setShowOnboarding(false)
  }

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (showOnboarding) {
    return <ConcursRezultateOnboarding onFinish={finishOnboarding} markOnboardingSeen={markOnboardingSeen} />
  }

  return <>{children}</>
}

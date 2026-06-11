"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import {
  isOnboardingRoute,
  REGISTER_ONBOARDING_PATH,
  savePostOnboardingRedirect,
} from "@/lib/onboarding"

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, needsOnboarding, profileSyncedUserId } = useAuth()

  const shouldRedirect =
    !loading &&
    Boolean(user) &&
    profileSyncedUserId === user?.id &&
    needsOnboarding &&
    !isOnboardingRoute(pathname)

  useEffect(() => {
    if (!shouldRedirect) return
    savePostOnboardingRedirect(pathname)
    router.replace(REGISTER_ONBOARDING_PATH)
  }, [pathname, router, shouldRedirect])

  if (shouldRedirect) return null

  return <>{children}</>
}

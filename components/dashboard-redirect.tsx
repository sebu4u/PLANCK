"use client"

import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function DashboardRedirect() {
  const router = useRouter()
  const { user, loading, isDev, profileSyncedUserId } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (profileSyncedUserId !== user.id) return

    setIsRedirecting(true)
    router.replace(isDev ? "/dashboard/dev" : "/dashboard")
  }, [user, loading, isDev, profileSyncedUserId, router])

  const shouldShowLoading = loading || user || isRedirecting

  if (!shouldShowLoading) return null

  return <LoadingVideoOverlay zIndex={400} />
}

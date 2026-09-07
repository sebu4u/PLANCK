"use client"

import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function DashboardRedirect() {
  const router = useRouter()
  const { user, loading, isDev, isMentor, profileSyncedUserId } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (profileSyncedUserId !== user.id) return

    setIsRedirecting(true)
    const destination = isMentor ? "/dashboard/mentor" : isDev ? "/dashboard/dev" : "/dashboard"
    router.replace(destination)
  }, [user, loading, isDev, isMentor, profileSyncedUserId, router])

  const shouldShowLoading = loading || user || isRedirecting

  if (!shouldShowLoading) return null

  return <LoadingVideoOverlay zIndex={400} />
}

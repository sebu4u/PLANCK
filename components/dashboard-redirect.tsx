"use client"

import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function DashboardRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      setIsRedirecting(true)
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  const shouldShowLoading = loading || user || isRedirecting

  if (!shouldShowLoading) return null

  return <LoadingVideoOverlay zIndex={400} />
}

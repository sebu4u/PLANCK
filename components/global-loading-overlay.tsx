"use client"

import { useAuth } from "@/components/auth-provider"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function GlobalLoadingOverlay() {
  const { loading } = useAuth()
  const pathname = usePathname()
  const [isInitialMount, setIsInitialMount] = useState(true)

  useEffect(() => {
    setIsInitialMount(false)
  }, [])

  const shouldShow = (loading || isInitialMount) && pathname !== '/dashboard'

  if (!shouldShow) return null

  return <LoadingVideoOverlay zIndex={500} />
}

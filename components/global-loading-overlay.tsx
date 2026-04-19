"use client"

import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function GlobalLoadingOverlay() {
  const pathname = usePathname()
  const [isInitialMount, setIsInitialMount] = useState(true)

  useEffect(() => {
    setIsInitialMount(false)
  }, [])

  // Sesiunea inițială e acoperită de AuthSessionGate; aici rămâne doar primul frame înainte de hidratare.
  const shouldShow = isInitialMount && pathname !== '/dashboard'

  if (!shouldShow) return null

  return <LoadingVideoOverlay zIndex={500} />
}

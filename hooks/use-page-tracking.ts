'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'

export function usePageTracking() {
  const pathname = usePathname()
  const analytics = useAnalytics()

  useEffect(() => {
    if (typeof window !== 'undefined' && analytics.canTrack) {
      analytics.trackPageView(window.location.href, document.title)
    }
  }, [pathname, analytics])

  return analytics
}

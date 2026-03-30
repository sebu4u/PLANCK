'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'

export function usePageTracking() {
  const pathname = usePathname()
  const analytics = useAnalytics()

  useEffect(() => {
    if (typeof window === 'undefined') return

    analytics.initialize()
      .then(() => {
        analytics.trackPageView(window.location.href, document.title)
      })
      .catch(console.error)
  }, [pathname, analytics])

  return analytics
}

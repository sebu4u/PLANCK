'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import { useCookieManager } from '@/lib/cookie-management'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const analytics = useAnalytics()
  const cookieManager = useCookieManager()

  // Initializează analytics când se schimbă consimțământul
  useEffect(() => {
    if (cookieManager.hasAnalyticsConsent) {
      analytics.initialize().catch(console.error)
    }
  }, [cookieManager.hasAnalyticsConsent])

  // Track page views automat
  useEffect(() => {
    if (typeof window !== 'undefined' && analytics.canTrack) {
      analytics.trackPageView(window.location.href, document.title)
    }
  }, [pathname, analytics])

  return <>{children}</>
}

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import { useCookieManager } from '@/lib/cookie-management'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const analytics = useAnalytics()
  const cookieManager = useCookieManager()

  // Inițializează analytics și trimite page_view după ce consimțământul devine disponibil.
  useEffect(() => {
    let isCancelled = false

    const syncAnalytics = async () => {
      if (typeof window === 'undefined' || !cookieManager.hasAnalyticsConsent) {
        return
      }

      await analytics.initialize()

      if (!isCancelled) {
        analytics.trackPageView(window.location.href, document.title)
      }
    }

    syncAnalytics().catch(console.error)

    return () => {
      isCancelled = true
    }
  }, [pathname, cookieManager.hasAnalyticsConsent, analytics])

  return <>{children}</>
}

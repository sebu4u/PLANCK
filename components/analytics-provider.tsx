'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useAnalytics } from '@/lib/analytics'
import { useCookieManager } from '@/lib/cookie-management'
import { persistMetaClickId, metaPixel } from '@/lib/meta-pixel'
import { persistTikTokClickId, tiktokPixel } from '@/lib/tiktok-pixel'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const analytics = useAnalytics()
  const cookieManager = useCookieManager()
  const { user } = useAuth()

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

  useEffect(() => {
    // Local compiles already fight Turbopack + Cursor for RAM. Don't enqueue a
    // burst of `/api/tiktok/events` (and Meta) requests on every navigation.
    if (process.env.NODE_ENV === 'development') return
    if (typeof window === 'undefined' || !cookieManager.hasMarketingConsent) {
      return
    }

    const syncMarketingPixels = async () => {
      persistTikTokClickId()
      persistMetaClickId()
      tiktokPixel.initialize()
      metaPixel.initialize()
      await tiktokPixel.identify({
        email: user?.email,
        phone: user?.phone,
        externalId: user?.id,
      })
      metaPixel.identify({
        email: user?.email,
        phone: user?.phone,
        externalId: user?.id,
      })
      tiktokPixel.page()
      metaPixel.page()
      tiktokPixel.trackViewContentForPath(window.location.pathname)
      metaPixel.trackViewContentForPath(window.location.pathname)

      if (user?.email_confirmed_at) {
        tiktokPixel.trackApplicationApproval('account', 'Cont Planck confirmat', user.id)
      }

      const params = new URLSearchParams(window.location.search)
      if (params.get('checkout') === 'success') {
        const sessionId = params.get('session_id')
        tiktokPixel.trackCheckoutSuccess(sessionId)
        metaPixel.trackCheckoutSuccess(sessionId)
      }
    }

    void syncMarketingPixels()
  }, [pathname, cookieManager.hasMarketingConsent, user?.id, user?.email, user?.phone])

  return <>{children}</>
}

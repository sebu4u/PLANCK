"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { useAuth } from "@/components/auth-provider"
import { useAnalytics } from "@/lib/analytics"
import {
  attributionAsProperties,
  persistFirstTouchAttribution,
} from "@/lib/attribution"
import { useCookieManager } from "@/lib/cookie-management"
import { landingKey, trackFunnelEvent } from "@/lib/funnel-analytics"
import { persistMetaClickId, metaPixel } from "@/lib/meta-pixel"
import {
  capturePosthogPageview,
  identifyPosthogUser,
  initPosthog,
  optOutPosthog,
  registerPosthogSuperProperties,
  resetPosthog,
} from "@/lib/posthog-client"
import { persistTikTokClickId, tiktokPixel } from "@/lib/tiktok-pixel"

const viewedLanding = new Set<string>()
const viewedActivation = new Set<string>()

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const analytics = useAnalytics()
  const cookieManager = useCookieManager()
  const { user, userType } = useAuth()
  const lastIdentifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !cookieManager.hasAnalyticsConsent) {
      if (!cookieManager.hasAnalyticsConsent) {
        optOutPosthog()
      }
      return
    }

    const attribution = persistFirstTouchAttribution()
    initPosthog()
    registerPosthogSuperProperties(attributionAsProperties(attribution))
  }, [cookieManager.hasAnalyticsConsent])

  useEffect(() => {
    let cancelled = false

    const syncAnalytics = async () => {
      if (typeof window === "undefined" || !cookieManager.hasAnalyticsConsent) {
        return
      }

      await analytics.initialize()

      if (!cancelled) {
        analytics.trackPageView(window.location.href, document.title)
        capturePosthogPageview(window.location.pathname)
      }
    }

    syncAnalytics().catch(console.error)

    return () => {
      cancelled = true
    }
  }, [pathname, cookieManager.hasAnalyticsConsent, analytics])

  useEffect(() => {
    if (typeof window === "undefined" || !cookieManager.hasAnalyticsConsent) return

    const landing = landingKey(pathname)
    if (landing && !viewedLanding.has(landing)) {
      viewedLanding.add(landing)
      trackFunnelEvent("landing_viewed", { page: landing })
    }

    if (
      (pathname === "/insight" || pathname.startsWith("/insight/")) &&
      !viewedActivation.has("insight")
    ) {
      viewedActivation.add("insight")
      trackFunnelEvent("insight_viewed", { path: pathname })
    }

    if (
      (pathname === "/pricing" || pathname.startsWith("/pricing/")) &&
      !viewedActivation.has("pricing")
    ) {
      viewedActivation.add("pricing")
      trackFunnelEvent("pricing_viewed", { path: pathname })
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get("checkout") === "success") {
      const sessionId = params.get("session_id")
      trackFunnelEvent("subscription_purchased", {
        session_id: sessionId,
        $insert_id: sessionId ? `purchase:${sessionId}` : undefined,
      })
    }
  }, [pathname, cookieManager.hasAnalyticsConsent])

  useEffect(() => {
    if (!cookieManager.hasAnalyticsConsent) return

    if (user?.id) {
      identifyPosthogUser(user.id, {
        email: user.email,
        user_type: userType ?? undefined,
      })
      lastIdentifiedUserId.current = user.id
      return
    }

    if (lastIdentifiedUserId.current) {
      resetPosthog()
      lastIdentifiedUserId.current = null
    }
  }, [cookieManager.hasAnalyticsConsent, user?.id, user?.email, userType])

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return
    if (typeof window === "undefined" || !cookieManager.hasMarketingConsent) {
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
        tiktokPixel.trackApplicationApproval("account", "Cont Planck confirmat", user.id)
      }

      const params = new URLSearchParams(window.location.search)
      if (params.get("checkout") === "success") {
        const sessionId = params.get("session_id")
        tiktokPixel.trackCheckoutSuccess(sessionId)
        metaPixel.trackCheckoutSuccess(sessionId)
      }
    }

    void syncMarketingPixels()
  }, [pathname, cookieManager.hasMarketingConsent, user?.id, user?.email, user?.phone])

  return <>{children}</>
}

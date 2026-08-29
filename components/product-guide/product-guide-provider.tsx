"use client"

import { createPortal } from "react-dom"
import { useEffect, useState, type ReactNode } from "react"

import { GuideSpotlight } from "@/components/product-guide/guide-spotlight"
import { GuideTip } from "@/components/product-guide/guide-tip"
import { GuideNavNudge } from "@/components/product-guide/guide-nav-nudge"
import {
  ProductGuideBlockingProvider,
} from "@/components/product-guide/product-guide-blocking"
import { useProductGuide } from "@/hooks/use-product-guide"
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

function ProductGuideRenderer() {
  const { activeStep, dismiss } = useProductGuide()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !activeStep) return null

  if (activeStep.kind === "nudge" && activeStep.anchorId) {
    return (
      <GuideNavNudge
        anchorId={activeStep.anchorId}
        title={activeStep.title}
        href={activeStep.href ?? "/pregatire"}
        onDismiss={dismiss}
      />
    )
  }

  if (activeStep.kind === "spotlight" && activeStep.anchorId) {
    return (
      <GuideSpotlight
        anchorId={activeStep.anchorId}
        title={activeStep.title}
        body={activeStep.body}
        onDismiss={dismiss}
      />
    )
  }

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[520] flex justify-center px-4",
        // Mobile: sit just above bottom nav; desktop: bottom-right.
        "bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
        MOBILE_BOTTOM_NAV_OFFSET_CLASS,
        "burger:bottom-6 burger:justify-end burger:pr-8 burger:pl-0",
      )}
    >
      <div className="pointer-events-auto mb-3 w-full max-w-[360px] burger:mb-0">
        <GuideTip title={activeStep.title} body={activeStep.body} onDismiss={dismiss} withSpotlight />
      </div>
    </div>,
    document.body,
  )
}

export function ProductGuideProvider({ children }: { children: ReactNode }) {
  return (
    <ProductGuideBlockingProvider>
      {children}
      <ProductGuideRenderer />
    </ProductGuideBlockingProvider>
  )
}

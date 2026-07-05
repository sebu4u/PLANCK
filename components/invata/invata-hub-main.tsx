"use client"

import { MOBILE_BOTTOM_NAV_PADDING_CLASS, MOBILE_BOTTOM_NAV_UPGRADE_BANNER_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

export function InvataHubMain({ children }: { children: React.ReactNode }) {
  const { isPaid } = useSubscriptionPlan()

  return (
    <main
      className={cn(
        "relative min-h-screen max-sm:bg-transparent bg-[#ffffff] max-sm:pt-[calc(5.875rem+3rem)] pt-16 burger:pt-28 burger:pb-10 sm:pt-16",
        MOBILE_BOTTOM_NAV_PADDING_CLASS,
        !isPaid && MOBILE_BOTTOM_NAV_UPGRADE_BANNER_PADDING_CLASS,
      )}
    >
      {children}
    </main>
  )
}

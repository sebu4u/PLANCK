"use client"

import { useCallback, useState, type ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { FreePlanComparisonOverlay } from "@/components/invata/free-plan-comparison-overlay"
import { usePostOnboardingDiscountWindow } from "@/hooks/use-post-onboarding-discount-window"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

interface PremiumUpgradeBannerProps {
  defaultMessage: ReactNode
  className?: string
}

export function PremiumUpgradeBanner({ defaultMessage, className }: PremiumUpgradeBannerProps) {
  const { user } = useAuth()
  const { isPaid } = useSubscriptionPlan()
  const postOnboardingDiscount = usePostOnboardingDiscountWindow(user?.id)
  const [premiumUpgradeOpen, setPremiumUpgradeOpen] = useState(false)

  const handleOpen = useCallback(() => setPremiumUpgradeOpen(true), [])
  const handleClose = useCallback(() => setPremiumUpgradeOpen(false), [])

  if (isPaid) return null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "burger:hidden group flex w-full items-center justify-center gap-2 border-y border-[#e8e8e8] bg-gradient-to-r from-[#efe0f5] via-[#f8dce4] to-[#fce8d4] px-4 py-[8.5px] text-center",
          className,
        )}
      >
        {postOnboardingDiscount.active ? (
          <span className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-0">
            <span className="text-center text-[11px] font-extrabold leading-snug text-[#1a1520]">
              Dispare curând: jumătate din preț la orice plan.
            </span>
            <span className="inline-flex items-center gap-2 font-mono text-sm font-black tabular-nums tracking-tight text-[#b91c1c]">
              {postOnboardingDiscount.remainingLabel}
              <span className="font-sans text-xs font-bold text-[#2f2a3c] underline-offset-2 group-hover:underline">
                →
              </span>
            </span>
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#2f2a3c]">{defaultMessage}</span>
        )}
      </button>

      {premiumUpgradeOpen ? <FreePlanComparisonOverlay onClose={handleClose} /> : null}
    </>
  )
}

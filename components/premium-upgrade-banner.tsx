"use client"

import Image from "next/image"
import { useCallback, useState, type ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { FreePlanComparisonOverlay } from "@/components/invata/free-plan-comparison-overlay"
import { usePostOnboardingDiscountWindow } from "@/hooks/use-post-onboarding-discount-window"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

export const PREMIUM_UPGRADE_BANNER_SHELL_CLASS =
  "group flex w-full items-center justify-center gap-2.5 bg-gradient-to-r from-[#eef2ff] via-[#fdf2f8] to-[#fff7ed] px-4 py-2.5 text-center"

export const PREMIUM_UPGRADE_BANNER_TEXT_CLASS =
  "text-sm font-semibold leading-snug text-[#2a2438] sm:text-[15px]"

export function PremiumBannerGradientLink({ children }: { children: ReactNode }) {
  return (
    <span className="bg-[linear-gradient(90deg,#8b5cf6_0%,#e879f9_55%,#f2b93d_100%)] bg-[length:100%_2px] bg-bottom bg-no-repeat pb-[2px]">
      {children}
    </span>
  )
}

interface PremiumUpgradeBannerProps {
  defaultMessage?: ReactNode
  className?: string
  showIcon?: boolean
}

export function PremiumUpgradeBanner({
  defaultMessage,
  className,
  showIcon = true,
}: PremiumUpgradeBannerProps) {
  const { user } = useAuth()
  const { isPaid } = useSubscriptionPlan()
  const postOnboardingDiscount = usePostOnboardingDiscountWindow(user?.id)
  const [premiumUpgradeOpen, setPremiumUpgradeOpen] = useState(false)

  const handleOpen = useCallback(() => setPremiumUpgradeOpen(true), [])
  const handleClose = useCallback(() => setPremiumUpgradeOpen(false), [])

  if (isPaid) return null

  const resolvedDefaultMessage =
    defaultMessage ?? (
      <>
        Treci la Premium și accesează Insight fără limite.{" "}
        <PremiumBannerGradientLink>Go Premium</PremiumBannerGradientLink>
      </>
    )

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn("burger:hidden", PREMIUM_UPGRADE_BANNER_SHELL_CLASS, className)}
      >
        {showIcon ? (
          <span className="relative h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9">
            <Image
              src="/streak-icon.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </span>
        ) : null}

        {postOnboardingDiscount.active ? (
          <span className={cn(PREMIUM_UPGRADE_BANNER_TEXT_CLASS, "inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5")}>
            <span>Dispare curând: jumătate din preț la orice plan.</span>
            <span className="font-mono font-bold tabular-nums tracking-tight">
              {postOnboardingDiscount.remainingLabel}
            </span>
            <PremiumBannerGradientLink>Go Premium</PremiumBannerGradientLink>
          </span>
        ) : (
          <span className={PREMIUM_UPGRADE_BANNER_TEXT_CLASS}>{resolvedDefaultMessage}</span>
        )}
      </button>

      {premiumUpgradeOpen ? <FreePlanComparisonOverlay onClose={handleClose} /> : null}
    </>
  )
}

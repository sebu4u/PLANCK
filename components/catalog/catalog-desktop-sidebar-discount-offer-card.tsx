"use client"

import { useEffect, type CSSProperties } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { usePostOnboardingDiscountWindow } from "@/hooks/use-post-onboarding-discount-window"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

type CatalogDesktopSidebarDiscountOfferCardProps = {
  className?: string
}

export function CatalogDesktopSidebarDiscountOfferCard({
  className,
}: CatalogDesktopSidebarDiscountOfferCardProps) {
  const { user } = useAuth()
  const { isPaid } = useSubscriptionPlan()
  const postOnboardingDiscount = usePostOnboardingDiscountWindow(user?.id)

  useEffect(() => {
    if (!user?.id || isPaid) return
    postOnboardingDiscount.ensureWindow()
  }, [user?.id, isPaid, postOnboardingDiscount.ensureWindow])

  if (isPaid || !postOnboardingDiscount.active) return null

  return (
    <div className={cn("hidden shrink-0 border-t border-[#0b0c0f]/8 bg-white px-5 py-4 lg:block", className)}>
      <div className="rounded-3xl border border-[#d9d7d0] bg-gradient-to-tr from-[#e2e8f8] via-[#f8dce4] to-[#fce8d4] p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-red-500 to-[#e11d48] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgba(239,68,68,0.45)]">
            Ofertă unică −50%
          </span>
          <span className="font-mono text-base font-black tabular-nums leading-none tracking-tight text-[#b91c1c]">
            {postOnboardingDiscount.remainingLabel}
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-snug font-extrabold tracking-tight text-[#0f0f10]">
          Dispare curând: jumătate din preț la orice plan.
        </p>

        <Link
          href="/pricing"
          className="dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8f91f1] via-[#cd83db] to-[#f2b93d] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_#9a5aa8] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#9a5aa8] active:translate-y-1 active:shadow-[0_1px_0_#9a5aa8]"
          style={{ "--start-glow-tint": "rgba(248, 220, 228, 0.88)" } as CSSProperties}
        >
          Vreau oferta unică
        </Link>
      </div>
    </div>
  )
}

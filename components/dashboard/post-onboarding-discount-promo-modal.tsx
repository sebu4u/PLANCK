import type { CSSProperties } from "react"
import Link from "next/link"

import { DashboardPromoCardLayout } from "@/components/dashboard/dashboard-promo-card-layout"

type PostOnboardingDiscountPromoModalProps = {
  imageSrc: string
  remainingLabel: string
  onClose: () => void
  ctaHref?: string
}

export function PostOnboardingDiscountPromoModal({
  imageSrc,
  remainingLabel,
  onClose,
  ctaHref = "/pricing",
}: PostOnboardingDiscountPromoModalProps) {
  return (
    <DashboardPromoCardLayout
      imageSrc={imageSrc}
      imageAlt="Planck Premium"
      imagePriority
      compactMobile
      footer={
        <>
          <Link
            href={ctaHref}
            onClick={onClose}
            className="dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8f91f1] via-[#cd83db] to-[#f2b93d] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_#9a5aa8] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#9a5aa8] active:translate-y-1 active:shadow-[0_1px_0_#9a5aa8] sm:mt-6 sm:py-3"
            style={{ "--start-glow-tint": "rgba(248, 220, 228, 0.88)" } as CSSProperties}
          >
            <span className="relative z-[1]">Vreau oferta unică</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-xs font-medium text-black/50 transition hover:text-black/70 sm:mt-3"
          >
            nu mulțumesc
          </button>
        </>
      }
    >
      <span className="mt-1 inline-flex items-center rounded-full bg-gradient-to-r from-red-500 to-[#e11d48] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgba(239,68,68,0.45)] sm:mt-8 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.14em]">
        Ofertă unică −50%
      </span>

      <h2 className="mt-2 text-lg font-bold leading-tight text-black sm:mt-4 sm:text-2xl">
        Dispare curând: jumătate din preț la orice plan.
      </h2>

      <p className="mt-2 text-[11px] font-semibold leading-snug text-[#b91c1c] sm:mt-4 sm:text-sm">
        Expiră în{" "}
        <span className="font-mono text-base font-black tabular-nums tracking-tight sm:text-lg">
          {remainingLabel}
        </span>
      </p>
    </DashboardPromoCardLayout>
  )
}

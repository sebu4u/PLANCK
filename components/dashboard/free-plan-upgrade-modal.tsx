import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { DashboardPromoCardLayout } from "@/components/dashboard/dashboard-promo-card-layout"

type FreePlanUpgradeModalProps = {
  imageSrc: string
  onClose: () => void
  ctaHref?: string
}

export function FreePlanUpgradeModal({ imageSrc, onClose, ctaHref = "/pricing" }: FreePlanUpgradeModalProps) {
  return (
    <DashboardPromoCardLayout
      imageSrc={imageSrc}
      imageAlt="Planck trial"
      imagePriority
      footer={
        <>
          <Link
            href={ctaHref}
            className="dashboard-start-glow mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#5b21b6] active:translate-y-1 active:shadow-[0_1px_0_#5b21b6] sm:mt-6"
            style={{ "--start-glow-tint": "rgba(221, 211, 255, 0.84)" } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center justify-center gap-2">
              Incearca 7 zile
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs font-medium text-black/50 transition hover:text-black/70"
          >
            mai tarziu
          </button>
        </>
      }
    >
      <h2 className="mt-8 text-xl font-bold leading-tight text-black sm:mt-10 sm:text-2xl">
        Invata fizica mai usor. Note mai mari, fara stres.
      </h2>

      <p className="mt-3 text-[13px] leading-relaxed text-black/70 sm:text-sm">
        Deblochează toată platforma
      </p>
    </DashboardPromoCardLayout>
  )
}

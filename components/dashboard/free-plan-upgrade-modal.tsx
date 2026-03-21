import Link from "next/link"

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
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-black text-white text-base font-semibold transition hover:bg-black/90 sm:mt-6 sm:h-12"
          >
            Incearca 7 zile
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
        Invata mai rapid, ia note mai mari si castiga incredere — la un cost mult mai mic decat o pregatire clasica.
      </p>
    </DashboardPromoCardLayout>
  )
}

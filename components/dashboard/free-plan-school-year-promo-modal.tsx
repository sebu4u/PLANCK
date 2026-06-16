import type { CSSProperties } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { DashboardPromoCardLayout } from "@/components/dashboard/dashboard-promo-card-layout"

const PLUS_MONTHLY_PRICE = 29
const PLUS_MONTHLY_ORIGINAL = 129
const PLUS_DISCOUNT_PERCENT = Math.round((1 - PLUS_MONTHLY_PRICE / PLUS_MONTHLY_ORIGINAL) * 100)

/** Last day of the Romanian school year promo window (inclusive). */
const SCHOOL_YEAR_PROMO_END = new Date(2026, 5, 30, 23, 59, 59, 999)

function getSchoolYearPromoRemainingDays(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(SCHOOL_YEAR_PROMO_END)
  end.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000))
}

function formatSchoolYearPromoEndDate(short = false): string {
  return SCHOOL_YEAR_PROMO_END.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: short ? "short" : "long",
    timeZone: "Europe/Bucharest",
  })
}

type FreePlanSchoolYearPromoModalProps = {
  imageSrc: string
  onClose: () => void
  ctaHref?: string
}

export function FreePlanSchoolYearPromoModal({
  imageSrc,
  onClose,
  ctaHref = "/pricing",
}: FreePlanSchoolYearPromoModalProps) {
  const remainingDays = getSchoolYearPromoRemainingDays()
  const endDateLabel = formatSchoolYearPromoEndDate()
  const endDateShortLabel = formatSchoolYearPromoEndDate(true)

  const urgencyMobile =
    remainingDays > 0
      ? `Mai ai ${remainingDays} ${remainingDays === 1 ? "zi" : "zile"}`
      : "Se incheie azi"

  const urgencyDesktop =
    remainingDays > 0
      ? `Mai ai ${remainingDays} ${remainingDays === 1 ? "zi" : "zile"} — pana pe ${endDateLabel}`
      : `Oferta se incheie azi — pana pe ${endDateLabel}`

  return (
    <DashboardPromoCardLayout
      imageSrc={imageSrc}
      imageAlt="Planck Plus"
      imagePriority
      compactMobile
      footer={
        <>
          <Link
            href={ctaHref}
            className="dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#5b21b6] active:translate-y-1 active:shadow-[0_1px_0_#5b21b6] sm:mt-6 sm:py-3"
            style={{ "--start-glow-tint": "rgba(221, 211, 255, 0.84)" } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center justify-center gap-2">
              Vezi planurile
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-xs font-medium text-black/50 transition hover:text-black/70 sm:mt-3"
          >
            mai tarziu
          </button>
        </>
      }
    >
      <span className="mt-1 inline-flex items-center rounded-full bg-gradient-to-r from-red-500 to-[#e11d48] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgba(239,68,68,0.45)] sm:mt-8 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.14em]">
        <span className="sm:hidden">Cele mai mici preturi</span>
        <span className="hidden sm:inline">Cele mai mici preturi din an</span>
      </span>

      <h2 className="mt-2 text-lg font-bold leading-tight text-black sm:mt-4 sm:text-2xl">
        <span className="sm:hidden">Treci la Premium</span>
        <span className="hidden sm:inline">Treci la Premium inainte de vacanta</span>
      </h2>

      <p className="mt-1 hidden text-sm leading-relaxed text-black/70 sm:block">
        Doar pana la sfarsitul scolii mai poti lua abonamentul la pretul acesta.
      </p>

      <div className="mt-3 rounded-xl border border-red-100 bg-gradient-to-br from-red-50/90 via-white to-orange-50/80 px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:mt-6 sm:rounded-2xl sm:px-4 sm:py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7c3aed] sm:text-[11px] sm:tracking-[0.12em]">
          <span className="sm:hidden">Plus+</span>
          <span className="hidden sm:inline">Plus+ · cel mai popular</span>
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
          <span className="text-xs font-medium text-gray-400 line-through tabular-nums sm:text-base">
            {PLUS_MONTHLY_ORIGINAL} RON
            <span className="hidden sm:inline">/luna</span>
          </span>
          <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(239,68,68,0.45)] sm:px-2.5 sm:text-[11px]">
            −{PLUS_DISCOUNT_PERCENT}%
          </span>
        </div>

        <p className="mt-1 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] text-[#111111] sm:mt-1.5 sm:text-[2.35rem]">
          {PLUS_MONTHLY_PRICE}{" "}
          <span className="text-base font-semibold sm:text-xl">RON/luna</span>
        </p>
      </div>

      <p className="mt-2 text-[11px] font-semibold leading-snug text-[#b91c1c] sm:mt-4 sm:text-sm">
        <span className="sm:hidden">
          {urgencyMobile}
          {remainingDays > 0 ? ` · pana ${endDateShortLabel}` : ""}
        </span>
        <span className="hidden sm:inline">{urgencyDesktop}</span>
      </p>
    </DashboardPromoCardLayout>
  )
}

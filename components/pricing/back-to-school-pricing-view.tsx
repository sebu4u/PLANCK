"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import { Loader2, Sparkle, X } from "lucide-react"
import { Source_Serif_4 } from "next/font/google"
import { cn } from "@/lib/utils"
import {
  PricingCreatorCodeCard,
  type AppliedPromo,
} from "@/components/pricing/pricing-creator-code-card"
import {
  PREMIUM_MONTHLY_RON,
  PREMIUM_WEEKLY_RON,
  PREMIUM_YEARLY_RON,
  type PremiumBillingInterval,
} from "@/components/pricing/premium-pricing"
import {
  BACK_TO_SCHOOL_MONTHLY_RON,
  BACK_TO_SCHOOL_SAVE_PERCENT,
} from "@/lib/back-to-school-discount"
import { getCampaignPriceRon } from "@/lib/pricing-campaign"
import { premiumCommerceParams, tiktokPixel } from "@/lib/tiktok-pixel"

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
})

const YEARLY_PER_MONTH_RON = Math.round(PREMIUM_YEARLY_RON / 12)

function computeDiscountedPrice(priceRon: number, promo: AppliedPromo | null): number {
  if (!promo) return priceRon
  if (promo.isTrial) return 0
  if (promo.percentOff != null) {
    return Math.max(0, priceRon * (1 - promo.percentOff / 100))
  }
  if (promo.amountOff != null) {
    return Math.max(0, priceRon - promo.amountOff / 100)
  }
  return priceRon
}

type BackToSchoolPricingViewProps = {
  billingInterval: PremiumBillingInterval
  setBillingInterval: (interval: PremiumBillingInterval) => void
  isCurrentPremium: boolean
  hasPaidSubscription: boolean
  portalLoading: boolean
  openBillingPortal: () => void
  isCtaDisabled: boolean
  isActionLoading: boolean
  ctaLabel: string
  handlePrimaryCta: () => void
  appliedPromo: AppliedPromo | null
  onApplyPromo: (promo: AppliedPromo) => void
  onClearPromo: () => void
  headerSlot?: ReactNode
  onClose: () => void
}

export function BackToSchoolPricingView({
  billingInterval,
  setBillingInterval,
  isCurrentPremium,
  hasPaidSubscription,
  portalLoading,
  openBillingPortal,
  isCtaDisabled,
  isActionLoading,
  ctaLabel,
  handlePrimaryCta,
  appliedPromo,
  onApplyPromo,
  onClearPromo,
  headerSlot,
  onClose,
}: BackToSchoolPricingViewProps) {
  const lockedInterval = appliedPromo?.lockedInterval
  const monthDisplay = appliedPromo
    ? computeDiscountedPrice(PREMIUM_MONTHLY_RON, appliedPromo)
    : BACK_TO_SCHOOL_MONTHLY_RON

  const selectInterval = (interval: PremiumBillingInterval) => {
    if (lockedInterval && lockedInterval !== interval) return
    setBillingInterval(interval)
    tiktokPixel.trackCustomizeProduct(
      premiumCommerceParams(interval, {
        value: getCampaignPriceRon(interval),
        campaign: interval === "month" ? "back2school" : undefined,
      }),
    )
  }

  const footnote =
    billingInterval === "year"
      ? `*O singură plată de ${PREMIUM_YEARLY_RON.toLocaleString("ro-RO")} RON. Se reînnoiește anual, anulezi oricând. Poți opri reînnoirea din setări.`
      : billingInterval === "week"
        ? `*Facturat ${PREMIUM_WEEKLY_RON} RON la fiecare 7 zile. Anulezi oricând din setări.`
        : `*Prima lună ${BACK_TO_SCHOOL_MONTHLY_RON} RON, apoi ${PREMIUM_MONTHLY_RON} RON/lună. Anulezi oricând din setări.`

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#ffffff_58%),linear-gradient(to_right,#d9d4ff_0%,#f3e4f8_42%,#fde9d2_100%)] text-gray-900">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-30 p-2 text-gray-400 transition hover:text-gray-700 sm:right-6 sm:top-5"
        aria-label="Închide"
        title="Închide"
      >
        <X className="h-5 w-5" strokeWidth={1.6} />
      </button>

      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pb-16 pt-[max(4.5rem,calc(env(safe-area-inset-top)+2.5rem))] sm:px-6 lg:px-8">
        <div className="relative mb-6 sm:mb-8">
          <Sparkle
            className="absolute -left-6 top-1 h-3.5 w-3.5 fill-[#c4b5fd] text-[#c4b5fd] sm:-left-8"
            aria-hidden
          />
          <Sparkle
            className="absolute -right-5 bottom-3 h-3 w-3 fill-[#fda4af] text-[#fda4af] sm:-right-7"
            aria-hidden
          />
          <Image
            src="/streak-icon.png"
            alt=""
            width={160}
            height={160}
            priority
            className="h-24 w-24 object-contain sm:h-[7.5rem] sm:w-[7.5rem]"
          />
        </div>

        <h1
          className={cn(
            sourceSerif.className,
            "max-w-3xl text-center text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-[#171717] sm:text-5xl",
          )}
        >
          Deblochează experiența PLANCK completă
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm text-[#525252] sm:mt-4 sm:text-base">
          Premium îți dă învățare nelimitată, tutor personalizat și mai mult.
        </p>

        <div className="mt-5 inline-flex items-center rounded-full bg-gradient-to-r from-[#f0abfc] via-[#fb7185] to-[#fdba74] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:mt-6 sm:px-3.5 sm:text-[11px]">
          Back2School · −{BACK_TO_SCHOOL_SAVE_PERCENT}% prima lună
        </div>

        {headerSlot ? <div className="mt-6 w-full max-w-lg">{headerSlot}</div> : null}

        {hasPaidSubscription ? (
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="mt-4 text-sm font-medium text-[#525252] underline-offset-2 transition hover:text-gray-900 hover:underline disabled:opacity-70"
          >
            {portalLoading ? "Se deschide portalul..." : "Gestionează abonamentul"}
          </button>
        ) : null}

        {isCurrentPremium ? (
          <p className="mt-3 text-xs font-medium text-[#737373]">Ai deja Premium pe acest cont.</p>
        ) : null}

        <div
          role="radiogroup"
          aria-label="Alege perioada"
          className="mt-8 grid w-full max-w-[80rem] grid-cols-1 items-stretch gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6 sm:items-stretch"
        >
          <PlanCard
            interval="week"
            title="Săptămânal"
            selected={billingInterval === "week"}
            disabled={Boolean(lockedInterval && lockedInterval !== "week")}
            onSelect={selectInterval}
            className="order-2 sm:order-1"
          >
            <p className="mt-2 text-base text-[#404040] sm:text-lg">
              RON {PREMIUM_WEEKLY_RON}
              <span className="text-[#737373]">/săptămână</span>
            </p>
          </PlanCard>

          <PlanCard
            interval="month"
            title="Lunar"
            featured
            selected={billingInterval === "month"}
            disabled={Boolean(lockedInterval && lockedInterval !== "month")}
            onSelect={selectInterval}
            className="order-1 sm:order-2"
          >
            <p className="mt-2 text-base text-[#404040] sm:text-lg">
              <span className="text-[#a3a3a3] line-through">RON {PREMIUM_MONTHLY_RON}</span>{" "}
              <span className="font-bold text-[#171717]">RON {Math.round(monthDisplay)}</span>
              <span className="text-[#737373]">/lună*</span>
            </p>
          </PlanCard>

          <PlanCard
            interval="year"
            title="Anual"
            selected={billingInterval === "year"}
            disabled={Boolean(lockedInterval && lockedInterval !== "year")}
            onSelect={selectInterval}
            className="order-3"
          >
            <p className="mt-2 text-base text-[#404040] sm:text-lg">
              <span className="text-[#a3a3a3] line-through">RON {PREMIUM_MONTHLY_RON}</span>{" "}
              <span className="font-bold text-[#171717]">RON {YEARLY_PER_MONTH_RON}</span>
              <span className="text-[#737373]">/lună</span>
            </p>
            <p className="mt-1 text-xs text-[#a3a3a3]">
              {PREMIUM_YEARLY_RON.toLocaleString("ro-RO")} RON/an
            </p>
          </PlanCard>
        </div>

        {appliedPromo ? (
          <p className="mt-4 text-center text-sm font-medium text-[#16a34a]">
            {appliedPromo.isTrial
              ? "7 zile gratuite, apoi prețul planului ales"
              : appliedPromo.source === "prize_wheel"
                ? "Premiu aplicat"
                : `Cod ${appliedPromo.code} aplicat`}
          </p>
        ) : null}

        <p className="mt-5 max-w-lg text-center text-[11px] leading-relaxed text-[#a3a3a3] sm:mt-6 sm:text-xs">
          {footnote}
        </p>

        <button
          type="button"
          onClick={handlePrimaryCta}
          disabled={isCtaDisabled}
          className={cn(
            "mt-8 inline-flex min-h-[52px] min-w-[220px] items-center justify-center rounded-full px-10 text-[15px] font-semibold transition sm:mt-9",
            isCtaDisabled
              ? "cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-[#2a2a2a] text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-[#111111] active:scale-[0.98]",
          )}
        >
          {isActionLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se deschide...
            </span>
          ) : (
            ctaLabel
          )}
        </button>

        <div className="mt-5 w-full max-w-sm">
          <PricingCreatorCodeCard
            appliedPromo={appliedPromo}
            onApply={onApplyPromo}
            onClear={onClearPromo}
            className="border-transparent bg-transparent"
          />
        </div>
      </section>
    </div>
  )
}

function PlanCard({
  interval,
  title,
  featured,
  selected,
  disabled,
  onSelect,
  className,
  children,
}: {
  interval: PremiumBillingInterval
  title: string
  featured?: boolean
  selected: boolean
  disabled: boolean
  onSelect: (interval: PremiumBillingInterval) => void
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("h-full", className)}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={() => onSelect(interval)}
        className={cn(
          "flex h-full min-h-[10.5rem] w-full flex-col overflow-hidden rounded-[22px] text-center transition sm:min-h-[11rem]",
          selected
            ? "bg-gradient-to-r from-[#c4b5fd] via-[#f0abfc] to-[#fdba74] p-[5px] shadow-[0_12px_32px_rgba(192,132,252,0.18)]"
            : "border-[5px] border-[#d4d4d4] bg-white hover:border-[#a3a3a3]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
            selected && "rounded-[17px] bg-white",
          )}
        >
          <p
            className={cn(
              "py-2 text-[10px] font-bold uppercase tracking-[0.16em]",
              featured
                ? "bg-gradient-to-r from-[#ddd6fe] via-[#f5d0fe] to-[#fed7aa] text-[#6b21a8]"
                : "invisible",
            )}
          >
            Cel mai popular
          </p>
          <div className="flex flex-1 flex-col justify-center px-8 pb-6 pt-3 sm:px-10 sm:pb-7 sm:pt-4">
            <p className="text-xl font-extrabold tracking-tight text-[#171717] sm:text-2xl">{title}</p>
            <div className="min-h-[2.75rem] sm:min-h-[3rem]">{children}</div>
          </div>
        </div>
      </button>
    </div>
  )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import React, { type CSSProperties, Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, Plus, X } from "lucide-react"
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { canPurchaseSubscriptions } from "@/lib/access-config"
import type { ChildBillingSnapshot } from "@/lib/parent/billing-types"
import { PricingMobileExitSheet } from "@/components/pricing/pricing-mobile-exit-sheet"
import { PricingGradeGrowthChart } from "@/components/pricing/pricing-grade-growth-chart"
import {
  PricingCreatorCodeCard,
  type AppliedPromo,
} from "@/components/pricing/pricing-creator-code-card"
import {
  getPremiumPeriodLabel,
  getPremiumPriceRon,
  PREMIUM_CARD_BULLETS,
  PREMIUM_LEFT_BENEFITS,
  PREMIUM_MONTHLY_VS_WEEKLY_SAVE_PERCENT,
  PREMIUM_PRICING_FAQ,
  PREMIUM_YEARLY_FULL_RON,
  PREMIUM_YEARLY_SAVE_PERCENT,
  type PremiumBillingInterval,
} from "@/components/pricing/premium-pricing"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_SAVE_PERCENT,
  isEarlybirdActive,
} from "@/lib/landing-earlybird"
import {
  LAUNCH_20_DEADLINE_LABEL,
  LAUNCH_20_PERCENT,
  isLaunch20Active,
} from "@/lib/launch-20-discount"
import { getCampaignPriceRon, getPricingCampaign } from "@/lib/pricing-campaign"
import { startPremiumCheckout } from "@/lib/stripe-checkout-client"
import { premiumCommerceParams, tiktokPixel } from "@/lib/tiktok-pixel"

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

const MOBILE_BREAKPOINT_PX = 768

const INTERVAL_OPTIONS: Array<{
  id: PremiumBillingInterval
  label: string
  shortLabel: string
}> = [
  { id: "week", label: "Încearcă o săptămână", shortLabel: "Săptămână" },
  { id: "month", label: "Lunar", shortLabel: "Lunar" },
  { id: "year", label: "Anual", shortLabel: "Anual" },
]

function intervalBadge(id: PremiumBillingInterval): string | undefined {
  if (id === "year") {
    return isEarlybirdActive() ? "Earlybird" : `Economisești ${PREMIUM_YEARLY_SAVE_PERCENT}%`
  }
  if ((id === "week" || id === "month") && isLaunch20Active()) {
    return `−${LAUNCH_20_PERCENT}%`
  }
  return undefined
}

function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString("ro-RO"))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

function PricingFaq() {
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
          FAQ
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Întrebări frecvente
        </h2>
      </div>
      <div className="mt-8 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-5 shadow-sm sm:px-6">
        {PREMIUM_PRICING_FAQ.map((item) => {
          const isOpen = openItemId === item.id
          return (
            <div key={item.id} className="py-5">
              <button
                type="button"
                onClick={() => setOpenItemId(isOpen ? null : item.id)}
                className="group flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-base font-semibold text-gray-900 sm:text-lg">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                    isOpen ? "bg-[#EBE8FF] text-[#5B47D6]" : "bg-gray-100 text-gray-400 group-hover:text-gray-600"
                  )}
                >
                  {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
                      {item.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PricingIllustrationPanel() {
  return (
    <div className="relative hidden h-full flex-col overflow-hidden py-8 pl-10 pr-4 lg:flex xl:py-10 xl:pl-14 xl:pr-8">
      <Link
        href="/"
        className="self-start text-4xl font-black tracking-tight text-gray-900 transition hover:opacity-80"
      >
        PLANCK
      </Link>

      <div className="ml-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 py-2 text-center">
        <PricingGradeGrowthChart />

        <div>
          <h1 className="text-2xl font-black leading-tight tracking-tight text-gray-900 xl:text-[1.75rem]">
            Învață alături de <span className="text-[#7C5CFC]">Planck</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 xl:text-base">
            Trasee de învățare, Insight 2.5, workshop-uri și PlanckPass — totul într-un loc.
          </p>
        </div>

        <ul className="grid w-full grid-cols-2 gap-3">
          {PREMIUM_LEFT_BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <li
                key={benefit.label}
                className="flex items-center gap-2.5 rounded-xl bg-white/60 px-3 py-2.5 text-left"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                  <Icon className="h-4 w-4 text-[#5B47D6]" aria-hidden />
                </span>
                <span className="text-xs font-semibold leading-tight text-gray-800 xl:text-[13px]">
                  {benefit.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="w-full max-w-md self-end text-center text-xs text-gray-500">Plăți securizate prin Stripe</p>
    </div>
  )
}

type PricingCardProps = {
  billingInterval: PremiumBillingInterval
  setBillingInterval: (interval: PremiumBillingInterval) => void
  periodLabel: string
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
  headerSlot?: React.ReactNode
  className?: string
  /** Desktop bordered card vs mobile flat content inside the page sheet */
  chrome?: "card" | "flat"
}

function PricingCard({
  billingInterval,
  setBillingInterval,
  periodLabel,
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
  className,
  chrome = "card",
}: PricingCardProps) {
  const isFlat = chrome === "flat"
  const listPriceRon = getPremiumPriceRon(billingInterval)
  const campaign = getPricingCampaign(billingInterval)
  const campaignPriceRon = getCampaignPriceRon(billingInterval)
  const displayPriceRon = appliedPromo
    ? computeDiscountedPrice(listPriceRon, appliedPromo)
    : campaignPriceRon
  const yearBadge = intervalBadge("year")
  const showCampaignStrike =
    !appliedPromo && campaign != null && campaignPriceRon < listPriceRon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("relative flex w-full max-w-md flex-col", className)}
    >
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col",
          isFlat
            ? "bg-transparent p-0"
            : "rounded-xl border border-gray-200 bg-white p-6 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.28)] sm:p-7 lg:justify-between lg:rounded-2xl lg:p-7 xl:p-8"
        )}
      >
        <div className="min-w-0">
          {headerSlot}
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={cn(
                "font-bold tracking-tight text-gray-900",
                isFlat ? "text-xl" : "text-xl sm:text-2xl lg:text-[1.75rem]"
              )}
            >
              Premium
            </h2>
            <span className="rounded-full bg-[#EBE8FF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#5B47D6]">
              Acces complet
            </span>
            {campaign === "earlybird" ? (
              <span className="rounded-full bg-[#FFE566] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#7A6000]">
                Earlybird −{EARLYBIRD_SAVE_PERCENT}%
              </span>
            ) : null}
            {campaign === "launch20" ? (
              <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#166534]">
                −{LAUNCH_20_PERCENT}% până pe {LAUNCH_20_DEADLINE_LABEL}
              </span>
            ) : null}
            {isCurrentPremium ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                Planul tău
              </span>
            ) : null}
          </div>

          {hasPaidSubscription ? (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="mt-2 text-xs font-medium text-[#5B47D6] transition hover:text-[#7C5CFC] disabled:opacity-70"
            >
              {portalLoading ? "Se deschide portalul..." : "Gestionează abonamentul →"}
            </button>
          ) : null}

          <div
            role="tablist"
            aria-label="Perioadă de facturare"
            className="mt-4 flex w-full gap-1 rounded-full bg-[#f3f1fb] p-1 lg:mt-5"
          >
            {INTERVAL_OPTIONS.map((option) => {
              const isActive = billingInterval === option.id
              const isLockedOut = Boolean(appliedPromo?.lockedInterval && appliedPromo.lockedInterval !== option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={isLockedOut}
                  onClick={() => {
                    if (isLockedOut) return
                    setBillingInterval(option.id)
                    tiktokPixel.trackCustomizeProduct(
                      premiumCommerceParams(option.id, {
                        value: appliedPromo
                          ? computeDiscountedPrice(getPremiumPriceRon(option.id), appliedPromo)
                          : getCampaignPriceRon(option.id),
                        campaign: getPricingCampaign(option.id) === "earlybird" ? "earlybird" : undefined,
                      }),
                    )
                  }}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center rounded-full px-1.5 py-2 text-center transition-all lg:py-2.5",
                    isActive
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-[#7C5CFC]/20"
                      : isLockedOut
                        ? "cursor-not-allowed text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <span className="text-[11px] font-semibold leading-tight sm:text-xs lg:text-[13px]">
                    <span className="sm:hidden">{option.shortLabel}</span>
                    <span className="hidden sm:inline">{option.label}</span>
                  </span>
                  {(() => {
                    const badge = intervalBadge(option.id)
                    if (!badge || !isActive) return null
                    return (
                    <span
                      className={cn(
                        "mt-0.5 hidden text-[9px] font-bold sm:block",
                        option.id === "year" && isEarlybirdActive()
                          ? "text-[#b45309]"
                          : option.id !== "year" && isLaunch20Active()
                            ? "text-[#166534]"
                            : "text-[#5B47D6]",
                      )}
                    >
                      {badge}
                    </span>
                    )
                  })()}
                </button>
              )
            })}
          </div>

          {yearBadge && billingInterval === "year" ? (
            <p
              className={cn(
                "mt-2 text-center text-xs font-semibold sm:hidden",
                campaign === "earlybird" ? "text-[#b45309]" : "text-[#5B47D6]",
              )}
            >
              {yearBadge}
            </p>
          ) : billingInterval !== "year" && intervalBadge(billingInterval) ? (
            <p className="mt-2 text-center text-xs font-semibold text-[#166534] sm:hidden">
              {intervalBadge(billingInterval)}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-end gap-2 lg:mt-5">
            <span className="text-4xl font-black tracking-tight text-gray-900 tabular-nums sm:text-5xl lg:text-5xl xl:text-6xl">
              <AnimatedPrice value={displayPriceRon} />
            </span>
            <span className="pb-1.5 text-sm font-medium text-gray-500 sm:pb-2 sm:text-base lg:pb-2">
              RON{periodLabel}
            </span>
          </div>

          {appliedPromo?.isTrial ? (
            <p className="mt-1.5 text-sm font-medium text-[#16a34a]">
              7 zile gratuite, apoi {listPriceRon.toLocaleString("ro-RO")} RON/lună
            </p>
          ) : appliedPromo ? (
            <p className="mt-1.5 text-sm text-gray-500">
              <span className="line-through">{listPriceRon.toLocaleString("ro-RO")} RON</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-semibold text-[#16a34a]">
                cod {appliedPromo.code} aplicat
              </span>
            </p>
          ) : showCampaignStrike && campaign === "earlybird" ? (
            <p className="mt-1.5 text-sm text-gray-500">
              <span className="line-through">{listPriceRon.toLocaleString("ro-RO")} RON</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-semibold text-[#b45309]">
                Preț earlybird până pe {EARLYBIRD_DEADLINE_LABEL}
              </span>
            </p>
          ) : showCampaignStrike && campaign === "launch20" ? (
            <p className="mt-1.5 text-sm text-gray-500">
              <span className="line-through">{listPriceRon.toLocaleString("ro-RO")} RON</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-semibold text-[#166534]">
                Cupon −{LAUNCH_20_PERCENT}% până pe {LAUNCH_20_DEADLINE_LABEL}
              </span>
            </p>
          ) : null}

          {!appliedPromo && billingInterval === "month" && campaign !== "launch20" ? (
            <p className="mt-1.5 text-sm font-medium text-[#5B47D6]">
              {PREMIUM_MONTHLY_VS_WEEKLY_SAVE_PERCENT}% mai ieftin decât săptămânal
            </p>
          ) : null}
          {!appliedPromo && billingInterval === "year" && campaign !== "earlybird" ? (
            <p className="mt-1.5 text-sm text-gray-500">
              <span className="line-through">{PREMIUM_YEARLY_FULL_RON.toLocaleString("ro-RO")} RON</span>
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="font-semibold text-[#5B47D6]">
                {PREMIUM_YEARLY_SAVE_PERCENT}% reducere față de lunar
              </span>
            </p>
          ) : null}
          {!appliedPromo && billingInterval === "week" && campaign !== "launch20" ? (
            <p className="mt-1.5 text-sm text-gray-500">
              Ideal ca să testezi Premium fără angajament lung
            </p>
          ) : null}

          <ul className="mt-4 space-y-2 lg:mt-5 lg:space-y-2.5">
            {PREMIUM_CARD_BULLETS.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]">
                  <Check className="h-3 w-3 text-[#5B47D6]" strokeWidth={3} aria-hidden />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/pricing/detalii"
            className="mt-3 inline-flex text-sm font-semibold text-[#5B47D6] transition hover:text-[#7C5CFC] lg:mt-4"
          >
            Vezi toate detaliile →
          </Link>

          <div className="mt-4 lg:mt-5">
            <PricingCreatorCodeCard
              appliedPromo={appliedPromo}
              onApply={onApplyPromo}
              onClear={onClearPromo}
            />
          </div>
        </div>

        <div className="mt-6 shrink-0">
          <button
            type="button"
            onClick={handlePrimaryCta}
            disabled={isCtaDisabled}
            className={cn(
              "inline-flex min-h-14 w-full items-center justify-center rounded-full px-8 text-base font-semibold",
              isCtaDisabled
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "dashboard-start-glow bg-[#7C5CFC] text-white shadow-[0_4px_0_#5B47D6] transition-[filter,transform,box-shadow] hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_#5B47D6]"
            )}
            style={
              !isCtaDisabled
                ? ({ "--start-glow-tint": "rgba(224, 215, 255, 0.88)" } as CSSProperties)
                : undefined
            }
          >
            <span className="relative z-[1] inline-flex items-center justify-center gap-2">
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se deschide...
                </>
              ) : (
                ctaLabel
              )}
            </span>
          </button>

          <p className="mt-3 text-center text-xs text-gray-500 sm:text-sm">
            Anulezi oricând, din cont, în 30 de secunde.
          </p>

          <div className="mt-3 text-center">
            <Link
              href="/probleme"
              className="text-sm font-medium text-gray-500 transition hover:text-[#5B47D6]"
            >
              Continui gratuit, cu acces limitat →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

type ParentPricingChild = {
  child_id: string
  name: string
  billing: ChildBillingSnapshot
}

function ParentChildPicker({
  childrenList,
  selectedChildId,
  onSelect,
}: {
  childrenList: ParentPricingChild[]
  selectedChildId: string | null
  onSelect: (childId: string) => void
}) {
  if (childrenList.length === 0) {
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Conectează mai întâi un copil din{" "}
        <Link href="/dashboard/parent" className="font-semibold underline">
          dashboard-ul de părinte
        </Link>
        , apoi poți cumpăra Premium pentru el.
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-2">
      <p className="text-sm font-medium text-gray-700">Cumperi Premium pentru</p>
      <div className="flex flex-wrap gap-2">
        {childrenList.map((child) => (
          <button
            key={child.child_id}
            type="button"
            onClick={() => onSelect(child.child_id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              selectedChildId === child.child_id
                ? "border-[#5B47D6] bg-[#EBE8FF] text-[#5B47D6]"
                : "border-gray-200 bg-white text-gray-600 hover:text-gray-900"
            )}
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function PricingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, subscriptionPlan, refreshProfile, isParent } = useAuth()
  const { toast } = useToast()
  const [billingInterval, setBillingInterval] = useState<PremiumBillingInterval>("week")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [syncingSessionId, setSyncingSessionId] = useState<string | null>(null)
  const [mobileExitSheetOpen, setMobileExitSheetOpen] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [parentChildren, setParentChildren] = useState<ParentPricingChild[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [parentChildrenLoading, setParentChildrenLoading] = useState(false)

  const selectedChild =
    parentChildren.find((child) => child.child_id === selectedChildId) ?? parentChildren[0] ?? null

  const purchasesEnabled = canPurchaseSubscriptions()
  const hasPaidSubscription = isParent
    ? Boolean(selectedChild?.billing.can_manage)
    : subscriptionPlan === "plus" || subscriptionPlan === "premium"
  const isCurrentPremium = isParent
    ? selectedChild?.billing.plan === "premium"
    : subscriptionPlan === "premium"
  const shouldManageInPortal = isParent
    ? Boolean(selectedChild?.billing.can_manage)
    : hasPaidSubscription
  const parentNeedsChild = isParent && !parentChildrenLoading && parentChildren.length === 0
  const parentCannotAct =
    isParent &&
    Boolean(selectedChild) &&
    !selectedChild?.billing.can_purchase &&
    !selectedChild?.billing.can_manage
  const isPurchaseDisabled =
    (!purchasesEnabled && !hasPaidSubscription) || parentNeedsChild || parentCannotAct
  const isActionLoading = checkoutLoading || portalLoading || (isParent && parentChildrenLoading)
  const isCtaDisabled =
    isActionLoading ||
    (isPurchaseDisabled && !parentNeedsChild) ||
    (isCurrentPremium && !shouldManageInPortal)

  const periodLabel = getPremiumPeriodLabel(billingInterval)

  useEffect(() => {
    if (!isParent || !user) {
      setParentChildren([])
      setSelectedChildId(null)
      return
    }

    let cancelled = false
    const loadChildren = async () => {
      setParentChildrenLoading(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) return
        const response = await fetch("/api/parent/children-billing", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!response.ok) throw new Error("children_failed")
        const payload = await response.json()
        const nextChildren = Array.isArray(payload.children) ? payload.children : []
        if (cancelled) return
        setParentChildren(nextChildren)
        const requestedChildId = searchParams?.get("child")
        setSelectedChildId((current) => {
          if (requestedChildId && nextChildren.some((child: ParentPricingChild) => child.child_id === requestedChildId)) {
            return requestedChildId
          }
          if (current && nextChildren.some((child: ParentPricingChild) => child.child_id === current)) {
            return current
          }
          return nextChildren[0]?.child_id ?? null
        })
      } catch {
        if (!cancelled) {
          toast({
            title: "Nu am putut încărca copiii",
            description: "Reîncarcă pagina sau deschide dashboard-ul de părinte.",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setParentChildrenLoading(false)
      }
    }

    void loadChildren()
    return () => {
      cancelled = true
    }
  }, [isParent, user, searchParams, toast])

  useEffect(() => {
    if (!user || isParent) return
    let cancelled = false
    const loadPersonalPromo = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) return
        const response = await fetch("/api/prize-wheel", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (response.ok) {
          const payload = await response.json()
          const prize = payload?.user?.prize
          if (!cancelled && prize && !prize.redeemedAt) {
            setBillingInterval(prize.interval)
            setAppliedPromo({
              promotionCodeId: `wheel:${prize.id}`,
              code: prize.code,
              percentOff: prize.percentOff,
              amountOff: prize.amountOff,
              currency: prize.currency,
              source: "prize_wheel",
              lockedInterval: prize.interval,
              isTrial: prize.isTrial,
            })
            return
          }
        }

        const selectedShopCouponId =
          searchParams?.get("source") === "shop" ? searchParams.get("shop_coupon") : null
        if (!selectedShopCouponId) return
        const shopResponse = await fetch("/api/shop", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!shopResponse.ok) return
        const shopPayload = await shopResponse.json()
        const coupon = shopPayload?.activeCoupons?.find(
          (item: { id?: string }) => item.id === selectedShopCouponId
        )
        if (cancelled || !coupon) return
        setBillingInterval(coupon.interval)
        setAppliedPromo({
          promotionCodeId: `shop:${coupon.id}`,
          shopCouponId: coupon.id,
          code: coupon.code,
          percentOff: coupon.percentOff,
          amountOff: null,
          currency: null,
          source: "shop",
          lockedInterval: coupon.interval,
        })
      } catch {
        // Pricing remains usable without a personal promotion.
      }
    }
    void loadPersonalPromo()
    return () => {
      cancelled = true
    }
  }, [user, isParent, searchParams])

  useEffect(() => {
    const status = searchParams?.get("checkout")
    const sessionId = searchParams?.get("session_id")

    if (status === "success") {
      toast({
        title: "Plată reușită",
        description: isParent
          ? "Abonamentul copilului va fi activat în câteva secunde."
          : "Abonamentul va fi activat în câteva secunde.",
      })
    } else if (status === "canceled") {
      toast({
        title: "Plata a fost anulată",
        description: "Poți relua comanda oricând.",
      })
    }

    if (!sessionId || !user) return
    if (syncingSessionId === sessionId) return
    if (status !== "success") return

    const syncSubscription = async () => {
      try {
        setSyncingSessionId(sessionId)
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) return

        const response = await fetch("/api/stripe/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "Nu am putut sincroniza abonamentul.")
        }

        await refreshProfile()
      } catch (error: any) {
        toast({
          title: "Sincronizare eșuată",
          description: error?.message || "Încearcă din nou.",
          variant: "destructive",
        })
      }
    }

    syncSubscription()
  }, [searchParams, toast, user, syncingSessionId, refreshProfile, isParent])

  const startCheckout = async (interval: PremiumBillingInterval = billingInterval) => {
    if (!user) {
      router.push("/login")
      return
    }
    if (isParent && !selectedChild) {
      router.push("/dashboard/parent")
      return
    }

    try {
      setCheckoutLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push("/login")
        return
      }

      const result = await startPremiumCheckout({
        accessToken,
        interval,
        promotionCodeId: appliedPromo?.promotionCodeId,
        shopCouponId: appliedPromo?.shopCouponId,
        campaign:
          !appliedPromo && interval === "year" && isEarlybirdActive() ? "earlybird" : undefined,
        ...(isParent && selectedChild ? { childId: selectedChild.child_id } : {}),
      })

      if (!result.ok) {
        throw new Error(result.error)
      }

      if ("applied" in result && result.applied) {
        toast({
          title: "Reducerea a fost aplicată",
          description: "Abonamentul tău a fost actualizat cu premiul de la roată.",
        })
        await refreshProfile()
        return
      }

      if ("url" in result) {
        window.location.assign(result.url)
      }
    } catch (error: any) {
      toast({
        title: "Eroare la checkout",
        description: error?.message || "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const openBillingPortal = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      setPortalLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(
          isParent && selectedChild ? { childId: selectedChild.child_id } : {}
        ),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut deschide portalul.")
      }
      if (payload?.url) {
        window.location.assign(payload.url)
      } else {
        throw new Error("Portal URL lipsă.")
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error?.message || "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setPortalLoading(false)
    }
  }

  const ctaLabel = (() => {
    if (isActionLoading) return "Se deschide..."
    if (parentNeedsChild) return "Conectează un copil"
    if (parentCannotAct) return "Are deja Premium"
    if (isPurchaseDisabled) return "Indisponibil momentan"
    if (appliedPromo?.isTrial) return "Începe 7 zile gratuite"
    if (appliedPromo?.source === "prize_wheel" && appliedPromo.lockedInterval === "year") {
      return "Ia anualul cu reducerea ta"
    }
    if (appliedPromo?.source === "prize_wheel") return "Aplică reducerea"
    if (appliedPromo?.source === "shop") return "Folosește cuponul din magazin"
    if (shouldManageInPortal && isCurrentPremium) {
      return isParent && selectedChild
        ? `Gestionează planul lui ${selectedChild.name}`
        : "Gestionează planul"
    }
    if (shouldManageInPortal) return "Upgrade din portal"
    if (!appliedPromo && billingInterval === "year" && isEarlybirdActive()) {
      return "Ia earlybird-ul"
    }
    if (isParent && selectedChild) return `Cumpără Premium pentru ${selectedChild.name}`
    return "Devino Premium"
  })()

  const handlePrimaryCta = async () => {
    if (parentNeedsChild) {
      router.push("/dashboard/parent")
      return
    }
    if (isCtaDisabled) return
    if (appliedPromo?.source === "prize_wheel" || appliedPromo?.source === "shop") {
      await startCheckout()
      return
    }
    if (shouldManageInPortal) {
      await openBillingPortal()
      return
    }
    await startCheckout()
  }

  const handleClosePricing = () => {
    setMobileExitSheetOpen(false)
    router.push("/")
  }

  const handleCloseButtonClick = () => {
    const isMobileViewport =
      typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT_PX

    if (isMobileViewport && subscriptionPlan !== "premium") {
      setMobileExitSheetOpen(true)
      return
    }

    handleClosePricing()
  }

  const handleMobileExitCheckout = async (interval: "month" | "year") => {
    if (appliedPromo?.source === "prize_wheel" || appliedPromo?.source === "shop") {
      await startCheckout(appliedPromo.lockedInterval ?? interval)
      return
    }
    if (shouldManageInPortal) {
      await openBillingPortal()
      return
    }
    await startCheckout(interval)
  }

  const cardProps: PricingCardProps = {
    billingInterval,
    setBillingInterval,
    periodLabel,
    isCurrentPremium,
    hasPaidSubscription: Boolean(user && hasPaidSubscription),
    portalLoading,
    openBillingPortal,
    isCtaDisabled,
    isActionLoading,
    ctaLabel,
    handlePrimaryCta,
    appliedPromo,
    onApplyPromo: (promo) => {
      setAppliedPromo(promo)
      if (promo.lockedInterval) setBillingInterval(promo.lockedInterval)
    },
    onClearPromo: () => setAppliedPromo(null),
    headerSlot: isParent ? (
      <ParentChildPicker
        childrenList={parentChildren}
        selectedChildId={selectedChild?.child_id ?? null}
        onSelect={setSelectedChildId}
      />
    ) : null,
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-white text-gray-900">
      <div
        className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#8f91f1,#cd83db,#f4d4c8)] lg:bg-none lg:bg-white"
        aria-hidden
      />

      <button
        type="button"
        onClick={handleCloseButtonClick}
        className="absolute right-3 top-3 z-30 p-2 text-gray-800/55 transition hover:text-gray-900 lg:right-5 lg:top-5 lg:text-gray-400 lg:hover:text-gray-700"
        aria-label="Înapoi acasă"
        title="Înapoi acasă"
      >
        <X className="h-5 w-5" strokeWidth={1.75} strokeLinecap="round" />
      </button>

      {/* Mobile: premium gradient header + white sheet */}
      <section className="relative lg:hidden">
        <div className="relative overflow-hidden bg-[linear-gradient(to_right,#8f91f1,#cd83db,#f4d4c8)] pl-7 pr-5 pb-10 pt-[max(4.25rem,calc(env(safe-area-inset-top)+2.75rem))]">
          <Image
            src="/images/exerseaza/pregatiri-icon.png"
            alt=""
            width={420}
            height={480}
            priority
            aria-hidden
            className="pointer-events-none absolute -bottom-5 right-[-6%] z-0 h-[15.5rem] w-auto max-w-[72%] select-none object-contain object-right-bottom"
          />
          <h1 className="relative z-10 max-w-[58%] pb-1 text-left text-[2.35rem] font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
            Devino
            <br />
            <span className="uppercase">PREMIUM</span>
          </h1>
        </div>

        <div
          className="relative z-10 -mt-6 rounded-t-[28px] border border-[#dedede] border-b-0 bg-white px-5 pb-10 pt-6 shadow-[0_-16px_40px_rgba(15,23,42,0.28)]"
          style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto mb-1 flex h-7 items-center justify-center" aria-hidden>
            <div className="h-1 w-12 rounded-full bg-[#bdbdbd]" />
          </div>

          <p className="mb-5 text-center text-sm leading-relaxed text-gray-500">
            Trasee, Insight 2.5, workshop-uri și PlanckPass — totul într-un loc.
          </p>

          <PricingCard
            {...cardProps}
            chrome="flat"
            className="mx-auto max-w-none"
          />
        </div>
      </section>

      {/* Desktop: split illustration + pricing card */}
      <section className="relative hidden bg-[linear-gradient(to_top,transparent_0%,rgba(255,255,255,0.55)_38%,#ffffff_68%),linear-gradient(to_right,#E4E9FF,#FDF3D7)] lg:grid lg:h-[100dvh] lg:max-h-[100dvh] lg:grid-cols-2 lg:overflow-hidden">
        <PricingIllustrationPanel />

        <div className="relative flex h-full min-h-0 flex-col items-start justify-center overflow-hidden py-8 pl-4 pr-10 xl:py-10 xl:pl-8 xl:pr-14">
          <PricingCard
            {...cardProps}
            chrome="card"
            className="ml-0 mr-auto max-h-full max-w-[540px]"
          />
        </div>
      </section>

      <div className="border-t border-gray-100 bg-[#f6f5f4]">
        <PricingFaq />
      </div>

      <PricingMobileExitSheet
        isOpen={mobileExitSheetOpen}
        isCheckoutLoading={checkoutLoading || portalLoading}
        isCheckoutDisabled={isPurchaseDisabled}
        onCheckout={handleMobileExitCheckout}
        onDismiss={handleClosePricing}
      />
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" />
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  )
}

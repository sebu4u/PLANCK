"use client"

import { useState, type CSSProperties } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type BillingInterval = "year" | "month"

const PREMIUM_YEARLY_RON = 590
const PREMIUM_MONTHLY_RON = 59

function premiumDailyPrice(totalRon: number, days: number) {
  return (totalRon / days).toFixed(2)
}

const PLAN_OPTIONS: Array<{
  interval: BillingInterval
  label: string
  paidLabel: string
  totalRon: number
  dailyRon: string
}> = [
  {
    interval: "year",
    label: "Anual",
    paidLabel: `Plătit ${PREMIUM_YEARLY_RON} RON anual`,
    totalRon: PREMIUM_YEARLY_RON,
    dailyRon: premiumDailyPrice(PREMIUM_YEARLY_RON, 365),
  },
  {
    interval: "month",
    label: "Lunar",
    paidLabel: `Plătit ${PREMIUM_MONTHLY_RON} RON lunar`,
    totalRon: PREMIUM_MONTHLY_RON,
    dailyRon: premiumDailyPrice(PREMIUM_MONTHLY_RON, 30),
  },
]

function PlanRadioIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition-colors",
        selected ? "border-[#d39bff] bg-[#d39bff]" : "border-[#d4d4d4] bg-white",
      )}
      aria-hidden
    />
  )
}

interface PricingMobileExitSheetProps {
  isOpen: boolean
  isCheckoutLoading: boolean
  isCheckoutDisabled: boolean
  onCheckout: (interval: BillingInterval) => void
  onDismiss: () => void
}

export function PricingMobileExitSheet({
  isOpen,
  isCheckoutLoading,
  isCheckoutDisabled,
  onCheckout,
  onDismiss,
}: PricingMobileExitSheetProps) {
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>("year")

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[490] bg-black/25 transition-opacity duration-300 ease-out lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isOpen}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-exit-sheet-title"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[500] flex flex-col overflow-hidden rounded-t-[28px] border border-[#dedede] bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div
          className="flex h-7 shrink-0 items-center justify-center"
          role="presentation"
        >
          <div className="h-1 w-12 rounded-full bg-[#bdbdbd]" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-2 pt-1">
          <h2
            id="pricing-exit-sheet-title"
            className="text-center text-xl font-bold tracking-[-0.03em] text-[#171717]"
          >
            Încă nu ești decis?
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Avem un traseu pentru oricine
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {PLAN_OPTIONS.map((option) => {
              const isSelected = selectedInterval === option.interval

              return (
                <button
                  key={option.interval}
                  type="button"
                  onClick={() => setSelectedInterval(option.interval)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    isSelected
                      ? "border-[#d39bff]/60 bg-[#fdf4ff]"
                      : "border-[#e8e8e8] bg-white",
                  )}
                >
                  <PlanRadioIndicator selected={isSelected} />

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[#171717]">{option.label}</p>
                    {isSelected ? (
                      <p className="mt-0.5 text-xs text-gray-500">{option.paidLabel}</p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold tabular-nums text-[#171717]">
                      {option.dailyRon} lei
                    </p>
                    <p className="text-xs text-gray-500">pe zi</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200/80">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="text-xs font-bold">Poți anula oricând</span>
            </span>

            <button
              type="button"
              onClick={() => onCheckout(selectedInterval)}
              disabled={isCheckoutDisabled || isCheckoutLoading}
              className={cn(
                "inline-flex min-h-14 w-full items-center justify-center rounded-full px-8 text-base font-semibold",
                isCheckoutDisabled || isCheckoutLoading
                  ? "cursor-not-allowed bg-gray-200 text-gray-500"
                  : "dashboard-start-glow bg-[#333333] text-white shadow-[0_4px_0_#0a0a0a] transition-[transform,box-shadow,opacity] active:translate-y-1 active:shadow-[0_1px_0_#0a0a0a]",
              )}
              style={
                !isCheckoutDisabled && !isCheckoutLoading
                  ? ({ "--start-glow-tint": "rgba(255, 255, 255, 0.42)" } as CSSProperties)
                  : undefined
              }
            >
              {isCheckoutLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se deschide...
                </span>
              ) : (
                "Vreau nota mai mare"
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mx-auto mb-1 px-4 py-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
        >
          Nu acum, mulțumesc
        </button>
      </div>
    </>
  )
}

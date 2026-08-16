"use client"

import { useState } from "react"
import { Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { canPurchaseSubscriptions } from "@/lib/access-config"
import {
  getPremiumPeriodLabel,
  getPremiumPriceRon,
  type PremiumBillingInterval,
} from "@/components/pricing/premium-pricing"
import type { ChildProgressSnapshot } from "@/lib/parent/server"
import { cn } from "@/lib/utils"

const INTERVALS: Array<{ id: PremiumBillingInterval; label: string }> = [
  { id: "week", label: "Săptămână" },
  { id: "month", label: "Lunar" },
  { id: "year", label: "Anual" },
]

function formatPeriodEnd(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function ChildSubscriptionCard({
  child,
  onBillingChange,
}: {
  child: ChildProgressSnapshot
  onBillingChange?: () => void
}) {
  const { toast } = useToast()
  const [interval, setInterval] = useState<PremiumBillingInterval>("month")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const billing = child.billing
  const purchasesEnabled = canPurchaseSubscriptions()
  const periodEnd = formatPeriodEnd(billing.current_period_end)
  const isBusy = checkoutLoading || portalLoading
  const priceRon = getPremiumPriceRon(interval)
  const periodLabel = getPremiumPeriodLabel(interval)

  const statusCopy = (() => {
    if (billing.billing_source === "parent") {
      return periodEnd
        ? `Premium activ până pe ${periodEnd}. Poți schimba perioada sau anula din portal.`
        : "Premium este plătit de tine. Poți gestiona abonamentul din portal."
    }
    if (billing.billing_source === "own") {
      return "Are deja Premium pe contul lui. Nu mai este nevoie de un abonament separat."
    }
    if (billing.billing_source === "other" || billing.plan === "premium") {
      return "Are deja Premium din altă sursă."
    }
    if (billing.plan === "plus") {
      return "Are Plus+ din recompense. Poți cumpăra Premium separat pentru acest copil."
    }
    return "Fără Premium. Cumperi un abonament doar pentru acest copil."
  })()

  const startCheckout = async () => {
    if (!purchasesEnabled || !billing.can_purchase) return

    try {
      setCheckoutLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        throw new Error("Sesiune invalidă.")
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: "premium",
          interval,
          childId: child.child_id,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut iniția checkout-ul.")
      }
      if (!payload?.url) {
        throw new Error("Checkout URL lipsă.")
      }
      window.location.assign(payload.url)
    } catch (error) {
      toast({
        title: "Eroare la checkout",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const openPortal = async () => {
    if (!billing.can_manage) return

    try {
      setPortalLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        throw new Error("Sesiune invalidă.")
      }

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ childId: child.child_id }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut deschide portalul.")
      }
      if (!payload?.url) {
        throw new Error("Portal URL lipsă.")
      }
      onBillingChange?.()
      window.location.assign(payload.url)
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)] lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-[#080808]">
            Abonament Premium
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">{statusCopy}</p>
        </div>
        <div className="rounded-full bg-[#f3f3f3] p-2.5 text-[#9e9e9e]">
          <Crown className="h-4 w-4" />
        </div>
      </div>

      {billing.can_purchase ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {INTERVALS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setInterval(option.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                  interval === option.id
                    ? "border-[#5B47D6] bg-[#EBE8FF] text-[#5B47D6]"
                    : "border-[#eceff3] bg-[#fafafa] text-[#6b7280] hover:text-[#374151]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#374151]">
              <span className="text-xl font-bold text-[#111827]">
                {priceRon.toLocaleString("ro-RO")} RON
              </span>{" "}
              <span className="text-[#6b7280]">{periodLabel}</span>
              {", "}doar pentru {child.name}
            </p>
            <Button
              type="button"
              onClick={() => void startCheckout()}
              disabled={!purchasesEnabled || isBusy}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se deschide...
                </>
              ) : purchasesEnabled ? (
                `Cumpără Premium pentru ${child.name}`
              ) : (
                "Indisponibil momentan"
              )}
            </Button>
          </div>
        </div>
      ) : billing.can_manage ? (
        <Button type="button" variant="outline" onClick={() => void openPortal()} disabled={isBusy}>
          {portalLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se deschide...
            </>
          ) : (
            "Gestionează abonamentul"
          )}
        </Button>
      ) : (
        <p className="rounded-2xl border border-[#eceff3] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#374151]">
          Are deja Premium
        </p>
      )}
    </section>
  )
}

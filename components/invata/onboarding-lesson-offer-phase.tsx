"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { startPremiumCheckout } from "@/lib/stripe-checkout-client"
import { supabase } from "@/lib/supabaseClient"
import { tiktokPixel, premiumCommerceParams } from "@/lib/tiktok-pixel"
import { cn } from "@/lib/utils"
import {
  getPremiumPeriodLabel,
  getPremiumPriceRon,
  PREMIUM_CARD_BULLETS,
  type PremiumBillingInterval,
} from "@/components/pricing/premium-pricing"

interface OnboardingLessonOfferPhaseProps {
  onDecline: () => void | Promise<void>
}

const OFFER_WINDOW_MS = 10 * 60 * 1000
const WELCOME_DISCOUNT_PERCENT = 20

const INTERVAL_TABS: Array<{
  id: PremiumBillingInterval
  label: string
}> = [
  { id: "week", label: "Săptămânal" },
  { id: "month", label: "Lunar" },
  { id: "year", label: "Anual" },
]

function getWelcomeOfferStorageKey(userId: string) {
  return `planck_onboarding_welcome_offer_start_${userId}`
}

function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return [m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

/** Visual “was” price so the real Stripe amount looks 20% off. */
function getStruckPriceRon(saleRon: number): number {
  return Math.round(saleRon / (1 - WELCOME_DISCOUNT_PERCENT / 100))
}

export function OnboardingLessonOfferPhase({ onDecline }: OnboardingLessonOfferPhaseProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [now, setNow] = useState(0)
  const [billingInterval, setBillingInterval] = useState<PremiumBillingInterval>("month")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const startRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const startedAt = Date.now()
    let start = startedAt

    if (user?.id) {
      try {
        const key = getWelcomeOfferStorageKey(user.id)
        const existing = localStorage.getItem(key)
        const parsed = Number(existing)
        if (existing && Number.isFinite(parsed)) {
          start = parsed
        } else {
          localStorage.setItem(key, String(startedAt))
        }
      } catch {
        // keep in-memory start
      }
    }

    startRef.current = start
    setNow(startedAt)

    const id = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [user?.id])

  const remainingLabel = useMemo(() => {
    if (now === 0 || startRef.current == null) return "10:00"
    return formatCountdown(startRef.current + OFFER_WINDOW_MS - now)
  }, [now])

  const saleRon = getPremiumPriceRon(billingInterval)
  const struckRon = getStruckPriceRon(saleRon)
  const periodLabel = getPremiumPeriodLabel(billingInterval)

  const handleCheckout = async () => {
    if (checkoutLoading) return

    try {
      setCheckoutLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken || !user) {
        router.push("/login")
        return
      }

      const result = await startPremiumCheckout({
        accessToken,
        interval: billingInterval,
      })

      if (!result.ok) {
        throw new Error(result.error)
      }

      if ("applied" in result && result.applied) {
        toast({
          title: "Premium activat",
          description: "Abonamentul tău a fost actualizat.",
        })
        router.push("/dashboard")
        return
      }

      if ("url" in result) {
        window.location.assign(result.url)
      }
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

  const handleDecline = useCallback(() => {
    playButtonClickSound()
    void onDecline()
  }, [onDecline])

  return (
    <div className="fixed inset-0 z-[502] flex flex-col bg-[linear-gradient(180deg,#ffd6e8_0%,#fff5f8_42%,#ffffff_100%)]">
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 pb-36">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#be185d] shadow-[0_4px_14px_rgba(244,114,182,0.28)] ring-1 ring-pink-200/80">
              Ofertă de bun venit −{WELCOME_DISCOUNT_PERCENT}%
            </span>

            <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[#111111] sm:text-3xl">
              Treci la <span className="text-[#be185d]">PREMIUM</span>
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#5f657b] sm:text-base">
              Ai încheiat primul traseu. Deblochează tot PLANCK-ul la preț de bun venit — doar câteva minute.
            </p>

            <p className="mt-5 text-sm font-semibold leading-snug text-[#be185d]">
              Oferta expiră în{" "}
              <span className="font-mono text-lg font-black tabular-nums tracking-tight">
                {remainingLabel}
              </span>
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Perioadă de abonament"
            className="mt-6 flex w-full gap-1 rounded-full bg-white/80 p-1 ring-1 ring-pink-100"
          >
            {INTERVAL_TABS.map((tab) => {
              const isActive = billingInterval === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setBillingInterval(tab.id)
                    tiktokPixel.trackCustomizeProduct(
                      premiumCommerceParams(tab.id, {
                        value: getPremiumPriceRon(tab.id),
                      }),
                    )
                  }}
                  className={cn(
                    "flex-1 rounded-full px-2 py-2 text-[12px] font-bold transition-colors sm:text-sm",
                    isActive
                      ? "bg-[#111111] text-white shadow-sm"
                      : "text-[#6b7280] hover:text-[#111111]",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm font-medium text-[#9ca3af] line-through">
              {struckRon.toLocaleString("ro-RO")} RON{periodLabel}
            </p>
            <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
              <span className="text-4xl font-black tracking-tight text-[#111111] tabular-nums sm:text-5xl">
                {saleRon.toLocaleString("ro-RO")}
              </span>
              <span className="text-base font-semibold text-[#6b7280]">RON{periodLabel}</span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-[#be185d]">
              −{WELCOME_DISCOUNT_PERCENT}% față de prețul obișnuit
            </p>
          </div>

          <ul className="mt-5 space-y-2">
            {PREMIUM_CARD_BULLETS.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-[#374151]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-100">
                  <Check className="h-3 w-3 text-[#be185d]" strokeWidth={3} aria-hidden />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col items-center">
          <button
            type="button"
            onClick={() => {
              playButtonClickSound()
              void handleCheckout()
            }}
            disabled={checkoutLoading}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#2d2d2d] px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#1a1a1a] transition-[transform,box-shadow,filter] hover:translate-y-0.5 hover:shadow-[0_2px_0_#1a1a1a] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se deschide...
              </>
            ) : (
              "Treci la Premium"
            )}
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="mt-3 text-xs font-medium text-black/45 transition hover:text-black/70"
          >
            Refuz oferta
          </button>
        </div>
      </div>
    </div>
  )
}

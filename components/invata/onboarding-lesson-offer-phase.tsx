"use client"

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { startPremiumCheckout } from "@/lib/stripe-checkout-client"
import { supabase } from "@/lib/supabaseClient"
import {
  getPremiumPeriodLabel,
  getPremiumPriceRon,
} from "@/components/pricing/premium-pricing"

interface OnboardingLessonOfferPhaseProps {
  onDecline: () => void | Promise<void>
}

const OFFER_WINDOW_MS = 10 * 60 * 1000
const WELCOME_DISCOUNT_PERCENT = 20
const BILLING_INTERVAL = "week" as const

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

  const saleRon = getPremiumPriceRon(BILLING_INTERVAL)
  const struckRon = getStruckPriceRon(saleRon)
  const periodLabel = getPremiumPeriodLabel(BILLING_INTERVAL)

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
        interval: BILLING_INTERVAL,
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
          className="w-full max-w-sm text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center rounded-full bg-[#be185d] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_6px_18px_rgba(190,24,93,0.35)] sm:text-sm">
            Reducere de bun venit −{WELCOME_DISCOUNT_PERCENT}%
          </span>

          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.22em] text-[#be185d]/80">
            Oferta expiră în 10 minute
          </p>
          <p
            className="mt-1 font-mono text-7xl font-black tabular-nums leading-none tracking-tight text-[#be185d] sm:text-8xl"
            aria-live="polite"
            aria-label={`Timp rămas ${remainingLabel}`}
          >
            {remainingLabel}
          </p>

          <div className="mt-10">
            <p className="text-base font-medium text-[#9ca3af] line-through">
              {struckRon.toLocaleString("ro-RO")} RON{periodLabel}
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-1.5">
              <span className="text-5xl font-black tracking-tight text-[#111111] tabular-nums">
                {saleRon.toLocaleString("ro-RO")}
              </span>
              <span className="text-lg font-semibold text-[#6b7280]">RON{periodLabel}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#be185d]">
              −{WELCOME_DISCOUNT_PERCENT}% la abonamentul săptămânal
            </p>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="pointer-events-auto mx-auto flex w-full max-w-sm flex-col items-center">
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
              "Ia reducerea de bun venit"
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

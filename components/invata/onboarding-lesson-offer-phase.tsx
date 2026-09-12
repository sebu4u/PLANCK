"use client"

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Loader2, Megaphone, Unlock, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  PremiumComparisonContent,
  premiumWordGradientClass,
} from "@/components/invata/premium-comparison-content"
import { useToast } from "@/hooks/use-toast"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { startPremiumCheckout } from "@/lib/stripe-checkout-client"
import { supabase } from "@/lib/supabaseClient"

interface OnboardingLessonOfferPhaseProps {
  onDecline: () => void | Promise<void>
}

const BILLING_INTERVAL = "week" as const

const PASTEL_BACKGROUND =
  "radial-gradient(ellipse 80% 55% at 0% 0%, #ead7ff 0%, transparent 58%), radial-gradient(ellipse 80% 55% at 100% 0%, #ffe4c2 0%, transparent 58%), linear-gradient(180deg, #f6efff 0%, #ffffff 52%)"

const CTA_CLASS =
  "dashboard-start-glow inline-flex min-w-[240px] items-center justify-center rounded-full bg-[#2d2d2d] px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_#1a1a1a] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#1a1a1a] active:translate-y-1 active:shadow-[0_1px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-70"

function formatChargeDate(from = new Date()) {
  const chargeOn = new Date(from)
  chargeOn.setDate(chargeOn.getDate() + 7)
  return chargeOn.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
}

type OfferStep = "compare" | "how"

export function OnboardingLessonOfferPhase({ onDecline }: OnboardingLessonOfferPhaseProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<OfferStep>("compare")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const chargeDateLabel = useMemo(() => formatChargeDate(), [])

  const handleDecline = useCallback(() => {
    playButtonClickSound()
    void onDecline()
  }, [onDecline])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleDecline()
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleDecline])

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
        onboardingTrial: true,
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

  return (
    <div
      className="fixed inset-0 z-[502] flex flex-col"
      style={{ background: PASTEL_BACKGROUND }}
      role="dialog"
      aria-modal="true"
      aria-label={
        step === "compare"
          ? "Începe-ți planul de învățare cu Premium"
          : "Cum funcționează perioada ta Premium gratuită"
      }
    >
      <button
        type="button"
        onClick={handleDecline}
        aria-label="Închide"
        className="absolute right-4 top-4 z-[504] inline-flex h-10 w-10 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-white/40 hover:text-[#111111] sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>

      {step === "compare" ? (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-16 sm:px-6">
          <PremiumComparisonContent
            title={
              <>
                Începe-ți planul de învățare
                <br />
                cu <span className={premiumWordGradientClass}>Premium</span>
              </>
            }
            ctaLabel="Începe săptămâna gratuită"
            onCtaClick={() => {
              playButtonClickSound()
              setStep("how")
            }}
          />
        </div>
      ) : (
        <TrialHowItWorksStep
          chargeDateLabel={chargeDateLabel}
          checkoutLoading={checkoutLoading}
          onStart={() => {
            playButtonClickSound()
            void handleCheckout()
          }}
        />
      )}
    </div>
  )
}

function TrialHowItWorksStep({
  chargeDateLabel,
  checkoutLoading,
  onStart,
}: {
  chargeDateLabel: string
  checkoutLoading: boolean
  onStart: () => void
}) {
  const steps = [
    {
      key: "today",
      title: "Astăzi",
      body: "Ai acces la toate cursurile interactive, tutoratul personalizat și nu numai",
      icon: Unlock,
      active: true,
    },
    {
      key: "five",
      title: "În 5 zile",
      body: "Primești un email de reminder că perioada gratuită se apropie de final",
      icon: Megaphone,
      active: false,
    },
    {
      key: "seven",
      title: "În 7 zile",
      body: `Contul tău va fi taxat; poți anula oricând înainte de ${chargeDateLabel}`,
      icon: Calendar,
      active: false,
    },
  ] as const

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-4 pt-16 sm:px-8">
        <div className="w-full max-w-3xl text-center">
          <h2 className="text-3xl font-bold leading-tight text-[#111111] sm:text-4xl md:text-[2.75rem]">
            Cum funcționează perioada ta{" "}
            <span className={premiumWordGradientClass}>Premium</span> gratuită
          </h2>

          <div className="relative mx-auto mt-12 max-w-2xl sm:mt-16">
            <div
              className="pointer-events-none absolute left-[16.666%] right-[6%] top-[22px] h-[4px] overflow-hidden rounded-full bg-gradient-to-r from-[#ead9ff] via-[#ead9ff] to-transparent sm:top-[26px] sm:h-[5px]"
              aria-hidden
            >
              <div className="h-full w-[28%] rounded-full bg-[linear-gradient(90deg,#c084fc_0%,#e879f9_42%,#fb923c_100%)] sm:h-[6px]" />
            </div>

            <ol className="relative grid grid-cols-3 gap-2 sm:gap-6">
              {steps.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.key} className="flex flex-col items-center text-center">
                    <span
                      className={
                        item.active
                          ? "relative z-[1] inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#c084fc] text-white shadow-[0_8px_18px_rgba(168,85,247,0.32)] sm:h-14 sm:w-14"
                          : "relative z-[1] inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e8ff] text-[#7c3aed] sm:h-14 sm:w-14"
                      }
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-[#7c3aed] sm:mt-5 sm:text-base">
                      {item.title}
                    </p>
                    <p className="mt-1 max-w-[220px] text-[13px] leading-snug text-[#6b7280] sm:text-sm">
                      {item.body}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      <div className="flex justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={onStart}
          disabled={checkoutLoading}
          className={CTA_CLASS}
          style={{ "--start-glow-tint": "rgba(255, 255, 255, 0.38)" } as CSSProperties}
        >
          <span className="relative z-[1] inline-flex items-center justify-center">
            {checkoutLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se deschide...
              </>
            ) : (
              "Începe săptămâna gratuită"
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

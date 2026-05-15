"use client"

import Image from "next/image"
import React, { type CSSProperties, Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Loader2, X } from "lucide-react"
import { motion, useSpring, useTransform } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { canPurchaseSubscriptions } from "@/lib/access-config"

type PlanId = "free" | "plus" | "premium"

type IndividualPlan = {
  id: PlanId
  name: string
  priceLabel?: string
  priceValue?: number
  currency?: string
  period?: string
  description: string
  popular?: boolean
  /** Economii față de 12× lunar, afișate lângă preț la facturare anuală */
  yearlySavingsRon?: number
}

function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString())

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

function PricingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, subscriptionPlan, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plus")
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [syncingSessionId, setSyncingSessionId] = useState<string | null>(null)
  const purchasesEnabled = canPurchaseSubscriptions()
  const hasPaidSubscription = subscriptionPlan === "plus" || subscriptionPlan === "premium"
  const currentPlanRank =
    subscriptionPlan === "premium" ? 2 : subscriptionPlan === "plus" ? 1 : 0

  useEffect(() => {
    const status = searchParams?.get("checkout")
    const sessionId = searchParams?.get("session_id")

    if (status === "success") {
      toast({
        title: "Plată reușită",
        description: "Abonamentul va fi activat în câteva secunde.",
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
  }, [searchParams, toast, user, syncingSessionId, refreshProfile])

  useEffect(() => {
    const planParam = searchParams?.get("plan")
    if (planParam === "free" || planParam === "plus" || planParam === "premium") {
      setSelectedPlan(planParam)
    }
  }, [searchParams])

  const startCheckout = async (planId: "plus" | "premium") => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      setCheckoutLoadingPlan(planId)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: planId,
          interval: isYearly ? "year" : "month",
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut iniția checkout-ul.")
      }

      if (payload?.url) {
        window.location.assign(payload.url)
      } else {
        throw new Error("Checkout URL lipsă.")
      }
    } catch (error: any) {
      toast({
        title: "Eroare la checkout",
        description: error?.message || "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoadingPlan(null)
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
          Authorization: `Bearer ${accessToken}`,
        },
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

  const individualPlans = useMemo<IndividualPlan[]>(
    () => [
      {
        id: "free",
        name: "Free",
        priceLabel: "Gratuit",
        description: "Pentru a descoperi Planck",
      },
      {
        id: "plus",
        name: "Plus+",
        priceValue: isYearly ? 290 : 29,
        currency: "RON",
        period: isYearly ? "/an" : "/lună",
        description: "Doar 0.93 lei/zi",
        popular: true,
        yearlySavingsRon: 58,
      },
      {
        id: "premium",
        name: "Premium",
        priceValue: isYearly ? 590 : 59,
        currency: "RON",
        period: isYearly ? "/an" : "/lună",
        description: "Pentru elevul care vrea să ajungă primul",
        yearlySavingsRon: 118,
      },
    ],
    [isYearly]
  )

  const selectedPlanData =
    individualPlans.find((plan) => plan.id === selectedPlan) ?? individualPlans[1]

  const selectedConversionBlurb = useMemo(() => {
    switch (selectedPlan) {
      case "free":
        return "Încearcă gratuit Insight și problemele Planck—fără card, fără obligații. Treci la un plan plătit când vezi că îți crește nota și îți scade timpul la teme."
      case "plus":
        return isYearly
          ? "Un singur plătit pe an: mai puțin pe lună decât o ședință de meditații, cu Insight și resurse pentru tot anul școlar. Ideal dacă vrei continuitate fără surprize la facturare."
          : "Cel mai bun raport preț–rezultate: suficient Insight și materiale pentru meditații, cu flexibilitate lunară și anulare oricând din cont."
      case "premium":
        return isYearly
          ? "Acces nelimitat la Insight și PlanckCode pentru tot anul—pregătire pentru concursuri și admitere, cu cost lunar echivalent mai mic decât la abonamentul lunar."
          : "Fără limite la Insight și PlanckCode: pentru concurs, olimpiadă și admitere, cu abonament lunar—îl oprești când vrei."
      default:
        return ""
    }
  }, [selectedPlan, isYearly])

  const getPlanUiState = (planId: PlanId) => {
    const isCurrentPlan = subscriptionPlan === planId
    const isPaidPlan = planId === "plus" || planId === "premium"
    const isCheckoutLoading = checkoutLoadingPlan === planId
    const planRank = planId === "premium" ? 2 : planId === "plus" ? 1 : 0
    const shouldManageInPortal = isPaidPlan && hasPaidSubscription
    const isHigherTierThanCurrent = planRank > currentPlanRank
    const isPaidPlanPurchaseDisabled = isPaidPlan && !purchasesEnabled && !hasPaidSubscription
    const isActionLoading = isCheckoutLoading || (shouldManageInPortal && portalLoading)
    const isDisabled = (planId === "free" && isCurrentPlan) || isActionLoading || isPaidPlanPurchaseDisabled

    let buttonLabel = "Începe acum"
    if (isActionLoading) {
      buttonLabel = "Se deschide..."
    } else if (isPaidPlan && isPaidPlanPurchaseDisabled) {
      buttonLabel = "Indisponibil momentan"
    } else if (isPaidPlan && shouldManageInPortal && isCurrentPlan) {
      buttonLabel = "Gestionează planul"
    } else if (isPaidPlan && shouldManageInPortal && isHigherTierThanCurrent) {
      buttonLabel = "Upgrade din portal"
    } else if (isPaidPlan && shouldManageInPortal) {
      buttonLabel = "Schimbă din portal"
    } else if (isCurrentPlan) {
      buttonLabel = "Planul tău curent"
    }

    return {
      isCurrentPlan,
      isPaidPlan,
      isCheckoutLoading,
      shouldManageInPortal,
      isPaidPlanPurchaseDisabled,
      isActionLoading,
      isDisabled,
      buttonLabel,
    }
  }

  const selectedPlanUi = getPlanUiState(selectedPlan)

  const handlePrimaryCta = async () => {
    if (selectedPlanUi.isDisabled) return

    if (selectedPlan === "plus" || selectedPlan === "premium") {
      if (selectedPlanUi.shouldManageInPortal) {
        await openBillingPortal()
        return
      }

      await startCheckout(selectedPlan)
      return
    }

    router.push("/probleme")
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-white text-[#111111] selection:bg-sky-200/70">
      {/* Gradient orizontal + fade lung spre alb (fără „tăietură” la granița cu fundalul alb) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(78vh,820px)] max-h-[90vh]"
        style={{
          backgroundImage: [
            // de sus în jos: lasă culorile vizibile sus, tranziție lină spre #fff
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 38%, rgba(255,255,255,0.22) 52%, rgba(255,255,255,0.58) 68%, rgba(255,255,255,0.92) 82%, #ffffff 92%, #ffffff 100%)",
            "linear-gradient(90deg, #b9ddff 0%, #f7f0ff 50%, #ffd8bd 100%)",
          ].join(", "),
        }}
      />
      <div className="pointer-events-none absolute left-[-8%] top-[-80px] h-[260px] w-[320px] rounded-full bg-sky-300/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6%] top-[-70px] h-[260px] w-[320px] rounded-full bg-orange-300/35 blur-3xl" />

      <button
        type="button"
        onClick={() => router.push("/")}
        className="absolute right-3 top-3 z-30 inline-flex items-center justify-center rounded-md p-1.5 text-gray-800 transition hover:opacity-75 active:opacity-60 sm:right-5 sm:top-5"
        aria-label="Înapoi acasă"
        title="Înapoi acasă"
      >
        <X className="h-4 w-4 drop-shadow-sm" strokeWidth={2.25} strokeLinecap="round" />
      </button>

      <main
        className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 pb-[calc(14rem+env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-6 md:pb-[calc(8.75rem+env(safe-area-inset-bottom))] lg:px-8"
      >
        <section className="mx-auto flex w-full max-w-4xl shrink-0 flex-col items-center text-center">
          <div className="-mt-0.5 mb-3 flex justify-center sm:mb-4">
            <Image
              src="/streak-icon.png"
              alt="Planck streak icon"
              width={240}
              height={240}
              priority
              className="h-[168px] w-[168px] object-contain sm:h-[188px] sm:w-[188px]"
            />
          </div>

          <h1 className="max-w-3xl text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.04em] text-[#171717] sm:text-4xl sm:leading-tight">
            Deblochează note mai mari cu PLANCK
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-snug text-gray-600 sm:mt-2.5 sm:text-base sm:leading-relaxed">
            Mai puțin decât o oră de meditații. Fără contracte, fără riscuri.
          </p>

          {user && hasPaidSubscription && (
            <button
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="mt-3 inline-flex items-center rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-medium text-gray-800 shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
            >
              {portalLoading ? "Se deschide portalul..." : "Gestionează abonamentul"}
            </button>
          )}
        </section>

        <div className="flex min-h-0 w-full flex-1 flex-col justify-start pt-2 pb-1 sm:pt-3 sm:pb-2 lg:justify-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full mt-8 sm:mt-0"
        >
          <div className="grid items-stretch gap-5 md:grid-cols-3 md:gap-4">
            {individualPlans.map((plan) => {
              const ui = getPlanUiState(plan.id)
              const isSelected = selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative h-full rounded-[28px] p-[3px] sm:p-[1.5px] md:p-[3px] transition duration-200",
                    plan.id === "free" && "order-2 md:order-1",
                    plan.id === "plus" && "order-1 md:order-2",
                    plan.id === "premium" && "order-3 md:order-3",
                    plan.popular
                      ? "bg-gradient-to-r from-[#7aaeff] via-[#d39bff] to-[#ffb35c] shadow-[0_18px_45px_rgba(124,58,237,0.16)]"
                      : isSelected
                        ? "bg-gradient-to-r from-sky-300/80 to-orange-300/80 shadow-[0_18px_45px_rgba(15,23,42,0.1)]"
                        : "bg-gray-200"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-700 shadow-md sm:px-4 sm:py-1 sm:text-xs sm:tracking-[0.18em]">
                      Cel mai popular
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative flex h-full w-full flex-col rounded-[25px] bg-white p-3 text-left transition duration-200 sm:rounded-[26.5px] sm:p-5",
                      isSelected ? "shadow-[0_18px_40px_rgba(15,23,42,0.12)]" : "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
                      "min-h-[128px] sm:min-h-[168px]"
                    )}
                  >
                    <div className="flex flex-1 flex-col">
                      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4">
                        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#171717] sm:text-2xl">
                          {plan.name}
                        </h2>
                        {ui.isCurrentPlan && (
                          <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-gray-600">
                            Planul tău
                          </span>
                        )}
                      </div>

                      {plan.id === "plus" ? (
                        <>
                          <div className="flex items-end justify-between gap-2">
                            <div className="flex min-w-0 items-end gap-1.5">
                              <span className="text-2xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-[2.35rem]">
                                {plan.priceValue != null ? (
                                  <>
                                    <AnimatedPrice value={plan.priceValue} /> {plan.currency}{" "}
                                    {plan.period}
                                  </>
                                ) : (
                                  plan.priceLabel
                                )}
                              </span>
                            </div>
                            {plan.yearlySavingsRon != null && (
                              <span
                                className={cn(
                                  "shrink-0 pb-0.5 text-xs font-semibold tabular-nums sm:pb-1 sm:text-base",
                                  isYearly ? "text-red-600" : "invisible"
                                )}
                                aria-hidden={!isYearly}
                              >
                                -{plan.yearlySavingsRon}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 max-w-[18rem] text-xs font-normal leading-snug text-gray-600 sm:mt-3 sm:text-sm sm:leading-6">
                            {plan.priceValue != null
                              ? isYearly
                                ? `Doar ${(plan.priceValue / 365).toFixed(2)} lei/zi`
                                : plan.description
                              : null}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-end justify-between gap-2">
                            <div className="flex min-w-0 items-end gap-1.5">
                              <span className="text-2xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-[2.35rem]">
                                {plan.priceValue ? (
                                  <>
                                    <AnimatedPrice value={plan.priceValue} /> {plan.currency}
                                  </>
                                ) : (
                                  plan.priceLabel
                                )}
                              </span>
                              {plan.priceLabel !== "Gratuit" && (
                                <span className="pb-0.5 text-xs font-medium text-gray-500 sm:pb-1 sm:text-sm">
                                  {plan.period}
                                </span>
                              )}
                            </div>
                            {plan.yearlySavingsRon != null && (
                              <span
                                className={cn(
                                  "shrink-0 pb-0.5 text-xs font-semibold tabular-nums sm:pb-1 sm:text-base",
                                  isYearly ? "text-red-600" : "invisible"
                                )}
                                aria-hidden={!isYearly}
                              >
                                -{plan.yearlySavingsRon}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 max-w-[18rem] text-xs leading-snug text-gray-600 sm:mt-3 sm:text-sm sm:leading-6">
                            {plan.description}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>

          <p
            className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-gray-600 sm:mt-4 sm:text-sm sm:leading-6"
            aria-live="polite"
          >
            {selectedConversionBlurb}
          </p>
        </motion.section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/85 backdrop-blur-xl">
        <div
          className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-end md:justify-between md:gap-6 md:py-4 sm:px-6 lg:px-8"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Plan selectat
            </p>
            <div className="mt-1 flex flex-row items-center justify-between gap-2 sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-wrap items-end gap-x-2 gap-y-0.5 pr-1">
                <span className="text-base font-semibold tracking-[-0.03em] text-[#171717] sm:text-lg">
                  {selectedPlanData.name}
                </span>
                <span className="text-xs text-gray-500 sm:text-sm">
                  {selectedPlanData.priceValue
                    ? `${selectedPlanData.priceValue} ${selectedPlanData.currency}${selectedPlanData.period}`
                    : selectedPlanData.priceLabel}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                <span
                  className={cn(
                    "text-right text-xs transition-colors sm:min-w-[2.75rem] sm:text-sm",
                    !isYearly ? "font-semibold text-[#171717]" : "text-gray-400"
                  )}
                >
                  Lunar
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  aria-label="Alege facturare lunară sau anuală"
                  className="data-[state=checked]:bg-[#111111] data-[state=unchecked]:bg-gray-300"
                />
                <span
                  className={cn(
                    "text-left text-xs transition-colors sm:min-w-[2.75rem] sm:text-sm",
                    isYearly ? "font-semibold text-[#171717]" : "text-gray-400"
                  )}
                >
                  Anual
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrimaryCta}
            disabled={selectedPlanUi.isDisabled}
            className={cn(
              "inline-flex min-h-14 w-full shrink-0 items-center justify-center rounded-full px-8 text-base font-semibold md:w-auto md:min-w-[220px]",
              selectedPlanUi.isDisabled
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "dashboard-start-glow bg-[#333333] text-white shadow-[0_4px_0_#0a0a0a] transition-[transform,box-shadow,opacity] hover:translate-y-1 hover:shadow-[0_1px_0_#0a0a0a] active:translate-y-1 active:shadow-[0_1px_0_#0a0a0a]"
            )}
            style={
              !selectedPlanUi.isDisabled
                ? ({ "--start-glow-tint": "rgba(255, 255, 255, 0.42)" } as CSSProperties)
                : undefined
            }
          >
            <span className="relative z-[1] inline-flex items-center justify-center gap-2">
              {selectedPlanUi.isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se deschide...
                </>
              ) : (
                <>
                  {selectedPlanUi.buttonLabel}
                  {!selectedPlanUi.isDisabled && (
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  )
}


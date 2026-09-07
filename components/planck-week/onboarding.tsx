"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronLeft, Clock, Loader2, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { OnboardingKeyframes } from "@/components/onboarding/animated-words"
import { OnboardingAccountStep } from "@/components/onboarding/onboarding-account-step"
import { signUpWithEmailPassword } from "@/lib/onboarding-email-signup"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"
import { rememberPlanckWeekLeadEmail, trackPlanckWeekLeadPixels } from "@/lib/planck-week-pixels"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import {
  getPlanckWeekPregatirePath,
  PLANCK_WEEK_MOBILE_CALENDAR_FROM,
  PLANCK_WEEK_MOBILE_CALENDAR_TO,
  PLANCK_WEEK_ONBOARDING_SUCCESS_BODY,
  PLANCK_WEEK_ONBOARDING_SUCCESS_CTA,
  PLANCK_WEEK_ONBOARDING_SUCCESS_TITLE,
} from "@/lib/planck-week"
import { supabase } from "@/lib/supabaseClient"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopPublic,
  type WorkshopSubject,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

type OnboardingStep = "subject" | "account" | "done"

function workshopFull(workshop: WorkshopPublic): boolean {
  return workshop.seats_remaining === 0
}

export function PlanckWeekOnboarding({
  open,
  onOpenChange,
  initialSubject,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSubject?: WorkshopSubject | null
}) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [step, setStep] = useState<OnboardingStep>("subject")
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loadingWorkshops, setLoadingWorkshops] = useState(false)
  const [selected, setSelected] = useState<WorkshopSubject | null>(initialSubject ?? null)
  const [oauthLoading, setOauthLoading] = useState<"google" | "email" | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState(getPlanckWeekPregatirePath(initialSubject ?? null))

  const reset = useCallback((subject?: WorkshopSubject | null) => {
    setStep("subject")
    setSelected(subject ?? null)
    setOauthLoading(null)
    setClaiming(false)
    setError(null)
    setRedirectPath(getPlanckWeekPregatirePath(subject ?? null))
  }, [])

  useEffect(() => {
    if (!open) return
    reset(initialSubject ?? null)
  }, [open, initialSubject, reset])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingWorkshops(true)
    const from = `${PLANCK_WEEK_MOBILE_CALENDAR_FROM}T00:00:00+03:00`
    const to = `${PLANCK_WEEK_MOBILE_CALENDAR_TO}T23:59:59+03:00`
    const params = new URLSearchParams({ from, to })
    void fetch(`/api/pregatire?${params.toString()}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("load")
        return (await response.json()) as { workshops?: WorkshopPublic[] }
      })
      .then((payload) => {
        if (cancelled) return
        const bySubject = new Map<WorkshopSubject, WorkshopPublic>()
        for (const workshop of payload.workshops ?? []) {
          if (!bySubject.has(workshop.subject)) bySubject.set(workshop.subject, workshop)
        }
        setWorkshops([...bySubject.values()])
      })
      .catch(() => {
        if (!cancelled) setWorkshops([])
      })
      .finally(() => {
        if (!cancelled) setLoadingWorkshops(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const selectedWorkshop = useMemo(
    () => workshops.find((workshop) => workshop.subject === selected) ?? null,
    [workshops, selected],
  )

  const claimReservation = useCallback(async () => {
    if (!selected) {
      setError("Alege o materie.")
      return false
    }
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const email = data.session?.user?.email
    if (!token || !email) {
      throw new Error("Contul a fost creat, dar nu te-am putut conecta. Încearcă din Login.")
    }

    rememberPlanckWeekLeadEmail(email)
    const name =
      typeof profile?.name === "string" && profile.name.trim().length >= 2
        ? profile.name.trim()
        : undefined

    const response = await fetch("/api/planck-week/claim", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subjects: [selected], name }),
    })
    const payload = (await response.json().catch(() => null)) as {
      error?: string
      redirectPath?: string | null
      unlockedCount?: number
    } | null
    if (!response.ok) {
      throw new Error(payload?.error ?? "Nu am putut rezerva locul.")
    }

    if (payload?.unlockedCount && payload.unlockedCount > 0) {
      trackPlanckWeekLeadPixels()
      trackFunnelEvent("planck_week_claimed", {
        subjects: selected,
        unlocked: payload.unlockedCount,
      })
    }

    const nextPath =
      payload?.redirectPath && payload.redirectPath.startsWith("/")
        ? payload.redirectPath
        : getPlanckWeekPregatirePath(selected)
    setRedirectPath(nextPath)
    setStep("done")
    return true
  }, [profile?.name, selected])

  const goAfterSubject = useCallback(async () => {
    if (!selected) {
      setError("Alege o materie.")
      return
    }
    if (selectedWorkshop && workshopFull(selectedWorkshop)) {
      setError("Nu mai sunt locuri la materia aleasă.")
      return
    }
    setError(null)
    if (user) {
      setClaiming(true)
      try {
        await claimReservation()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut rezerva locul.")
      } finally {
        setClaiming(false)
      }
      return
    }
    setStep("account")
  }, [claimReservation, selected, selectedWorkshop, user])

  const handleEmailSignup = useCallback(
    async (email: string, password: string) => {
      setOauthLoading("email")
      setError(null)
      rememberPlanckWeekLeadEmail(email)
      try {
        const signup = await signUpWithEmailPassword(email, password, {
          sendConfirmationEmail: false,
        })
        if (!signup.ok) {
          if (signup.alreadyRegistered) {
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            if (loginError) {
              setError("Ai deja un cont. Introdu parola corectă ca să rezervi locul.")
              return
            }
          } else {
            setError(signup.message)
            return
          }
        }
        await claimReservation()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut crea contul.")
      } finally {
        setOauthLoading(null)
      }
    },
    [claimReservation],
  )

  if (!open) return null

  if (step === "account") {
    return (
      <div className="fixed inset-0 z-[500] h-dvh w-full overflow-hidden bg-[#ffffff] sm:h-auto sm:min-h-screen sm:overflow-visible">
        <OnboardingKeyframes />
        <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col sm:h-auto sm:min-h-screen">
          <header className="w-full px-4 pb-1 pt-4 sm:px-8 sm:pt-7">
            <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep("subject")
                }}
                className="absolute left-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#16181d] transition-colors hover:bg-[#f0f1f5] active:bg-[#f0f1f5]"
                aria-label="Înapoi"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-4 sm:overflow-visible sm:px-6 sm:py-8">
            <div className="flex w-full flex-col justify-center sm:block">
              <OnboardingAccountStep
                oauthLoading={oauthLoading}
                onEmailSignup={handleEmailSignup}
                variant="email-only"
              />
              {error ? (
                <p className="mx-auto mt-4 max-w-[480px] text-center text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[500] overflow-y-auto bg-[#F8F7FF]">
      <OnboardingKeyframes />
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="flex items-center justify-between py-2">
          <span className="w-11" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7C5CFC]">Planck Week</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-white"
            aria-label="Închide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "subject" ? (
          <div className="flex flex-1 flex-col pb-4">
            <h2 className="mt-4 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Alege materia
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:text-base">
              Vezi profesorul, data și ora, apoi rezervă-ți locul gratuit.
            </p>

            <div className="mt-6 space-y-3">
              {loadingWorkshops ? (
                <>
                  <div className="h-28 animate-pulse rounded-2xl bg-white" />
                  <div className="h-28 animate-pulse rounded-2xl bg-white" />
                  <div className="h-28 animate-pulse rounded-2xl bg-white" />
                </>
              ) : workshops.length > 0 ? (
                workshops.map((workshop) => {
                  const full = workshopFull(workshop)
                  const active = selected === workshop.subject
                  const color = WORKSHOP_SUBJECT_COLORS[workshop.subject]
                  return (
                    <button
                      key={workshop.id}
                      type="button"
                      disabled={full}
                      onClick={() => {
                        setSelected(workshop.subject)
                        setError(null)
                      }}
                      className={cn(
                        "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition",
                        active ? "border-[#7C5CFC] ring-2 ring-[#7C5CFC]/20" : "border-[#EBE8FF]",
                        full && "cursor-not-allowed opacity-55",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                          style={{ backgroundColor: color }}
                        >
                          {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
                        </span>
                        {full ? (
                          <span className="text-[11px] font-semibold text-rose-600">Locuri epuizate</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-base font-semibold tracking-tight text-gray-900">
                        {workshop.title}
                      </p>
                      {workshop.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                          {workshop.description}
                        </p>
                      ) : null}
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="capitalize">{formatWorkshopDateTime(workshop.starts_at)}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {workshop.teacher?.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={workshop.teacher.icon_url}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F7FF] text-xs font-semibold text-[#7C5CFC]">
                            {(workshop.teacher?.name ?? "?").slice(0, 1)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-800">
                          {workshop.teacher?.name ?? "Profesor PLANCK"}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-gray-500">
                  Nu sunt meditații programate.
                </p>
              )}
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!selected || claiming || loadingWorkshops}
              onClick={() => void goAfterSubject()}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claiming ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rezervăm locul…
                </span>
              ) : (
                "Continuă"
              )}
            </button>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
            <CheckCircle2 className="h-14 w-14 text-[#2BCC56]" aria-hidden />
            <h2 className="mt-5 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              {PLANCK_WEEK_ONBOARDING_SUCCESS_TITLE}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500 sm:text-base">
              {PLANCK_WEEK_ONBOARDING_SUCCESS_BODY}
            </p>
            {selectedWorkshop ? (
              <p className="mt-4 text-sm font-semibold text-gray-800">
                {WORKSHOP_SUBJECT_LABELS[selectedWorkshop.subject]}
                {" · "}
                <span className="capitalize">{formatWorkshopDateTime(selectedWorkshop.starts_at)}</span>
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => router.push(redirectPath)}
              className="mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110"
            >
              {PLANCK_WEEK_ONBOARDING_SUCCESS_CTA}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

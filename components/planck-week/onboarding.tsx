"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
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

/** iOS ignores overflow:hidden on body; pin the document instead. */
function lockIosBodyScroll() {
  const scrollY = window.scrollY
  const body = document.body
  const html = document.documentElement
  const prev = {
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
  }

  body.style.overflow = "hidden"
  body.style.position = "fixed"
  body.style.top = `-${scrollY}px`
  body.style.left = "0"
  body.style.right = "0"
  body.style.width = "100%"
  html.style.overflow = "hidden"
  html.style.overscrollBehavior = "none"

  return () => {
    body.style.overflow = prev.bodyOverflow
    body.style.position = prev.bodyPosition
    body.style.top = prev.bodyTop
    body.style.left = prev.bodyLeft
    body.style.right = prev.bodyRight
    body.style.width = prev.bodyWidth
    html.style.overflow = prev.htmlOverflow
    html.style.overscrollBehavior = prev.htmlOverscroll
    window.scrollTo(0, scrollY)
  }
}

export function PlanckWeekOnboarding({
  open,
  onOpenChange,
  initialSubject,
  lockSubject = false,
  accountTitle,
  accountSubtitle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSubject?: WorkshopSubject | null
  /** Skip the subject picker — the landing already chose the materie. */
  lockSubject?: boolean
  accountTitle?: string
  accountSubtitle?: string
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
  const [mounted, setMounted] = useState(false)
  const [viewportBox, setViewportBox] = useState({ top: 0, height: 0 })
  const autoClaimKeyRef = useRef<string | null>(null)

  const reset = useCallback(
    (subject?: WorkshopSubject | null, skipPicker?: boolean, alreadyLoggedIn?: boolean) => {
      setSelected(subject ?? null)
      setOauthLoading(null)
      setClaiming(false)
      setError(null)
      setRedirectPath(getPlanckWeekPregatirePath(subject ?? null))
      if (skipPicker && subject) {
        setStep(alreadyLoggedIn ? "subject" : "account")
      } else {
        setStep("subject")
      }
    },
    [],
  )

  useEffect(() => {
    if (!open) {
      autoClaimKeyRef.current = null
      return
    }
    reset(initialSubject ?? null, lockSubject, Boolean(user))
    // user is read on open; do not reset when signup sets user mid-flow
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSubject, lockSubject, reset])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    return lockIosBodyScroll()
  }, [open])

  useEffect(() => {
    if (!open) return

    const update = () => {
      const vv = window.visualViewport
      if (vv) {
        setViewportBox({ top: vv.offsetTop, height: vv.height })
        return
      }
      setViewportBox({ top: 0, height: window.innerHeight })
    }

    update()
    window.visualViewport?.addEventListener("resize", update)
    window.visualViewport?.addEventListener("scroll", update)
    window.addEventListener("resize", update)
    return () => {
      window.visualViewport?.removeEventListener("resize", update)
      window.visualViewport?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
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
      conversionEventId?: string | null
    } | null
    if (!response.ok) {
      throw new Error(payload?.error ?? "Nu am putut rezerva locul.")
    }

    if (payload?.conversionEventId) {
      trackPlanckWeekLeadPixels(payload.conversionEventId)
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

  useEffect(() => {
    if (!open || !lockSubject || !user) return
    if (step === "account") return
    const key = user.id
    if (autoClaimKeyRef.current === key) return
    autoClaimKeyRef.current = key
    void goAfterSubject()
  }, [open, lockSubject, user, step, goAfterSubject])

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

  if (!open || !mounted) return null

  const overlayStyle: CSSProperties = {
    top: viewportBox.top,
    height: viewportBox.height > 0 ? viewportBox.height : "100dvh",
  }

  const overlay = step === "account" ? (
      <div
        data-mobile-scroll-lock=""
        role="dialog"
        aria-modal="true"
        aria-label="Creează contul"
        className="fixed inset-x-0 z-[500] overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white [-webkit-overflow-scrolling:touch]"
        style={overlayStyle}
      >
        <OnboardingKeyframes />
        <div className="mx-auto flex min-h-full w-full max-w-[1100px] flex-col">
          <header className="w-full px-4 pb-1 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-7">
            <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  if (lockSubject) {
                    onOpenChange(false)
                    return
                  }
                  setStep("subject")
                }}
                className="absolute left-0 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#16181d] transition-colors hover:bg-[#f0f1f5] active:bg-[#f0f1f5]"
                aria-label="Înapoi"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex flex-1 flex-col justify-start px-4 py-4 sm:justify-center sm:px-6 sm:py-8">
            <div className="flex w-full flex-col sm:block">
              <OnboardingAccountStep
                oauthLoading={oauthLoading}
                onEmailSignup={handleEmailSignup}
                variant="email-only"
                title={accountTitle}
                subtitle={accountSubtitle}
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
    ) : (
    <div
      data-mobile-scroll-lock=""
      role="dialog"
      aria-modal="true"
      aria-label="Rezervă locul la Planck Week"
      className="fixed inset-x-0 z-[500] overflow-y-auto overscroll-y-contain bg-[#F8F7FF] [-webkit-overflow-scrolling:touch]"
      style={overlayStyle}
    >
      <OnboardingKeyframes />
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
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

        {step === "subject" && lockSubject ? (
          <div className="flex flex-1 flex-col items-center justify-center px-2 pb-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" />
            <p className="mt-4 text-sm font-semibold text-gray-800">Rezervăm locul…</p>
            {error ? (
              <>
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void goAfterSubject()}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#7C5CFC] px-5 text-sm font-bold text-white"
                >
                  Încearcă din nou
                </button>
              </>
            ) : null}
          </div>
        ) : step === "subject" ? (
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

  return createPortal(overlay, document.body)
}

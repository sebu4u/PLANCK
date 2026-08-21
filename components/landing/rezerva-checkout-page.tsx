"use client"

import { useCallback, useEffect, useRef, useState, Suspense, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Clock, Flame, Loader2 } from "lucide-react"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useAuth } from "@/components/auth-provider"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import {
  getLandingSubjectGroup,
  parseLandingSubjectParam,
} from "@/lib/landing-subjects"
import { PREMIUM_WEEKLY_RON } from "@/components/pricing/premium-pricing"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_SAVE_PERCENT,
  EARLYBIRD_YEARLY_RON,
  FULL_YEARLY_RON,
  isEarlybirdActive,
  remainingEarlybirdSeats,
} from "@/lib/landing-earlybird"
import {
  LAUNCH_20_DEADLINE_LABEL,
  LAUNCH_20_PERCENT,
  isLaunch20Active,
} from "@/lib/launch-20-discount"
import { getCampaignPriceRon } from "@/lib/pricing-campaign"
import { useCountdown } from "@/lib/landing-campaign"
import { startPremiumCheckout } from "@/lib/stripe-checkout-client"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a6 6 0 0 1-2.21 3.31v2.77h3.57a11.95 11.95 0 0 0 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11.99 11.99 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09A7.02 7.02 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11.99 11.99 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

function RezervaCheckoutForm() {
  const searchParams = useSearchParams()
  const subject = parseLandingSubjectParam(searchParams.get("subject"))
  const subjectGroup = getLandingSubjectGroup(subject)
  const checkoutStatus = searchParams.get("checkout")
  const canceled = checkoutStatus === "canceled"
  const earlybirdOn = isEarlybirdActive()
  const launch20On = isLaunch20Active()
  const seatsLeft = remainingEarlybirdSeats()
  const countdown = useCountdown()
  const weeklyPriceRon = getCampaignPriceRon("week")

  const { user, login, isParent, isTeacher, profileSyncedUserId, refreshProfile, refreshUser } =
    useAuth()
  const { toast } = useToast()

  const [interval, setBillingInterval] = useState<"week" | "year">(
    searchParams.get("interval") === "week" || !earlybirdOn ? "week" : "year",
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState<"form" | "google" | "checkout" | null>(null)
  const [autoCheckout, setAutoCheckout] = useState(false)
  const checkoutStartedRef = useRef(false)

  const rezervaPath = `/rezerva?subject=${subject}&interval=${interval}`

  const launchCheckout = useCallback(async () => {
    if (checkoutStartedRef.current) return
    checkoutStartedRef.current = true
    setBusy("checkout")

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        throw new Error("Sesiune invalidă. Încearcă din nou.")
      }

      const bootstrapResponse = await fetch("/api/rezerva/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ subject }),
      })
      const bootstrapPayload = (await bootstrapResponse.json().catch(() => null)) as {
        error?: string
        blocked?: string
      } | null
      if (!bootstrapResponse.ok) {
        throw new Error(bootstrapPayload?.error || "Nu am putut pregăti contul.")
      }
      if (bootstrapPayload?.blocked === "parinte" || bootstrapPayload?.blocked === "profesor") {
        throw new Error(
          bootstrapPayload.blocked === "parinte"
            ? "Contul de părinte cumpără Premium din dashboard, pentru un copil."
            : "Contul de profesor nu poate rezerva un loc de elev.",
        )
      }

      await refreshProfile()

      const result = await startPremiumCheckout({
        accessToken,
        interval,
        campaign: interval === "year" && earlybirdOn ? "earlybird" : undefined,
        successPath: "/pregatire",
        cancelPath: rezervaPath,
      })

      if (!result.ok) {
        throw new Error(result.error)
      }
      if ("applied" in result && result.applied) {
        window.location.assign("/pregatire?checkout=success")
        return
      }
      if ("url" in result) {
        window.location.assign(result.url)
        return
      }
      throw new Error("Checkout URL lipsă.")
    } catch (error) {
      checkoutStartedRef.current = false
      setBusy(null)
      setAutoCheckout(false)
      toast({
        title: "Nu am putut porni plata",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    }
  }, [earlybirdOn, interval, refreshProfile, rezervaPath, subject, toast])

  useEffect(() => {
    if (!autoCheckout || canceled) return
    if (!user || profileSyncedUserId !== user.id) return
    if (isParent || isTeacher) return
    void launchCheckout()
  }, [autoCheckout, canceled, isParent, isTeacher, launchCheckout, profileSyncedUserId, user])

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      toast({
        title: "Email invalid",
        description: "Introdu o adresă de email validă.",
        variant: "destructive",
      })
      return
    }
    if (password.length < 8) {
      toast({
        title: "Parolă prea scurtă",
        description: "Parola trebuie să aibă cel puțin 8 caractere.",
        variant: "destructive",
      })
      return
    }

    setBusy("form")
    try {
      const accountResponse = await fetch("/api/rezerva/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })
      const accountPayload = (await accountResponse.json().catch(() => null)) as {
        error?: string
      } | null
      if (!accountResponse.ok) {
        throw new Error(accountPayload?.error || "Nu am putut crea contul.")
      }

      const { error } = await login(trimmedEmail, password)
      if (error) {
        throw new Error(
          error.message === "Invalid login credentials"
            ? "Emailul există deja. Verifică parola sau autentifică-te din Login."
            : error.message,
        )
      }
      await refreshUser()
      setAutoCheckout(true)
    } catch (error) {
      setBusy(null)
      toast({
        title: "Nu am putut continua",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    }
  }

  const handleGoogleResult = (result: OAuthPopupResult) => {
    if (result.cancelled && !result.error) {
      setBusy(null)
      return
    }
    if (result.error) {
      setBusy(null)
      toast({
        title: "Google Sign-In a eșuat",
        description: result.popupBlocked
          ? "Permite ferestrele popup și încearcă din nou."
          : result.error.message,
        variant: "destructive",
      })
      return
    }
    setBusy("google")
    setAutoCheckout(true)
  }

  if (isParent) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Cont de părinte</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Premium pentru copil se cumpără din dashboard-ul de părinte, nu din această pagină.
        </p>
        <Link
          href="/dashboard/parent"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-gray-900 px-6 text-sm font-bold text-white"
        >
          Mergi la dashboard
        </Link>
      </div>
    )
  }

  if (isTeacher) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Cont de profesor</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Rezervarea locului e pentru elevi. Contul tău de profesor nu poate cumpăra acest abonament.
        </p>
        <Link
          href="/dashboard/teacher"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-gray-900 px-6 text-sm font-bold text-white"
        >
          Mergi la dashboard
        </Link>
      </div>
    )
  }

  const waitingForCheckout = busy === "checkout" || autoCheckout

  const yearlySelected = interval === "year"

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-[#7C5CFC]">
        {subjectGroup.badge}
      </p>
      <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-gray-900">
        Rezervă-ți locul
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
        Creezi contul, apoi plătești pe Stripe. Alege planul, apoi continuă.
      </p>

      {canceled ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Plata a fost anulată. Alege planul și reia rezervarea mai jos.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setBillingInterval("week")}
          disabled={waitingForCheckout}
          className={cn(
            "rounded-2xl border p-4 text-left transition-colors",
            interval === "week"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-900 hover:border-gray-300",
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Săptămânal</p>
          {launch20On ? (
            <>
              <p className="mt-1 text-xs font-medium opacity-50 line-through">
                {PREMIUM_WEEKLY_RON} RON/săpt.
              </p>
              <p className="text-2xl font-black tracking-tight">
                {weeklyPriceRon}{" "}
                <span className="text-sm font-semibold opacity-70">RON/săpt.</span>
              </p>
              <p className={cn("mt-1 text-xs font-bold", interval === "week" ? "text-emerald-200" : "text-emerald-700")}>
                −{LAUNCH_20_PERCENT}% până pe {LAUNCH_20_DEADLINE_LABEL}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-black tracking-tight">
                {PREMIUM_WEEKLY_RON}{" "}
                <span className="text-sm font-semibold opacity-70">RON/săpt.</span>
              </p>
              <p className={cn("mt-1 text-xs", interval === "week" ? "text-white/70" : "text-gray-500")}>
                Flexibil — anulezi oricând.
              </p>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setBillingInterval("year")}
          disabled={waitingForCheckout}
          className={cn(
            "relative rounded-2xl border p-4 text-left transition-colors",
            yearlySelected
              ? "border-orange-400 bg-gradient-to-br from-[#fff7ed] to-white ring-2 ring-orange-300"
              : "border-orange-200 bg-white hover:border-orange-300",
          )}
        >
          <span className="absolute -top-2 right-3 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
            Earlybird
          </span>
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Anual</p>
          {earlybirdOn ? (
            <>
              <p className="mt-1 text-xs font-medium text-gray-400 line-through">
                {FULL_YEARLY_RON} RON/an
              </p>
              <p className="text-2xl font-black tracking-tight text-gray-900">
                {EARLYBIRD_YEARLY_RON}{" "}
                <span className="text-sm font-semibold text-gray-500">RON/an</span>
              </p>
              <p className="mt-1 text-xs font-bold text-orange-600">
                −{EARLYBIRD_SAVE_PERCENT}% până pe {EARLYBIRD_DEADLINE_LABEL}
              </p>
            </>
          ) : (
            <p className="mt-1 text-2xl font-black tracking-tight text-gray-900">
              {FULL_YEARLY_RON}{" "}
              <span className="text-sm font-semibold text-gray-500">RON/an</span>
            </p>
          )}
        </button>
      </div>

      {yearlySelected && earlybirdOn ? (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#fff3e6] to-[#fff8f0] p-4 ring-1 ring-orange-200">
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-black uppercase tracking-wider text-orange-700">
            <Flame className="h-3.5 w-3.5" />
            Locuri earlybird limitate — mai sunt {seatsLeft}
          </p>
          <p className="mt-1 text-center text-xs font-semibold text-orange-800">
            Oferta expiră pe {EARLYBIRD_DEADLINE_LABEL}. După aceea revine la {FULL_YEARLY_RON}{" "}
            RON/an.
          </p>
          <div className="mt-3 flex items-end justify-center gap-1.5">
            <span className="mb-3 hidden items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 sm:inline-flex">
              <Clock className="h-3 w-3" />
              Mai sunt
            </span>
            <CountdownUnit value={countdown.days} label="zile" size="sm" />
            <span className="mb-3 text-sm font-black text-orange-500">:</span>
            <CountdownUnit value={countdown.hours} label="ore" size="sm" />
            <span className="mb-3 text-sm font-black text-orange-500">:</span>
            <CountdownUnit value={countdown.minutes} label="min" size="sm" />
            <span className="mb-3 text-sm font-black text-orange-500">:</span>
            <CountdownUnit value={countdown.seconds} label="sec" size="sm" />
          </div>
        </div>
      ) : null}

      {waitingForCheckout ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#7C5CFC]" />
          <p className="text-sm font-medium text-gray-600">Te ducem la plată…</p>
        </div>
      ) : user ? (
        <button
          type="button"
          onClick={() => void launchCheckout()}
          disabled={busy !== null}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : yearlySelected && earlybirdOn ? (
            <>
              Plătește {EARLYBIRD_YEARLY_RON} RON/an
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Plătește {weeklyPriceRon} RON/săptămână
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      ) : (
        <>
          <form onSubmit={handleEmailSubmit} className="mt-8 space-y-3">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="h-12 rounded-full px-4"
              disabled={busy !== null}
            />
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Parolă (minim 8 caractere)"
              className="h-12 rounded-full px-4"
              disabled={busy !== null}
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="flex h-12 w-full items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
            >
              {busy === "form" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continuă la plată
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium text-gray-400">
              sau
            </p>
          </div>

          <GoogleSignInButton
            disabled={busy !== null}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-60",
            )}
            onStart={() => setBusy("google")}
            onResult={handleGoogleResult}
          >
            {busy === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuă cu Google
          </GoogleSignInButton>
        </>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        Ai deja cont?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(rezervaPath)}`} className="font-semibold text-[#7C5CFC]">
          Autentifică-te
        </Link>
      </p>
    </div>
  )
}

export function RezervaCheckoutPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-white px-4 py-10">
      <Link href="/landing" className="mx-auto text-2xl font-black tracking-tight text-gray-900">
        PLANCK
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#7C5CFC]" />
            </div>
          }
        >
          <RezervaCheckoutForm />
        </Suspense>
      </div>
    </main>
  )
}

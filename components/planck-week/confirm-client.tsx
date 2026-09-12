"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, Rocket } from "lucide-react"
import { signUpWithEmailPassword } from "@/lib/onboarding-email-signup"
import {
  formatPlanckWeekSubjects,
  getPlanckWeekPregatirePath,
  parsePlanckWeekSubjects,
  PLANCK_WEEK_GRADE_OPTIONS,
  type PlanckWeekGradeOption,
} from "@/lib/planck-week"
import { MIN_SIGNUP_PASSWORD_LENGTH } from "@/lib/email-verification"
import { trackFunnelEvent } from "@/lib/funnel-analytics"
import { trackPlanckWeekLeadPixels, rememberPlanckWeekLeadEmail } from "@/lib/planck-week-pixels"
import { supabase } from "@/lib/supabaseClient"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import { cn } from "@/lib/utils"

export function PlanckWeekConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subjects = useMemo(
    () => parsePlanckWeekSubjects(searchParams.get("materii")),
    [searchParams],
  )
  const email = (searchParams.get("email") ?? "").trim().toLowerCase()
  const name = (searchParams.get("name") ?? "").trim()
  const subjectsLabel = formatPlanckWeekSubjects(subjects)

  const [grade, setGrade] = useState<PlanckWeekGradeOption | null>(null)
  const [password, setPassword] = useState("")
  const [existingAccount, setExistingAccount] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleAuthInProgress, setGoogleAuthInProgress] = useState(false)

  useEffect(() => {
    // Track page view but NOT conversion pixels yet
    trackFunnelEvent("planck_week_confirmare_viewed", {
      subjects: subjects.join(","),
    })
    // Remember email for later pixel tracking
    if (email) {
      rememberPlanckWeekLeadEmail(email)
    }
  }, [subjects, email])

  const claimAndGo = async (gradeValue: PlanckWeekGradeOption | null) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      throw new Error("Contul a fost creat, dar nu te-am putut conecta. Încearcă din Login.")
    }

    const response = await fetch("/api/planck-week/claim", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gradeValue ? { grade: gradeValue } : {}),
    })
    const payload = (await response.json().catch(() => null)) as {
      error?: string
      redirectPath?: string | null
      unlockedCount?: number
      conversionEventId?: string | null
    } | null
    if (!response.ok) {
      throw new Error(payload?.error ?? "Nu am putut rezerva locul pe program.")
    }

    if (payload?.conversionEventId) {
      trackPlanckWeekLeadPixels(payload.conversionEventId)
      trackFunnelEvent("planck_week_claimed", {
        subjects: subjects.join(","),
        unlocked: payload.unlockedCount,
      })
    }

    const nextPath =
      payload?.redirectPath && payload.redirectPath.startsWith("/")
        ? payload.redirectPath
        : getPlanckWeekPregatirePath(subjects[0] ?? null)
    router.replace(nextPath)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email) {
      setError("Lipsește emailul. Reîncepe rezervarea.")
      return
    }
    if (!existingAccount && !grade) {
      setError("Alege clasa.")
      return
    }
    if (password.length < MIN_SIGNUP_PASSWORD_LENGTH) {
      setError(`Parola trebuie să aibă cel puțin ${MIN_SIGNUP_PASSWORD_LENGTH} caractere.`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      if (existingAccount) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (loginError) {
          setError("Parolă greșită. Încearcă din nou.")
          return
        }
        await claimAndGo(grade)
        return
      }

      const signup = await signUpWithEmailPassword(email, password, {
        sendConfirmationEmail: false,
      })
      if (!signup.ok) {
        if (signup.alreadyRegistered) {
          setExistingAccount(true)
          setPassword("")
          setError("Ai deja un cont. Introdu parola ca să intri la program.")
          return
        }
        setError(signup.message)
        return
      }

      await claimAndGo(grade)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut crea contul.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSignIn = async (result: OAuthPopupResult) => {
    if (result.error) {
      if (result.popupBlocked) {
        setError("Pop-up blocat. Permite pop-up-urile pentru acest site și încearcă din nou.")
      } else if (result.cancelled) {
        // User cancelled, no error message needed
        return
      } else {
        setError(result.error.message || "Autentificarea cu Google a eșuat.")
      }
      setGoogleAuthInProgress(false)
      return
    }

    // Wait for auth state to update
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    try {
      // After Google sign-in, claim directly without asking for grade again
      // (we'll ask for grade in the claim if needed)
      await claimAndGo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut rezerva locul.")
      setGoogleAuthInProgress(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white px-4 py-10 sm:py-16">
      <header className="mx-auto mb-10 flex w-full max-w-lg justify-center">
        <Link
          href="/"
          className="title-font flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl"
        >
          <Rocket className="h-6 w-6 shrink-0" />
          <span>PLANCK</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F7FF] ring-1 ring-[#EBE8FF]">
          <CheckCircle2 className="h-8 w-8 text-[#7C5CFC]" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          Ultimul pas: creează cont
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-500 sm:text-lg">
          {subjectsLabel
            ? `Rezervarea pentru ${subjectsLabel} se finalizează imediat ce îți faci contul. E gratuit și durează 10 secunde.`
            : "Rezervarea se finalizează imediat ce îți faci contul. E gratuit și durează 10 secunde."}
        </p>

        <div className="mt-8 space-y-5">
          <GoogleSignInButton
            disabled={googleAuthInProgress || submitting}
            onStart={() => setGoogleAuthInProgress(true)}
            onResult={handleGoogleSignIn}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#EBE8FF] bg-white px-6 text-sm font-bold text-gray-900 shadow-sm transition-all hover:border-[#7C5CFC]/30 hover:bg-[#F8F7FF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleAuthInProgress ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Se conectează…
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuă cu Google
              </>
            )}
          </GoogleSignInButton>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EBE8FF]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">sau cu email</span>
            </div>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900" htmlFor="planck-week-account-email">
              Email
            </label>
            <input
              id="planck-week-account-email"
              type="email"
              value={email}
              readOnly
              className="mt-1.5 h-11 w-full rounded-xl border border-[#EBE8FF] bg-[#F8F7FF] px-4 text-base text-gray-700 outline-none"
            />
            {name ? <p className="mt-1.5 text-xs text-gray-400">{name}</p> : null}
          </div>

          {!existingAccount ? (
            <fieldset>
              <legend className="text-sm font-semibold text-gray-900">Clasa</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PLANCK_WEEK_GRADE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGrade(option)}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-semibold transition",
                      grade === option
                        ? "border-[#7C5CFC] bg-[#7C5CFC]/10 text-[#5B47D6]"
                        : "border-[#EBE8FF] bg-[#F8F7FF] text-gray-800 hover:border-[#7C5CFC]/50",
                    )}
                  >
                    Clasa a {option}-a
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-gray-900" htmlFor="planck-week-account-password">
              Parolă
            </label>
            <input
              id="planck-week-account-password"
              type="password"
              autoComplete={existingAccount ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={existingAccount ? "Parola contului" : "Alege o parolă"}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#EBE8FF] bg-[#F8F7FF] px-4 text-base text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || googleAuthInProgress || !email}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se finalizează rezervarea…
              </span>
            ) : (
              "Finalizează rezervarea"
            )}
          </button>
          <p className="text-center text-xs text-gray-400">
            Datele tale sunt salvate. Dacă întâmpini probleme, scrie-ne la contact@planck.academy
          </p>
        </form>
      </main>
    </div>
  )
}

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
import { trackPlanckWeekLeadPixels } from "@/lib/planck-week-pixels"
import { supabase } from "@/lib/supabaseClient"
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

  useEffect(() => {
    trackPlanckWeekLeadPixels()
    trackFunnelEvent("planck_week_reserved", {
      subjects: subjects.join(","),
    })
  }, [subjects])

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
    } | null
    if (!response.ok) {
      throw new Error(payload?.error ?? "Nu am putut rezerva locul pe program.")
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
          Locul e salvat. Creează-ți contul.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-500 sm:text-lg">
          {subjectsLabel
            ? `Te-am înscris la ${subjectsLabel}. Alege clasa și o parolă ca să vezi programul live.`
            : "Te-am înscris la Planck Week. Alege clasa și o parolă ca să vezi programul live."}
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5">
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
            disabled={submitting || !email}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Se pregătește programul…
              </span>
            ) : (
              "Intră la program"
            )}
          </button>
          <p className="text-center text-xs text-gray-400">
            Chiar dacă închizi pagina acum, te-am salvat pe email. Poți reveni oricând.
          </p>
        </form>
      </main>
    </div>
  )
}

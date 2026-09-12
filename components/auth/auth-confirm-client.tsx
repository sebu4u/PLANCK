"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"
import { Loader2, Rocket } from "lucide-react"
import { sanitizeInternalPath } from "@/lib/auth-next"
import { PLANCK_WEEK_PREGATIRE_PATH } from "@/lib/planck-week"
import { rememberPlanckWeekLeadEmail, trackPlanckWeekLeadPixels } from "@/lib/planck-week-pixels"
import { supabase } from "@/lib/supabaseClient"

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

function parseOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null
  return OTP_TYPES.has(value as EmailOtpType) ? (value as EmailOtpType) : null
}

export function PlanckWeekAuthConfirmClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const nextParam = searchParams.get("next")
      const next = sanitizeInternalPath(nextParam, PLANCK_WEEK_PREGATIRE_PATH)
      const tokenHash = searchParams.get("token_hash")
      const otpType = parseOtpType(searchParams.get("type"))
      const code = searchParams.get("code")

      try {
        if (tokenHash && otpType) {
          let otpError = (
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: otpType,
            })
          ).error
          if (otpError && otpType === "magiclink") {
            otpError = (
              await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: "email",
              })
            ).error
          }
          if (otpError) throw otpError
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href,
          )
          if (exchangeError) throw exchangeError
        } else {
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            throw new Error("Link invalid sau expirat. Cere un link nou din email.")
          }
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const email = sessionData.session?.user?.email
        let redirectTo = next
        if (token) {
          try {
            const response = await fetch("/api/planck-week/claim", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
              const payload = (await response.json()) as {
                redirectPath?: string | null
                conversionEventId?: string | null
              }
              if (email) rememberPlanckWeekLeadEmail(email)
              if (payload.conversionEventId) {
                trackPlanckWeekLeadPixels(payload.conversionEventId)
              }
              if (!nextParam && payload.redirectPath?.startsWith("/")) {
                redirectTo = sanitizeInternalPath(payload.redirectPath, next)
              }
            }
          } catch {
            // Session is enough — claim can be retried from /pregatire.
          }
        }

        if (!cancelled) router.replace(redirectTo)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Nu am putut confirma accesul.")
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-white px-4 py-10">
        <header className="mx-auto mb-10 flex w-full max-w-lg justify-center">
          <Link
            href="/"
            className="title-font flex items-center gap-2 text-xl font-bold text-gray-900"
          >
            <Rocket className="h-6 w-6 shrink-0" />
            <span>PLANCK</span>
          </Link>
        </header>
        <main className="mx-auto w-full max-w-md text-center">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Link invalid sau expirat
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">{error}</p>
          <Link
            href="/planck-week"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-sm font-bold text-white"
          >
            Reîncearcă rezervarea
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" aria-hidden />
      <p className="mt-4 text-sm font-medium text-gray-500">Îți activăm locul…</p>
    </div>
  )
}

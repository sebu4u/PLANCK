"use client"

import { Loader2 } from "lucide-react"
import {
  AnimatedWords,
  ONBOARDING_STEP_ENTER_ANIM,
} from "@/components/onboarding/animated-words"
import { OnboardingEmailSignupForm } from "@/components/onboarding/onboarding-email-signup-form"
import { LiveStats } from "@/components/live-stats"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import { buildPlanSummaryCopy } from "@/lib/student-onboarding-plan"

const oauthButtonClassName =
  "flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-6 text-[15px] font-bold leading-none text-black shadow-[0_5px_0_#dadce0] transition-[transform,box-shadow,background-color] hover:translate-y-[1px] hover:bg-[#f8f9fa] hover:shadow-[0_4px_0_#dadce0] active:translate-y-[5px] active:bg-[#f1f3f4] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_5px_0_#dadce0]"

const emailInputClassName =
  "h-12 rounded-full border-[#dadce0] px-4 text-[15px] text-[#0f1115] placeholder:text-[#9aa0ad] focus-visible:ring-[#8043f0]"

const emailSubmitClassName =
  "inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#2a2a2a] px-6 text-[15px] font-bold leading-none text-[#f5f4f2] shadow-[0_5px_0_#050505] transition-[transform,box-shadow] hover:translate-y-[1px] hover:shadow-[0_4px_0_#050505] active:translate-y-[5px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_5px_0_#050505]"

type OnboardingAccountStepProps = {
  selfGrade?: number
  targetGrade?: number
  oauthLoading: "google" | "email" | null
  onGoogleStart?: () => void
  onGoogleResult?: (result: OAuthPopupResult) => void
  onEmailSignup: (email: string, password: string) => void | Promise<void>
  onTryWithoutAccount?: () => void
  onGoHome?: () => void
  /** After finishing the demo path without an account: hide “try without account”. */
  variant?: "default" | "after-demo" | "email-only"
  googleIcon?: React.ReactNode
}

export function OnboardingAccountStep({
  selfGrade,
  targetGrade,
  oauthLoading,
  onGoogleStart,
  onGoogleResult,
  onEmailSignup,
  onTryWithoutAccount,
  onGoHome,
  variant = "default",
  googleIcon,
}: OnboardingAccountStepProps) {
  const copy =
    variant === "email-only"
      ? {
          title: "Creează-ți contul",
          subtitle: "Email și parolă. După nume, ești pe dashboard.",
        }
      : buildPlanSummaryCopy({
          selfGrade: selfGrade ?? 7,
          targetGrade: targetGrade ?? 9,
        })
  const busy = oauthLoading !== null
  const emailOnly = variant === "email-only"

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div
        className="mb-4 flex justify-center sm:mb-5"
        style={{ animation: ONBOARDING_STEP_ENTER_ANIM, animationDelay: "80ms" }}
      >
        <LiveStats variant="light" centerOnMobile instant />
      </div>

      <div
        className="rounded-3xl border border-[#ececf1] bg-white px-6 py-8 opacity-0 shadow-[0_30px_70px_-40px_rgba(18,20,28,0.5)]"
        style={{ animation: ONBOARDING_STEP_ENTER_ANIM, animationDelay: "160ms" }}
      >
        <div className="mb-6 text-center">
          <AnimatedWords
            as="h1"
            text={copy.title}
            className="text-[22px] font-semibold leading-tight text-[#0f1115] sm:text-[28px]"
            startDelay={200}
          />
          <AnimatedWords
            text={copy.subtitle}
            className="mt-3 text-sm leading-relaxed text-[#666a73] sm:text-[15px]"
            startDelay={340}
          />
        </div>

        <div className="space-y-4 pb-1">
          {emailOnly || !onGoogleResult ? null : (
            <>
              <GoogleSignInButton
                disabled={busy}
                className={oauthButtonClassName}
                onStart={onGoogleStart}
                onResult={onGoogleResult}
              >
                {oauthLoading === "google" ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-black" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">{googleIcon}</span>
                )}
                Continuă cu Google
              </GoogleSignInButton>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#ececf1]" />
                <span className="text-xs font-medium uppercase tracking-wide text-[#9aa0ad]">sau</span>
                <div className="h-px flex-1 bg-[#ececf1]" />
              </div>
            </>
          )}

          <OnboardingEmailSignupForm
            disabled={busy}
            loading={oauthLoading === "email"}
            onSubmit={onEmailSignup}
            inputClassName={emailInputClassName}
            submitClassName={emailSubmitClassName}
          />
        </div>
      </div>

      {emailOnly ? null : variant === "after-demo" ? (
        <button
          type="button"
          onClick={onGoHome}
          className="mt-6 w-full bg-transparent py-2 text-center text-sm font-medium text-[#5c5f68] underline-offset-4 transition-colors hover:text-[#1a1c21] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8043f0] focus-visible:ring-offset-2"
          style={{ animation: ONBOARDING_STEP_ENTER_ANIM, animationDelay: "440ms" }}
        >
          Înapoi pe homepage
        </button>
      ) : (
        <button
          type="button"
          onClick={onTryWithoutAccount}
          className="mt-6 w-full bg-transparent py-2 text-center text-sm font-medium text-[#5c5f68] underline-offset-4 transition-colors hover:text-[#1a1c21] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8043f0] focus-visible:ring-offset-2"
          style={{ animation: ONBOARDING_STEP_ENTER_ANIM, animationDelay: "440ms" }}
        >
          Sau încearcă fără cont
        </button>
      )}
    </div>
  )
}

"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, GraduationCap, Loader2, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import {
  AnimatedWords,
  ONBOARDING_STEP_BUTTON_ANIM,
  OnboardingKeyframes,
} from "@/components/onboarding/animated-words"
import { GuardianAiIntroStep } from "@/components/onboarding/guardian-ai-intro-step"
import { GuardianRoleCard } from "@/components/onboarding/guardian-role-card"
import { GuardianTestimonialsStep } from "@/components/onboarding/guardian-testimonials-step"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import { playOnboardingSelectSound } from "@/lib/onboarding-sounds"
import {
  canAccessGuardianOnboarding,
  consumePostOnboardingRedirect,
  getDashboardPathForUserType,
  getOnboardingBlockedToast,
  OAUTH_ONBOARDING_PARAM,
  ONBOARDING_SUBJECT_OPTIONS,
  type OnboardingSubjectId,
} from "@/lib/onboarding"
import {
  defaultGuardianOnboardingState,
  getGuardianDashboardPath,
  getGuardianOAuthStep,
  getGuardianProgressPercent,
  getGuardianTestimonialsStep,
  GUARDIAN_CHILD_AGE_DEFAULT,
  GUARDIAN_CHILD_AGE_MAX,
  GUARDIAN_CHILD_AGE_MIN,
  GUARDIAN_DAILY_TIME_OPTIONS,
  GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY,
  GUARDIAN_ONBOARDING_STORAGE_KEY,
  GUARDIAN_ROLE_OPTIONS,
  sanitizeGuardianOnboardingState,
  type GuardianDailyTimeOption,
  type GuardianOnboardingState,
  type GuardianRole,
  type GuardianStep,
} from "@/lib/guardian-onboarding"

const mainCtaClassName =
  "inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_#050505]"

const choiceButtonClassName =
  "w-full rounded-full border px-5 py-3 text-left text-sm font-semibold transition-colors"

const isNumericStep = (step: GuardianStep): step is 1 | 2 | 3 | 4 | 5 | 6 | 7 => typeof step === "number"

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

const GitHubIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#181717"
      d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.43 7.88 10.96.58.1.8-.25.8-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.35-3.88-1.35-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.62 1.59.23 2.76.12 3.05.73.8 1.17 1.82 1.17 3.08 0 4.44-2.69 5.41-5.25 5.69.42.36.78 1.07.78 2.17 0 1.56-.01 2.82-.01 3.2 0 .31.2.67.81.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
    />
  </svg>
)

const ROLE_ICONS = {
  parinte: Users,
  profesor: GraduationCap,
} as const

function GuardianRegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const {
    user,
    loading,
    needsOnboarding,
    refreshProfile,
    profile,
    profileSyncedUserId,
    userType,
    loginWithGoogle,
    loginWithGitHub,
  } = useAuth()

  const [onboardingState, setOnboardingState] = useState<GuardianOnboardingState>(
    defaultGuardianOnboardingState,
  )
  const [hydrated, setHydrated] = useState(false)
  const [welcomePhase, setWelcomePhase] = useState<"intro" | "final">("intro")
  const [aiIntroReady, setAiIntroReady] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [nameSaving, setNameSaving] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null)

  const shouldForceOAuthOnboarding = searchParams.get("onboarding") === OAUTH_ONBOARDING_PARAM
  const oauthStep = getGuardianOAuthStep(onboardingState.role)
  const isOAuthStep = onboardingState.step === oauthStep
  const userId = user?.id ?? null
  const profileDisplayName = profile?.name ?? profile?.nickname ?? ""

  const handleAiIntroReadyChange = useCallback((ready: boolean) => {
    setAiIntroReady(ready)
  }, [])

  useEffect(() => {
    let parsedState = { ...defaultGuardianOnboardingState }
    const rawState = localStorage.getItem(GUARDIAN_ONBOARDING_STORAGE_KEY)

    if (rawState) {
      try {
        parsedState = sanitizeGuardianOnboardingState(JSON.parse(rawState))
      } catch {
        parsedState = { ...defaultGuardianOnboardingState }
      }
    }

    if (shouldForceOAuthOnboarding && userId) {
      const oauthFromGuardian =
        localStorage.getItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY) === "1" ||
        parsedState.awaitingPostAuth
      if (oauthFromGuardian) {
        parsedState.step = "name"
        parsedState.awaitingPostAuth = false
      } else {
        parsedState.step = 2
        parsedState.awaitingPostAuth = false
      }
    } else if (
      userId &&
      (parsedState.awaitingPostAuth ||
        localStorage.getItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY) === "1") &&
      parsedState.step !== "name"
    ) {
      parsedState.step = "name"
      parsedState.awaitingPostAuth = false
    }

    const parsedOAuthStep = getGuardianOAuthStep(parsedState.role)
    const wasInAccountCreationFlow =
      parsedState.step === parsedOAuthStep ||
      parsedState.step === "name" ||
      parsedState.awaitingPostAuth

    if (!userId && wasInAccountCreationFlow && !parsedState.awaitingPostAuth) {
      parsedState = { ...defaultGuardianOnboardingState }
      localStorage.removeItem(GUARDIAN_ONBOARDING_STORAGE_KEY)
      localStorage.removeItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY)
    }

    setOnboardingState((prev) => {
      if (
        prev.step === parsedState.step &&
        prev.role === parsedState.role &&
        prev.childAge === parsedState.childAge &&
        prev.dailyTime === parsedState.dailyTime &&
        prev.teachingMaterie === parsedState.teachingMaterie &&
        prev.awaitingPostAuth === parsedState.awaitingPostAuth
      ) {
        return prev
      }
      return parsedState
    })
    setDisplayName((prev) => (prev === profileDisplayName ? prev : profileDisplayName))
    setHydrated(true)
  }, [profileDisplayName, shouldForceOAuthOnboarding, userId])

  useEffect(() => {
    if (!shouldForceOAuthOnboarding) return
    router.replace("/register/guardian")
  }, [router, shouldForceOAuthOnboarding])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(GUARDIAN_ONBOARDING_STORAGE_KEY, JSON.stringify(onboardingState))
  }, [hydrated, onboardingState])

  useEffect(() => {
    if (onboardingState.step !== 1) return
    setWelcomePhase("intro")
    const timer = window.setTimeout(() => setWelcomePhase("final"), 3000)
    return () => window.clearTimeout(timer)
  }, [onboardingState.step])

  useEffect(() => {
    if (onboardingState.step !== 3) {
      setAiIntroReady(false)
    }
  }, [onboardingState.step])

  const oauthResumeHandledRef = useRef(false)
  const blockedRedirectHandledRef = useRef(false)

  const clearGuardianOnboardingStorage = useCallback(() => {
    localStorage.removeItem(GUARDIAN_ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY)
  }, [])

  useEffect(() => {
    if (!hydrated || loading || !user || profileSyncedUserId !== user.id) return
    if (canAccessGuardianOnboarding(profile)) return
    if (blockedRedirectHandledRef.current) return

    blockedRedirectHandledRef.current = true
    const blockedToast = getOnboardingBlockedToast(userType, "guardian")
    toast({
      title: blockedToast.title,
      description: blockedToast.description,
      variant: "destructive",
    })
    clearGuardianOnboardingStorage()
    router.replace(getDashboardPathForUserType(userType))
  }, [
    clearGuardianOnboardingStorage,
    hydrated,
    loading,
    profile,
    profileSyncedUserId,
    router,
    toast,
    user,
    userType,
  ])

  useEffect(() => {
    if (!hydrated || !userId || !needsOnboarding) return

    const oauthFromGuardian =
      onboardingState.awaitingPostAuth ||
      localStorage.getItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY) === "1"

    if (oauthFromGuardian && onboardingState.step !== "name") {
      localStorage.removeItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY)
      oauthResumeHandledRef.current = true
      setOnboardingState((prev) => {
        if (prev.step === "name" && !prev.awaitingPostAuth) return prev
        return {
          ...prev,
          step: "name",
          awaitingPostAuth: false,
        }
      })
      return
    }

    if (
      needsOnboarding &&
      !oauthFromGuardian &&
      onboardingState.step === 1 &&
      shouldForceOAuthOnboarding &&
      !oauthResumeHandledRef.current
    ) {
      setOnboardingState((prev) => (prev.step === 2 ? prev : { ...prev, step: 2 }))
    }
  }, [
    hydrated,
    needsOnboarding,
    onboardingState.awaitingPostAuth,
    onboardingState.step,
    shouldForceOAuthOnboarding,
    userId,
  ])

  const setStep = (step: GuardianStep) => {
    setOnboardingState((prev) => ({ ...prev, step }))
  }

  const handleBack = () => {
    if (!isNumericStep(onboardingState.step) || onboardingState.step <= 1) return

    if (onboardingState.step === 4) {
      setStep(3)
      return
    }

    if (onboardingState.step === 5 && onboardingState.role === "profesor") {
      setStep(4)
      return
    }

    if (onboardingState.step === 6 && onboardingState.role === "parinte") {
      setStep(5)
      return
    }

    if (onboardingState.step === 6 && onboardingState.role === "profesor") {
      setStep(5)
      return
    }

    if (onboardingState.step === 7 && onboardingState.role === "profesor") {
      setStep(6)
      return
    }

    if (onboardingState.step === 5 && onboardingState.role === "parinte") {
      setStep(4)
      return
    }

    setStep((onboardingState.step - 1) as GuardianStep)
  }

  const handleContinue = () => {
    switch (onboardingState.step) {
      case 1:
        setStep(2)
        break
      case 2:
        if (!onboardingState.role) {
          toast({
            title: "Alege o opțiune",
            description: "Selectează dacă ești părinte sau profesor.",
            variant: "destructive",
          })
          return
        }
        setStep(3)
        break
      case 3:
        if (!aiIntroReady) return
        setStep(4)
        break
      case 4:
        if (onboardingState.role === "parinte") {
          if (!onboardingState.dailyTime) {
            toast({
              title: "Alege timpul zilnic",
              description: "Ne ajută să calibrăm recomandările pentru copilul tău.",
              variant: "destructive",
            })
            return
          }
          setStep(5)
          break
        }

        if (!onboardingState.teachingMaterie) {
          toast({
            title: "Alege materia",
            description: "Selectează materia pe care o predai.",
            variant: "destructive",
          })
          return
        }
        setStep(5)
        break
      case 5:
        if (onboardingState.role === "parinte") {
          if (user && needsOnboarding) {
            setStep("name")
            break
          }
          setStep(6)
        } else {
          setStep(6)
        }
        break
      case 6:
        if (onboardingState.role === "profesor") {
          if (user && needsOnboarding) {
            setStep("name")
            break
          }
          setStep(7)
        }
        break
      default:
        break
    }
  }

  const handleRoleSelect = (role: GuardianRole) => {
    playOnboardingSelectSound()
    setOnboardingState((prev) => ({ ...prev, role }))
  }

  const handleDailyTimeSelect = (dailyTime: GuardianDailyTimeOption) => {
    playOnboardingSelectSound()
    setOnboardingState((prev) => ({ ...prev, dailyTime }))
  }

  const handleSubjectSelect = (subject: OnboardingSubjectId) => {
    playOnboardingSelectSound()
    setOnboardingState((prev) => ({ ...prev, teachingMaterie: subject }))
  }

  const handleChildAgeChange = (value: number) => {
    setOnboardingState((prev) => ({
      ...prev,
      childAge: Math.min(GUARDIAN_CHILD_AGE_MAX, Math.max(GUARDIAN_CHILD_AGE_MIN, Math.round(value))),
    }))
  }

  const markStateForOAuthReturn = () => {
    const nextState: GuardianOnboardingState = {
      ...onboardingState,
      awaitingPostAuth: true,
    }
    localStorage.setItem(GUARDIAN_ONBOARDING_STORAGE_KEY, JSON.stringify(nextState))
    localStorage.setItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY, "1")
    setOnboardingState(nextState)
  }

  const clearOAuthFlag = () => localStorage.removeItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY)

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setOauthLoading(provider)
    markStateForOAuthReturn()

    const { error, popupBlocked } =
      provider === "google" ? await loginWithGoogle() : await loginWithGitHub()

    if (error) {
      clearOAuthFlag()
      setOnboardingState((prev) => ({
        ...prev,
        step: oauthStep,
        awaitingPostAuth: false,
      }))
      toast({
        title:
          provider === "google"
            ? "Eroare la autentificare cu Google"
            : "Eroare la autentificare cu GitHub",
        description: popupBlocked
          ? "Permite ferestrele pop-up pentru acest site, apoi încearcă din nou."
          : error.message,
        variant: "destructive",
      })
    }
    setOauthLoading(null)
  }

  const handleGoogleOAuthStart = () => {
    setOauthLoading("google")
    markStateForOAuthReturn()
  }

  const handleGoogleOAuthResult = (result: OAuthPopupResult) => {
    if (result.cancelled) {
      clearOAuthFlag()
      setOauthLoading(null)
      setOnboardingState((prev) => ({
        ...prev,
        awaitingPostAuth: false,
      }))
      return
    }

    if (result.error) {
      clearOAuthFlag()
      setOnboardingState((prev) => ({
        ...prev,
        step: oauthStep,
        awaitingPostAuth: false,
      }))
      toast({
        title: "Eroare la autentificare cu Google",
        description: result.popupBlocked
          ? "Permite ferestrele pop-up pentru acest site, apoi încearcă din nou."
          : result.error.message,
        variant: "destructive",
      })
    }
    setOauthLoading(null)
  }

  const handleNameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast({
        title: "Conectează-te mai întâi",
        description: "Pentru a salva numele, trebuie să fii autentificat.",
        variant: "destructive",
      })
      setStep(oauthStep)
      return
    }

    if (!onboardingState.role) {
      toast({
        title: "Onboarding incomplet",
        description: "Reia pașii de la început.",
        variant: "destructive",
      })
      setStep(2)
      return
    }

    if (!canAccessGuardianOnboarding(profile)) {
      const blockedToast = getOnboardingBlockedToast(userType, "guardian")
      toast({
        title: blockedToast.title,
        description: blockedToast.description,
        variant: "destructive",
      })
      clearGuardianOnboardingStorage()
      router.replace(getDashboardPathForUserType(userType))
      return
    }

    const cleanName = displayName.trim()
    if (cleanName.length < 2) {
      toast({
        title: "Nume prea scurt",
        description: "Introdu un nume de cel puțin 2 caractere.",
        variant: "destructive",
      })
      return
    }

    if (onboardingState.role === "profesor" && !onboardingState.teachingMaterie) {
      toast({
        title: "Onboarding incomplet",
        description: "Reia pașii de la început.",
        variant: "destructive",
      })
      setStep(4)
      return
    }

    if (onboardingState.role === "parinte" && !onboardingState.dailyTime) {
      toast({
        title: "Onboarding incomplet",
        description: "Reia pașii de la început.",
        variant: "destructive",
      })
      setStep(4)
      return
    }

    setNameSaving(true)

    const requestBody =
      onboardingState.role === "profesor"
        ? {
            name: cleanName,
            role: "profesor" as const,
            teachingMaterie: onboardingState.teachingMaterie,
          }
        : {
            name: cleanName,
            role: "parinte" as const,
            childAge: onboardingState.childAge ?? GUARDIAN_CHILD_AGE_DEFAULT,
            dailyTime: onboardingState.dailyTime,
          }

    let response: Response
    try {
      response = await fetch("/api/register/guardian/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
    } catch {
      toast({
        title: "Nu am putut salva profilul",
        description: "Mai încearcă o dată, te rog.",
        variant: "destructive",
      })
      setNameSaving(false)
      return
    }

    if (!response.ok) {
      if (response.status === 409) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        toast({
          title: "Cont activ",
          description:
            body?.error ??
            "Contul tău existent nu poate fi folosit pentru acest tip de înregistrare.",
          variant: "destructive",
        })
        clearGuardianOnboardingStorage()
        router.replace(getDashboardPathForUserType(userType))
        setNameSaving(false)
        return
      }

      toast({
        title: "Nu am putut salva profilul",
        description: "Mai încearcă o dată, te rog.",
        variant: "destructive",
      })
      setNameSaving(false)
      return
    }

    localStorage.removeItem(GUARDIAN_ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(GUARDIAN_ONBOARDING_AFTER_OAUTH_KEY)

    await refreshProfile()
    const postOnboardingRedirect = consumePostOnboardingRedirect()
    router.push(postOnboardingRedirect ?? getGuardianDashboardPath(onboardingState.role))
  }

  const renderOAuthStep = () => (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="rounded-3xl border border-[#ececf1] bg-white px-6 py-8 shadow-[0_30px_70px_-40px_rgba(18,20,28,0.5)]">
        <h1 className="text-center text-[30px] font-semibold leading-tight text-[#0f1115]">
          Salvează-ți contul
        </h1>
        <p className="mb-6 mt-2 text-center text-sm text-[#666a73]">
          Conectează-te ca să păstrăm progresul și setările tale.
        </p>

        <div className="space-y-3">
          <GoogleSignInButton
            disabled={oauthLoading !== null}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#d9dbe3] bg-white px-4 font-semibold text-[#111111] transition-colors hover:bg-[#f5f6fa] disabled:opacity-70"
            onStart={handleGoogleOAuthStart}
            onResult={handleGoogleOAuthResult}
          >
            {oauthLoading === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
            Continuă cu Google
          </GoogleSignInButton>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={oauthLoading !== null}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#d9dbe3] bg-white px-4 font-semibold text-[#111111] transition-colors hover:bg-[#f5f6fa] disabled:opacity-70"
          >
            {oauthLoading === "github" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GitHubIcon />}
            Continuă cu GitHub
          </button>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    if (!hydrated || loading) {
      return (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )
    }

    switch (onboardingState.step) {
      case 1:
        return (
          <div className="mx-auto max-w-[560px] text-center">
            {welcomePhase === "intro" ? (
              <div className="space-y-3">
                <AnimatedWords
                  text="Planck nu e doar pentru elevi."
                  className="text-[1.75rem] font-bold text-[#111111] sm:text-4xl"
                />
                <AnimatedWords
                  text="E și pentru cei care îi susțin."
                  className="text-base font-semibold text-[#222222] sm:text-lg"
                  startDelay={850}
                />
              </div>
            ) : (
              <AnimatedWords
                text="Hai să vedem cum te putem ajuta."
                className="text-[1.75rem] font-bold text-[#111111] sm:text-4xl"
              />
            )}
          </div>
        )

      case 2:
        return (
          <div className="mx-auto w-full max-w-[520px]">
            <AnimatedWords
              as="h1"
              text="Ești părinte sau profesor?"
              className="mb-5 text-[25px] font-semibold leading-tight text-[#0f1115] sm:mb-7 sm:text-[32px]"
            />
            <div className="space-y-3">
              {GUARDIAN_ROLE_OPTIONS.map((option, idx) => (
                <GuardianRoleCard
                  key={option.id}
                  label={option.label}
                  description={option.description}
                  icon={ROLE_ICONS[option.id]}
                  selected={onboardingState.role === option.id}
                  onSelect={() => handleRoleSelect(option.id)}
                  animationDelay={`${220 + idx * 70}ms`}
                />
              ))}
            </div>
          </div>
        )

      case 3:
        return <GuardianAiIntroStep onReadyChange={handleAiIntroReadyChange} />

      case 4:
        if (onboardingState.role === "parinte") {
          return (
            <div className="mx-auto w-full max-w-[520px]">
              <AnimatedWords
                as="h1"
                text="Spune-ne puțin despre copilul tău"
                className="mb-2 text-[25px] font-semibold leading-tight text-[#0f1115] sm:text-[32px]"
              />
              <p className="mb-6 text-sm text-[#666a73]">
                Ne ajută să adaptăm recomandările la vârsta și ritmul lui.
              </p>

              <div className="mb-8 rounded-3xl border border-[#eceff3] bg-[#fafafa] px-5 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#6b7280]">Vârsta copilului</span>
                  <span className="text-sm font-semibold tabular-nums text-[#111827]">
                    {onboardingState.childAge ?? 14} ani
                  </span>
                </div>
                <input
                  type="range"
                  min={GUARDIAN_CHILD_AGE_MIN}
                  max={GUARDIAN_CHILD_AGE_MAX}
                  value={onboardingState.childAge ?? 14}
                  onChange={(event) => handleChildAgeChange(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e5e7eb] accent-[#8043f0]"
                />
                <div className="mt-2 flex justify-between text-xs text-[#9ca3af]">
                  <span>{GUARDIAN_CHILD_AGE_MIN} ani</span>
                  <span>{GUARDIAN_CHILD_AGE_MAX} ani</span>
                </div>
              </div>

              <AnimatedWords
                as="h2"
                text="Cât timp poate aloca zilnic?"
                className="mb-4 text-lg font-semibold text-[#0f1115]"
              />
              <div className="space-y-3">
                {GUARDIAN_DAILY_TIME_OPTIONS.map((option, idx) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${choiceButtonClassName} opacity-0 ${
                      onboardingState.dailyTime === option.id
                        ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                        : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                    }`}
                    style={{ animation: ONBOARDING_STEP_BUTTON_ANIM, animationDelay: `${280 + idx * 70}ms` }}
                    onClick={() => handleDailyTimeSelect(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )
        }

        return (
          <div className="mx-auto w-full max-w-[520px]">
            <AnimatedWords
              as="h1"
              text="Ce materie predai?"
              className="mb-5 text-[25px] font-semibold leading-tight text-[#0f1115] sm:mb-7 sm:text-[32px]"
            />
            <div className="space-y-3">
              {ONBOARDING_SUBJECT_OPTIONS.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${choiceButtonClassName} opacity-0 ${
                    onboardingState.teachingMaterie === option.id
                      ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                      : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                  }`}
                  style={{ animation: ONBOARDING_STEP_BUTTON_ANIM, animationDelay: `${220 + idx * 70}ms` }}
                  onClick={() => handleSubjectSelect(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        if (onboardingState.role === "parinte") {
          return onboardingState.role ? (
            <GuardianTestimonialsStep role={onboardingState.role} />
          ) : null
        }

        return (
          <div className="mx-auto max-w-[560px] text-center">
            <AnimatedWords
              text="Creezi clase, inviți elevi și urmărești progresul — totul într-un singur loc."
              className="text-[1.75rem] font-bold text-[#111111] sm:text-4xl"
            />
          </div>
        )

      case 6:
        if (onboardingState.role === "parinte") {
          return renderOAuthStep()
        }

        return onboardingState.role ? (
          <GuardianTestimonialsStep role={onboardingState.role} />
        ) : null

      case 7:
        return renderOAuthStep()

      case "name":
        return (
          <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-[#ececf1] bg-white p-7 shadow-[0_30px_70px_-45px_rgba(18,20,28,0.5)]">
            <h1 className="text-3xl font-semibold text-[#0f1115]">Cum te numim?</h1>
            <p className="mb-6 mt-2 text-sm text-[#666a73]">
              Așa te vom afișa în dashboard și în interacțiunile cu platforma.
            </p>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Numele tău"
                maxLength={60}
                className="h-12 rounded-full border-[#d8dbe3] px-4 text-base text-[#101216] placeholder:text-[#9aa0ad] focus-visible:ring-[#8043f0]"
              />

              <button type="submit" disabled={nameSaving} className={`${mainCtaClassName} w-full`}>
                {nameSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvăm...
                  </span>
                ) : (
                  "Continuă"
                )}
              </button>
            </form>
          </div>
        )

      default:
        return null
    }
  }

  const maxProgressStep = onboardingState.role === "profesor" ? 7 : 6
  const progressPercent = getGuardianProgressPercent(onboardingState.step, onboardingState.role)
  const showProgressBar = isNumericStep(onboardingState.step) && onboardingState.step <= maxProgressStep
  const showBackButton =
    isNumericStep(onboardingState.step) &&
    onboardingState.step >= 2 &&
    onboardingState.step <= maxProgressStep &&
    !isOAuthStep
  const showBottomCta =
    isNumericStep(onboardingState.step) &&
    onboardingState.step <= maxProgressStep &&
    !isOAuthStep
  const isTestimonialsStep =
    onboardingState.role !== null &&
    onboardingState.step === getGuardianTestimonialsStep(onboardingState.role)

  const isContinueDisabled =
    (onboardingState.step === 2 && !onboardingState.role) ||
    (onboardingState.step === 3 && !aiIntroReady) ||
    (onboardingState.step === 4 &&
      onboardingState.role === "parinte" &&
      !onboardingState.dailyTime) ||
    (onboardingState.step === 4 &&
      onboardingState.role === "profesor" &&
      !onboardingState.teachingMaterie)

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#ffffff] sm:min-h-screen sm:h-auto sm:overflow-visible">
      <OnboardingKeyframes />

      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col sm:min-h-screen sm:h-auto">
        {showProgressBar && (
          <header className="w-full px-4 pb-1 pt-4 sm:px-8 sm:pt-7">
            <div className="mx-auto hidden w-full max-w-[520px] items-center gap-4 sm:flex">
              <div className="w-6">
                {showBackButton ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#16181d] transition-colors hover:bg-[#f0f1f5]"
                    aria-label="Înapoi"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ebebef]">
                <div
                  className="h-full rounded-full bg-[#8043f0] transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center sm:hidden">
              {showBackButton ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="absolute left-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#16181d] transition-colors active:bg-[#f0f1f5]"
                  aria-label="Înapoi"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
              <div className="h-1.5 w-[78%] overflow-hidden rounded-full bg-[#ebebef]">
                <div
                  className="h-full rounded-full bg-[#8043f0] transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </header>
        )}

        <main
          className={`flex min-h-0 flex-1 justify-center px-4 sm:px-6 ${
            isTestimonialsStep
              ? "items-center overflow-hidden pb-28 pt-0 sm:items-center sm:overflow-visible sm:py-8"
              : showBottomCta
                ? "items-center overflow-hidden pb-28 pt-3 sm:items-center sm:overflow-visible sm:pb-28 sm:pt-8"
                : "items-center overflow-hidden py-4 sm:overflow-visible sm:py-8"
          }`}
        >
          <div
            className={
              isTestimonialsStep
                ? "flex w-full flex-1 flex-col justify-center lg:min-h-0 lg:justify-start"
                : "contents"
            }
          >
            {renderStepContent()}
          </div>
        </main>

        {showBottomCta && (
          <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 sm:px-6 sm:pb-6 sm:pt-3">
            <div className="mx-auto flex max-w-[520px] justify-center">
              <button
                type="button"
                onClick={handleContinue}
                disabled={isContinueDisabled}
                className={`${mainCtaClassName} w-full sm:w-auto`}
              >
                Continuă
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}

export default function GuardianRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <GuardianRegisterPageContent />
    </Suspense>
  )
}

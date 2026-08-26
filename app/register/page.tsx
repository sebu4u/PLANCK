"use client"

import Image from "next/image"
import { Suspense, useEffect, useState } from "react"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import { OnboardingAccountStep } from "@/components/onboarding/onboarding-account-step"
import { OnboardingGradeSliderStep } from "@/components/onboarding/onboarding-grade-slider-step"
import { LoadingVideoOverlay } from "@/components/loading-video-overlay"
import { signUpWithEmailPassword } from "@/lib/onboarding-email-signup"
import { finalizeStudentOnboarding } from "@/lib/student-onboarding-complete"
import { tiktokPixel } from "@/lib/tiktok-pixel"
import { metaPixel } from "@/lib/meta-pixel"
import { STUDENT_STEP_NAMES } from "@/lib/funnel-analytics"
import { useOnboardingFunnel } from "@/hooks/use-onboarding-funnel"
import { supabase } from "@/lib/supabaseClient"
import {
  clampSelfGrade,
  clampTargetGrade,
  defaultTargetGrade,
} from "@/lib/student-onboarding-plan"
import { formatGrade } from "@/lib/parent/grade-estimate"
import { getPostOnboardingDiscountStorageKey } from "@/hooks/use-post-onboarding-discount-window"
import {
  getPostOnboardingLearningPathItemHref,
} from "@/lib/supabase-learning-paths"
import { getPostOnboardingLearningPathCtaLabel } from "@/lib/practice-subject"
import { playOnboardingSelectSound } from "@/lib/onboarding-sounds"
import {
  canAccessStudentOnboarding,
  consumePostOnboardingRedirect,
  getDashboardPathForUserType,
  getOnboardingBlockedToast,
  isOnboardingSubjectId,
  OAUTH_ONBOARDING_PARAM,
  GUEST_DEMO_ONBOARDING_PARAM,
  CAMPAIGN_1LEU_ONBOARDING_PARAM,
  ONBOARDING_SUBJECT_OPTIONS,
  type OnboardingSubjectId,
  type GuestDemoStatus,
  markGuestDemoStarted,
  clearGuestDemo,
  getGuestDemoStatus,
} from "@/lib/onboarding"

type SubjectOption = OnboardingSubjectId
type GradeOption = "9" | "10" | "11" | "12"
type DailyTimeOption = "15" | "30" | "60"
type RegisterStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | "name"

type CampaignSignup = "1leu"

type OnboardingState = {
  step: RegisterStep
  subject: SubjectOption | null
  grade: GradeOption | null
  selfGrade: number | null
  targetGrade: number | null
  dailyTime: DailyTimeOption | null
  awaitingPostAuth: boolean
  guestDemo: GuestDemoStatus | null
  campaignSignup: CampaignSignup | null
}

const PROGRESS_STEPS = 5
const ACCOUNT_STEP = 9
const LEGACY_SPLASH_STEP = 10
const DEFAULT_SELF_GRADE = 7
const SKIPPED_ONBOARDING_STEPS = new Set<number>([6, 7, 8])

const REGISTER_ONBOARDING_STORAGE_KEY = "planck_register_onboarding"
const ONBOARDING_AFTER_OAUTH_KEY = "planck_onboarding_after_oauth"

const defaultOnboardingState: OnboardingState = {
  step: 1,
  subject: null,
  grade: null,
  selfGrade: null,
  targetGrade: null,
  dailyTime: null,
  awaitingPostAuth: false,
  guestDemo: null,
  campaignSignup: null,
}

const subjectHeadlines: Record<SubjectOption, string> = {
  matematica: "Excelent, construim raționament matematic pas cu pas.",
  fizica: "Perfect, facem fizica mai clară împreună.",
  informatica: "Excelent, construim logică de programator.",
  biologie: "Super, explorăm lumea vie împreună.",
}

const gradeHeadlines: Record<GradeOption, string> = {
  "9": "Clasa a IX-a, punem fundația corectă.",
  "10": "Clasa a X-a, consolidăm ideile-cheie rapid.",
  "11": "Clasa a XI-a, trecem la nivel avansat.",
  "12": "Clasa a XII-a, focus pe examen.",
}

const mainCtaClassName =
  "inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_#050505]"

const choiceButtonClassName =
  "w-full rounded-full border px-5 py-3 text-left text-sm font-semibold transition-colors"

const isNumericStep = (step: RegisterStep): step is 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 =>
  typeof step === "number"

const sanitizeStep = (value: unknown): RegisterStep => {
  if (value === "name") return "name"
  if (value === 0 || value === "coming_soon") return 1
  if (typeof value === "number") {
    if (value === LEGACY_SPLASH_STEP) return "name"
    if (SKIPPED_ONBOARDING_STEPS.has(value)) return ACCOUNT_STEP
    if (value >= 1 && value <= 9) return value as RegisterStep
  }
  return 1
}

const sanitizeGradeValue = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return clampSelfGrade(value)
}

const sanitizeSubject = (value: unknown): SubjectOption | null =>
  isOnboardingSubjectId(value) ? value : null

const sanitizeGrade = (value: unknown): GradeOption | null =>
  value === "9" || value === "10" || value === "11" || value === "12" ? value : null

const sanitizeDailyTime = (value: unknown): DailyTimeOption | null =>
  value === "15" || value === "30" || value === "60" ? value : null

const sanitizeGuestDemo = (value: unknown): GuestDemoStatus | null =>
  value === "started" || value === "completed" ? value : null

const sanitizeCampaignSignup = (value: unknown): CampaignSignup | null =>
  value === "1leu" ? "1leu" : null

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

function AnimatedWords({
  text,
  className,
  startDelay = 0,
  as: Tag = "p",
}: {
  text: string
  className?: string
  startDelay?: number
  as?: "p" | "h1"
}) {
  const words = text.split(" ")

  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block opacity-0"
          style={{
            animation: "registerWordFade 420ms ease-out forwards",
            animationDelay: `${startDelay + index * 80}ms`,
          }}
        >
          {word}
          {index === words.length - 1 ? "" : "\u00A0"}
        </span>
      ))}
    </Tag>
  )
}

const STEP_ENTER_ANIM = "registerStepEnter 500ms ease-out forwards"
const STEP_POP_FROM_LEFT_ANIM = "registerStepPopFromLeft 420ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
const STEP_IMAGE_ANIM = "registerStepImageEnter 450ms ease-out forwards"
const STEP_BUTTON_ANIM = "registerStepButtonEnter 400ms ease-out forwards"

function StepHeadingWithIcon({
  children,
  subtitle,
  className,
  popFromLeft,
}: {
  children: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  popFromLeft?: boolean
}) {
  const headingText = typeof children === "string" ? children : String(children)
  const useWordByWord = !popFromLeft
  const headingClassName = "text-[25px] font-semibold leading-tight text-[#0f1115] sm:text-[32px]"

  return (
    <div className={`mb-5 flex items-start gap-3 sm:mb-7 sm:gap-5 ${className ?? ""}`}>
      <div
        className="-mt-0.5 flex-shrink-0 opacity-0"
        style={{ animation: STEP_IMAGE_ANIM }}
      >
        <Image
          src="/streak-icon.png"
          alt=""
          width={64}
          height={64}
          className="h-12 w-12 rounded-lg object-contain sm:h-16 sm:w-16"
        />
      </div>
      <div className="min-w-0 flex-1">
        {useWordByWord ? (
          <AnimatedWords
            as="h1"
            text={headingText}
            className={headingClassName}
            startDelay={80}
          />
        ) : (
          <h1
            key={headingText}
            className={`${headingClassName} opacity-0`}
            style={{ animation: STEP_POP_FROM_LEFT_ANIM, animationDelay: "0ms" }}
          >
            {children}
          </h1>
        )}
        {subtitle && (
          <p
            className="mt-2 text-[13px] text-[#666a73] opacity-0 sm:text-sm"
            style={{ animation: STEP_ENTER_ANIM, animationDelay: "180ms" }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

function RegisterPageContent() {
  const [hydrated, setHydrated] = useState(false)
  const [welcomePhase, setWelcomePhase] = useState<"intro" | "final">("intro")
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    if (typeof window === "undefined") return defaultOnboardingState
    try {
      const onboarding = new URLSearchParams(window.location.search).get("onboarding")
      if (onboarding === CAMPAIGN_1LEU_ONBOARDING_PARAM) {
        return { ...defaultOnboardingState, step: ACCOUNT_STEP, campaignSignup: "1leu" }
      }
    } catch {
      // ignore
    }
    return defaultOnboardingState
  })
  const [oauthLoading, setOauthLoading] = useState<"google" | "email" | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [nameSaving, setNameSaving] = useState(false)
  const [guestFirstItemHref, setGuestFirstItemHref] = useState<string | null>(null)
  // Set right after the name is saved successfully, while we resolve the redirect target and
  // navigate away: masks the brief "onboarding restarts" flash caused by the hydration effect
  // re-running (it clears onboardingState back to step 1) once `profile` refreshes with the new name.
  const [isFinalizing, setIsFinalizing] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, profileSyncedUserId, userType, needsOnboarding, refreshProfile } = useAuth()

  const { markCompleted } = useOnboardingFunnel({
    flow: "student",
    step: onboardingState.step,
    stepName: STUDENT_STEP_NAMES[String(onboardingState.step)] ?? String(onboardingState.step),
    extra: {
      subject: onboardingState.subject,
      grade: onboardingState.grade,
    },
    enabled: hydrated,
  })

  const shouldForcePostAuthStep = searchParams.get("onboarding") === "1"
  const shouldForceOAuthOnboarding = searchParams.get("onboarding") === OAUTH_ONBOARDING_PARAM
  const shouldForceGuestSignup = searchParams.get("onboarding") === GUEST_DEMO_ONBOARDING_PARAM
  const shouldForce1LeuSignup = searchParams.get("onboarding") === CAMPAIGN_1LEU_ONBOARDING_PARAM

  useEffect(() => {
    const referralFromUrl = searchParams.get("ref")
    if (!referralFromUrl) return
    localStorage.setItem("planck_referral_code", referralFromUrl.toUpperCase())
  }, [searchParams])

  useEffect(() => {
    let parsedState = { ...defaultOnboardingState }
    const rawState = localStorage.getItem(REGISTER_ONBOARDING_STORAGE_KEY)
    if (rawState) {
      try {
        const decoded = JSON.parse(rawState) as Partial<OnboardingState>
        parsedState = {
          step: sanitizeStep(decoded.step),
          subject: sanitizeSubject(decoded.subject),
          grade: sanitizeGrade(decoded.grade),
          selfGrade: sanitizeGradeValue(decoded.selfGrade),
          targetGrade: sanitizeGradeValue(decoded.targetGrade),
          dailyTime: sanitizeDailyTime(decoded.dailyTime),
          awaitingPostAuth: Boolean(decoded.awaitingPostAuth),
          guestDemo: sanitizeGuestDemo(decoded.guestDemo) ?? getGuestDemoStatus(),
          campaignSignup: sanitizeCampaignSignup(decoded.campaignSignup),
        }
      } catch {
        parsedState = { ...defaultOnboardingState }
      }
    }

    if (shouldForceOAuthOnboarding && user) {
      const oauthFromRegister =
        localStorage.getItem(ONBOARDING_AFTER_OAUTH_KEY) === "1" ||
        parsedState.awaitingPostAuth ||
        parsedState.step === "name"
      if (oauthFromRegister) {
        parsedState.step = "name"
        parsedState.awaitingPostAuth = false
      } else {
        parsedState.step = 2
        parsedState.awaitingPostAuth = false
      }
    } else if (shouldForce1LeuSignup) {
      parsedState.step = user ? "name" : ACCOUNT_STEP
      parsedState.campaignSignup = "1leu"
      parsedState.awaitingPostAuth = false
    } else if (shouldForcePostAuthStep) {
      parsedState.step = "name"
      parsedState.awaitingPostAuth = true
    } else if (
      user &&
      (parsedState.awaitingPostAuth || localStorage.getItem(ONBOARDING_AFTER_OAUTH_KEY) === "1") &&
      parsedState.step !== "name"
    ) {
      parsedState.step = "name"
      parsedState.awaitingPostAuth = false
    } else if (
      !user &&
      (shouldForceGuestSignup || parsedState.guestDemo === "completed" || getGuestDemoStatus() === "completed")
    ) {
      parsedState.step = ACCOUNT_STEP
      parsedState.guestDemo = "completed"
      parsedState.awaitingPostAuth = false
    }

    const guestDemoInProgress =
      parsedState.guestDemo === "started" || parsedState.guestDemo === "completed"
    const wasInAccountCreationFlow =
      parsedState.step === ACCOUNT_STEP ||
      parsedState.step === "name" ||
      parsedState.awaitingPostAuth
    if (
      !user &&
      wasInAccountCreationFlow &&
      !parsedState.awaitingPostAuth &&
      !guestDemoInProgress &&
      parsedState.campaignSignup !== "1leu"
    ) {
      parsedState = { ...defaultOnboardingState }
      if (typeof window !== "undefined") {
        localStorage.removeItem(REGISTER_ONBOARDING_STORAGE_KEY)
        localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)
        clearGuestDemo()
      }
    }

    setOnboardingState(parsedState)
    setDisplayName(profile?.name ?? profile?.nickname ?? "")
    setHydrated(true)
  }, [
    profile?.name,
    profile?.nickname,
    shouldForceGuestSignup,
    shouldForce1LeuSignup,
    shouldForceOAuthOnboarding,
    shouldForcePostAuthStep,
    user,
  ])

  useEffect(() => {
    if (
      !shouldForcePostAuthStep &&
      !shouldForceOAuthOnboarding &&
      !shouldForceGuestSignup &&
      !shouldForce1LeuSignup
    ) {
      return
    }
    router.replace("/register")
  }, [
    router,
    shouldForce1LeuSignup,
    shouldForceGuestSignup,
    shouldForceOAuthOnboarding,
    shouldForcePostAuthStep,
  ])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(REGISTER_ONBOARDING_STORAGE_KEY, JSON.stringify(onboardingState))
  }, [onboardingState, hydrated])

  useEffect(() => {
    if (onboardingState.step !== 1) return
    setWelcomePhase("intro")
    const timer = window.setTimeout(() => setWelcomePhase("final"), 3000)
    return () => window.clearTimeout(timer)
  }, [onboardingState.step])

  useEffect(() => {
    if (!hydrated || !user || profileSyncedUserId !== user.id) return

    if (!needsOnboarding) {
      router.replace(getDashboardPathForUserType(userType))
      return
    }

    if (!canAccessStudentOnboarding(profile)) {
      const blockedToast = getOnboardingBlockedToast(userType, "student")
      toast({
        title: blockedToast.title,
        description: blockedToast.description,
        variant: "destructive",
      })
      router.replace(getDashboardPathForUserType(userType))
      return
    }

    const oauthFromRegister =
      onboardingState.awaitingPostAuth ||
      localStorage.getItem(ONBOARDING_AFTER_OAUTH_KEY) === "1"

    const isOnboardingFinalFlow =
      shouldForcePostAuthStep ||
      onboardingState.awaitingPostAuth ||
      oauthFromRegister ||
      onboardingState.step === "name"
    const isAuthenticatedOnboardingStep =
      onboardingState.step === 2 ||
      onboardingState.step === 3 ||
      onboardingState.step === 4 ||
      onboardingState.step === 5 ||
      onboardingState.step === ACCOUNT_STEP ||
      onboardingState.step === "name"

    if (oauthFromRegister && onboardingState.step !== "name") {
      clearOAuthFlag()
      setOnboardingState((prev) => ({
        ...prev,
        step: "name",
        awaitingPostAuth: false,
      }))
      return
    }

    if (
      onboardingState.campaignSignup === "1leu" &&
      onboardingState.step !== ACCOUNT_STEP &&
      onboardingState.step !== "name"
    ) {
      setOnboardingState((prev) => ({
        ...prev,
        step: "name",
        awaitingPostAuth: false,
      }))
      return
    }

    if (needsOnboarding && !isOnboardingFinalFlow && !isAuthenticatedOnboardingStep) {
      setOnboardingState((prev) => ({ ...prev, step: 2 }))
    }
  }, [
    hydrated,
    needsOnboarding,
    onboardingState.awaitingPostAuth,
    onboardingState.campaignSignup,
    onboardingState.step,
    profile,
    profileSyncedUserId,
    router,
    shouldForcePostAuthStep,
    toast,
    user,
    userType,
  ])

  useEffect(() => {
    if (!hydrated || onboardingState.step !== ACCOUNT_STEP) return
    if (onboardingState.campaignSignup === "1leu") return
    let cancelled = false
    void (async () => {
      try {
        const href = await getPostOnboardingLearningPathItemHref(
          onboardingState.subject,
          onboardingState.grade,
        )
        if (!cancelled) setGuestFirstItemHref(href)
      } catch {
        if (!cancelled) setGuestFirstItemHref(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, onboardingState.campaignSignup, onboardingState.step, onboardingState.subject])

  const is1LeuSignup = onboardingState.campaignSignup === "1leu"
  const showProgressBar =
    !is1LeuSignup && isNumericStep(onboardingState.step) && onboardingState.step <= ACCOUNT_STEP
  const showBackButton =
    !is1LeuSignup &&
    isNumericStep(onboardingState.step) &&
    onboardingState.step >= 2 &&
    (onboardingState.step <= 5 || onboardingState.step === ACCOUNT_STEP)
  const showBottomCta =
    isNumericStep(onboardingState.step) && onboardingState.step >= 1 && onboardingState.step <= 5
  const isOAuthOnboardingFlow =
    Boolean(user && needsOnboarding) &&
    !onboardingState.awaitingPostAuth &&
    onboardingState.step !== ACCOUNT_STEP

  const progressPercent =
    onboardingState.step === ACCOUNT_STEP
      ? 100
      : isNumericStep(onboardingState.step) && onboardingState.step <= 5
        ? ((onboardingState.step - 1) / PROGRESS_STEPS) * 100
        : 0

  const continueLabel = "Continua"

  const isContinueDisabled =
    (onboardingState.step === 2 && !onboardingState.subject) ||
    (onboardingState.step === 3 && !onboardingState.grade) ||
    (onboardingState.step === 4 && onboardingState.selfGrade == null) ||
    (onboardingState.step === 5 && onboardingState.targetGrade == null)

  const setStep = (step: RegisterStep) =>
    setOnboardingState((prev) => ({
      ...prev,
      step,
    }))

  const handleBack = () => {
    if (!isNumericStep(onboardingState.step)) return
    if (onboardingState.step <= 1) return
    if (onboardingState.step === ACCOUNT_STEP) {
      setStep(5)
      return
    }
    setStep((onboardingState.step - 1) as RegisterStep)
  }

  const handleContinue = () => {
    switch (onboardingState.step) {
      case 1:
        setStep(2)
        break
      case 2:
        if (!onboardingState.subject) {
          toast({
            title: "Alege o opțiune",
            description: "Selectează o materie ca să continuăm.",
            variant: "destructive",
          })
          return
        }
        setStep(3)
        tiktokPixel.trackCustomizeProduct({
          contents: [
            {
              content_id: onboardingState.subject,
              content_type: "product",
              content_name: subjectHeadlines[onboardingState.subject],
            },
          ],
          value: 0,
          currency: "RON",
        })
        break
      case 3:
        if (!onboardingState.grade) {
          toast({
            title: "Alege clasa",
            description: "Avem nevoie de clasă pentru a adapta parcursul.",
            variant: "destructive",
          })
          return
        }
        setStep(4)
        break
      case 4:
        if (onboardingState.selfGrade == null) {
          toast({
            title: "Alege nota",
            description: "Spune-ne ce notă crezi că iei acum.",
            variant: "destructive",
          })
          return
        }
        setOnboardingState((prev) => ({
          ...prev,
          step: 5,
          targetGrade:
            prev.targetGrade != null
              ? clampTargetGrade(prev.selfGrade ?? DEFAULT_SELF_GRADE, prev.targetGrade)
              : defaultTargetGrade(prev.selfGrade ?? DEFAULT_SELF_GRADE),
        }))
        break
      case 5:
        if (onboardingState.targetGrade == null || onboardingState.selfGrade == null) {
          toast({
            title: "Alege nota țintă",
            description: "Setează nota la care vrei să ajungi.",
            variant: "destructive",
          })
          return
        }
        if (isOAuthOnboardingFlow) {
          setStep("name")
          break
        }
        setStep(ACCOUNT_STEP)
        break
      default:
        break
    }
  }

  const handleSubjectSelect = (subject: SubjectOption) => {
    playOnboardingSelectSound()
    setOnboardingState((prev) => ({
      ...prev,
      subject,
    }))
  }

  const handleGradeSelect = (grade: GradeOption) => {
    playOnboardingSelectSound()
    setOnboardingState((prev) => ({
      ...prev,
      grade,
    }))
  }

  const handleSelfGradeChange = (selfGrade: number) => {
    setOnboardingState((prev) => ({
      ...prev,
      selfGrade,
      targetGrade:
        prev.targetGrade != null
          ? clampTargetGrade(selfGrade, prev.targetGrade)
          : defaultTargetGrade(selfGrade),
    }))
  }

  const handleTargetGradeChange = (targetGrade: number) => {
    setOnboardingState((prev) => ({
      ...prev,
      targetGrade:
        prev.selfGrade != null
          ? clampTargetGrade(prev.selfGrade, targetGrade)
          : clampTargetGrade(DEFAULT_SELF_GRADE, targetGrade),
    }))
  }

  const markStateForOAuthReturn = () => {
    const nextState: OnboardingState = {
      ...onboardingState,
      awaitingPostAuth: true,
    }
    localStorage.setItem(REGISTER_ONBOARDING_STORAGE_KEY, JSON.stringify(nextState))
    localStorage.setItem(ONBOARDING_AFTER_OAUTH_KEY, "1")
    setOnboardingState(nextState)
  }

  const clearOAuthFlag = () => localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)

  const handleTryWithoutAccount = async () => {
    markGuestDemoStarted()
    setOnboardingState((prev) => ({
      ...prev,
      guestDemo: "started",
    }))
    try {
      const target =
        guestFirstItemHref ??
        (await getPostOnboardingLearningPathItemHref(
          onboardingState.subject,
          onboardingState.grade,
        ))
      if (target) {
        router.push(target)
        return
      }
    } catch {
      // toast below
    }
    toast({
      title: "Nu am putut deschide lecția",
      description: "Încearcă din nou peste câteva secunde.",
      variant: "destructive",
    })
  }

  const handleGoHomeFromGuestSignup = () => {
    clearGuestDemo()
    localStorage.removeItem(REGISTER_ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)
    router.push("/")
  }

  const handleEmailSignup = async (email: string, password: string) => {
    setOauthLoading("email")
    markStateForOAuthReturn()

    const result = await signUpWithEmailPassword(email, password)
    if (!result.ok) {
      clearOAuthFlag()
      setOnboardingState((prev) => ({
        ...prev,
        step: ACCOUNT_STEP,
        awaitingPostAuth: false,
      }))
      toast({
        title: result.alreadyRegistered ? "Ai deja un cont" : "Nu am putut crea contul",
        description: result.message,
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
        step: ACCOUNT_STEP,
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

  const completeStudentOnboarding = async () => {
    if (!user) {
      toast({
        title: "Conectează-te mai întâi",
        description: "Pentru a salva numele, trebuie să fii autentificat.",
        variant: "destructive",
      })
      setStep(ACCOUNT_STEP)
      return
    }

    if (!canAccessStudentOnboarding(profile)) {
      const blockedToast = getOnboardingBlockedToast(userType, "student")
      toast({
        title: blockedToast.title,
        description: blockedToast.description,
        variant: "destructive",
      })
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

    setNameSaving(true)

    const { error } = await finalizeStudentOnboarding(supabase, {
      userId: user.id,
      name: cleanName,
      subject: onboardingState.subject,
      schoolGrade: onboardingState.grade,
      selfGrade: onboardingState.selfGrade,
      targetGrade: onboardingState.targetGrade,
      dailyTime: onboardingState.dailyTime,
    })

    if (error) {
      toast({
        title: "Nu am putut salva numele",
        description: "Mai încearcă o dată, te rog.",
        variant: "destructive",
      })
      setNameSaving(false)
      return
    }

    // From here on we're committed to leaving this page: show the same loading screen as the
    // dashboard instead of the onboarding wizard while we refresh the profile and resolve the
    // redirect target (refreshProfile() below re-triggers the localStorage-hydration effect,
    // which would otherwise briefly reset onboardingState back to step 1).
    setIsFinalizing(true)

    localStorage.removeItem(REGISTER_ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)
    clearGuestDemo()
    try {
      localStorage.setItem(getPostOnboardingDiscountStorageKey(user.id), String(Date.now()))
    } catch {
      // ignore
    }

    await refreshProfile()
    await tiktokPixel.identify({
      email: user.email,
      phone: user.phone,
      externalId: user.id,
    })
    metaPixel.identify({
      email: user.email,
      phone: user.phone,
      externalId: user.id,
    })
    const registrationParams = {
      contents: [
        {
          content_id: "account_elev",
          content_type: "product" as const,
          content_name: "Cont elev Planck",
        },
      ],
      value: 0,
      currency: "RON",
    }
    markCompleted({
      subject: onboardingState.subject,
      grade: onboardingState.grade,
    })
    tiktokPixel.trackCompleteRegistration(registrationParams, user.id)
    metaPixel.trackCompleteRegistration(
      {
        content_ids: ["account_elev"],
        content_type: "product",
        content_name: "Cont elev Planck",
        value: 0,
        currency: "RON",
      },
      user.id,
    )
    consumePostOnboardingRedirect()
    router.push("/dashboard")
  }

  const handleNameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await completeStudentOnboarding()
  }

  const renderStepContent = () => {
    if (!hydrated) {
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
                  text="Materia nu e grea."
                  className="text-[1.75rem] font-bold text-[#111111] sm:text-4xl"
                />
                <AnimatedWords
                  text="Doar n-ai avut unealta potrivită."
                  className="text-base font-semibold text-[#222222] sm:text-lg"
                  startDelay={850}
                />
              </div>
            ) : (
              <AnimatedWords
                text="Hai să vedem unde ești acum și să construim de acolo."
                className="text-[1.75rem] font-bold text-[#111111] sm:text-4xl"
              />
            )}
          </div>
        )

      case 2:
        return (
          <div className="mx-auto w-full max-w-[520px]">
            <StepHeadingWithIcon popFromLeft={!!onboardingState.subject}>
              {onboardingState.subject ? subjectHeadlines[onboardingState.subject] : "Ce te-a adus aici?"}
            </StepHeadingWithIcon>
            <div className="space-y-3">
              {ONBOARDING_SUBJECT_OPTIONS.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${choiceButtonClassName} opacity-0 ${
                    onboardingState.subject === option.id
                      ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                      : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                  }`}
                  style={{ animation: STEP_BUTTON_ANIM, animationDelay: `${220 + idx * 70}ms` }}
                  onClick={() => handleSubjectSelect(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="mx-auto w-full max-w-[520px]">
            <StepHeadingWithIcon
              popFromLeft={!!onboardingState.grade}
              subtitle="Îți adaptăm conținutul la programa ta."
            >
              {onboardingState.grade ? gradeHeadlines[onboardingState.grade] : "În ce clasă ești?"}
            </StepHeadingWithIcon>
            <div className="space-y-3">
              {(["9", "10", "11", "12"] as GradeOption[]).map((grade, idx) => (
                <button
                  key={grade}
                  type="button"
                  className={`${choiceButtonClassName} opacity-0 ${
                    onboardingState.grade === grade
                      ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                      : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                  }`}
                  style={{ animation: STEP_BUTTON_ANIM, animationDelay: `${280 + idx * 70}ms` }}
                  onClick={() => handleGradeSelect(grade)}
                >
                  Clasa a {grade}-a
                </button>
              ))}
            </div>
          </div>
        )

      case 4: {
        const selfGrade = onboardingState.selfGrade ?? DEFAULT_SELF_GRADE
        return (
          <OnboardingGradeSliderStep
            mode="self"
            value={selfGrade}
            onChange={handleSelfGradeChange}
            headline={
              onboardingState.selfGrade != null
                ? `Acum ești pe la ${formatGrade(selfGrade)}.`
                : "Unde te situezi acum?"
            }
            subtitle="Fii sincer — de aici construim planul tău."
            popFromLeft={onboardingState.selfGrade != null}
          />
        )
      }

      case 5: {
        const selfGrade = onboardingState.selfGrade ?? DEFAULT_SELF_GRADE
        const targetGrade = onboardingState.targetGrade ?? defaultTargetGrade(selfGrade)
        return (
          <OnboardingGradeSliderStep
            mode="target"
            value={targetGrade}
            selfGrade={selfGrade}
            onChange={handleTargetGradeChange}
            headline={
              onboardingState.targetGrade != null
                ? `Ținta ta: ${formatGrade(targetGrade)}.`
                : "La ce notă vrei să ajungi?"
            }
            subtitle="Minimum cu 2 puncte peste nota ta actuală."
            popFromLeft={onboardingState.targetGrade != null}
          />
        )
      }

      case 6:
      case 7:
      case 8:
      case 9: {
        const selfGrade = onboardingState.selfGrade ?? DEFAULT_SELF_GRADE
        const targetGrade = onboardingState.targetGrade ?? defaultTargetGrade(selfGrade)

        return (
          <OnboardingAccountStep
            selfGrade={selfGrade}
            targetGrade={targetGrade}
            oauthLoading={oauthLoading}
            onGoogleStart={is1LeuSignup ? undefined : handleGoogleOAuthStart}
            onGoogleResult={is1LeuSignup ? undefined : handleGoogleOAuthResult}
            onEmailSignup={handleEmailSignup}
            onTryWithoutAccount={is1LeuSignup ? undefined : handleTryWithoutAccount}
            onGoHome={handleGoHomeFromGuestSignup}
            variant={
              is1LeuSignup
                ? "email-only"
                : onboardingState.guestDemo === "completed"
                  ? "after-demo"
                  : "default"
            }
            googleIcon={is1LeuSignup ? undefined : <GoogleIcon />}
          />
        )
      }

      case "name":
        return (
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-3xl border border-[#ececf1] bg-white p-7 shadow-[0_30px_70px_-45px_rgba(18,20,28,0.5)]">
              <h1 className="text-3xl font-semibold text-[#0f1115]">Cum te cheamă?</h1>
              <p className="mb-6 mt-2 text-sm text-[#666a73]">
                Așa te vor recunoaște colegii în timp ce înveți.
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
                  ) : is1LeuSignup ? (
                    "Intră pe dashboard"
                  ) : onboardingState.guestDemo === "completed" ? (
                    "Continuă"
                  ) : (
                    getPostOnboardingLearningPathCtaLabel(onboardingState.subject)
                  )}
                </button>
              </form>
            </div>

            {is1LeuSignup ? null : (
            <button
              type="button"
              disabled={nameSaving}
              onClick={() => void completeStudentOnboarding()}
              className="mt-4 w-full text-center text-sm font-medium text-[#666a73] transition-colors hover:text-[#101216] disabled:opacity-40"
            >
              {"Sau mergi direct la dashboard ->"}
            </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (isFinalizing) {
    return <LoadingVideoOverlay zIndex={500} />
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#ffffff] sm:min-h-screen sm:h-auto sm:overflow-visible">
      <style jsx global>{`
        @keyframes registerWordFade {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes registerStepEnter {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes registerStepImageEnter {
          0% {
            opacity: 0;
            transform: translateX(-12px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes registerStepButtonEnter {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes registerStepPopFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-18px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>

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
            showBottomCta
              ? "items-center overflow-y-auto overflow-x-hidden pb-28 pt-3 sm:items-center sm:overflow-visible sm:pb-28 sm:pt-8"
              : "items-center overflow-y-auto overflow-x-hidden py-4 sm:overflow-visible sm:py-8"
          }`}
        >
          <div className="flex w-full flex-col justify-center sm:block">
            {renderStepContent()}
          </div>
        </main>

        {showBottomCta && (
          <footer className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white to-transparent px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+14px)] sm:pb-6 pt-3 sm:pt-3">
            <div className="mx-auto flex max-w-[520px] justify-center">
              <button
                type="button"
                onClick={handleContinue}
                disabled={isContinueDisabled}
                className={`${mainCtaClassName} w-full sm:w-auto`}
              >
                {continueLabel}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
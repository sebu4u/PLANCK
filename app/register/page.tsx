"use client"

import Image from "next/image"
import { Suspense, useEffect, useState } from "react"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { OnboardingSimulationCard } from "@/components/onboarding/OnboardingSimulationCard"
import { getPostOnboardingDiscountStorageKey } from "@/hooks/use-post-onboarding-discount-window"
import {
  getCinematicaFirstLearningPathItemHref,
  getFirstLearningPathItemHref,
} from "@/lib/supabase-learning-paths"

type SubjectOption = "fizica" | "informatica"
type GradeOption = "9" | "10" | "11" | "12"
type DailyTimeOption = "15" | "30" | "60"
type RegisterStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "name"

type OnboardingState = {
  step: RegisterStep
  subject: SubjectOption | null
  grade: GradeOption | null
  dailyTime: DailyTimeOption | null
  awaitingPostAuth: boolean
}

const REGISTER_ONBOARDING_STORAGE_KEY = "planck_register_onboarding"
const ONBOARDING_AFTER_OAUTH_KEY = "planck_onboarding_after_oauth"

const defaultOnboardingState: OnboardingState = {
  step: 1,
  subject: null,
  grade: null,
  dailyTime: null,
  awaitingPostAuth: false,
}

const subjectHeadlines: Record<SubjectOption, string> = {
  fizica: "Perfect, facem fizica mai clară împreună.",
  informatica: "Excelent, construim logică de programator.",
}

const gradeHeadlines: Record<GradeOption, string> = {
  "9": "Clasa a IX-a, punem fundația corectă.",
  "10": "Clasa a X-a, consolidăm ideile-cheie rapid.",
  "11": "Clasa a XI-a, trecem la nivel avansat.",
  "12": "Clasa a XII-a, focus pe examen.",
}

const timeHeadlines: Record<DailyTimeOption, string> = {
  "15": "Puțin și zilnic bate maratonul.",
  "30": "30 de minute schimbă ritmul.",
  "60": "Ritm intens, progres accelerat.",
}

const mainCtaClassName =
  "inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_#050505]"

const choiceButtonClassName =
  "w-full rounded-full border px-5 py-3 text-left text-sm font-semibold transition-colors"

const isNumericStep = (step: RegisterStep): step is 1 | 2 | 3 | 4 | 5 | 6 | 7 => typeof step === "number"

const sanitizeStep = (value: unknown): RegisterStep => {
  if (value === "name") return "name"
  if (typeof value === "number" && value >= 1 && value <= 7) return value as RegisterStep
  return 1
}

const sanitizeSubject = (value: unknown): SubjectOption | null =>
  value === "fizica" || value === "informatica" ? value : null

const sanitizeGrade = (value: unknown): GradeOption | null =>
  value === "9" || value === "10" || value === "11" || value === "12" ? value : null

const sanitizeDailyTime = (value: unknown): DailyTimeOption | null =>
  value === "15" || value === "30" || value === "60" ? value : null

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
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(defaultOnboardingState)
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [nameSaving, setNameSaving] = useState(false)
  const [guestFirstItemHref, setGuestFirstItemHref] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loginWithGoogle, loginWithGitHub } = useAuth()

  const shouldForcePostAuthStep = searchParams.get("onboarding") === "1"

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
          dailyTime: sanitizeDailyTime(decoded.dailyTime),
          awaitingPostAuth: Boolean(decoded.awaitingPostAuth),
        }
      } catch {
        parsedState = { ...defaultOnboardingState }
      }
    }

    if (shouldForcePostAuthStep) {
      parsedState.step = 7
      parsedState.awaitingPostAuth = true
    }

    const wasInAccountCreationFlow =
      parsedState.step === 6 ||
      parsedState.step === 7 ||
      parsedState.step === "name" ||
      parsedState.awaitingPostAuth
    if (!user && wasInAccountCreationFlow) {
      parsedState = { ...defaultOnboardingState }
      if (typeof window !== "undefined") {
        localStorage.removeItem(REGISTER_ONBOARDING_STORAGE_KEY)
        localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)
      }
    }

    setOnboardingState(parsedState)
    setDisplayName(profile?.name ?? profile?.nickname ?? "")
    setHydrated(true)
  }, [profile?.name, profile?.nickname, shouldForcePostAuthStep, user])

  useEffect(() => {
    if (!shouldForcePostAuthStep) return
    router.replace("/register")
  }, [router, shouldForcePostAuthStep])

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
    if (onboardingState.step !== 7) return
    const timer = window.setTimeout(() => {
      setOnboardingState((prev) => ({
        ...prev,
        step: "name",
        awaitingPostAuth: false,
      }))
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [onboardingState.step])

  useEffect(() => {
    if (!hydrated || !user) return

    const isOnboardingFinalFlow =
      shouldForcePostAuthStep ||
      onboardingState.awaitingPostAuth ||
      onboardingState.step === 7 ||
      onboardingState.step === "name"

    if (!isOnboardingFinalFlow) {
      router.replace("/dashboard")
    }
  }, [
    hydrated,
    onboardingState.awaitingPostAuth,
    onboardingState.step,
    router,
    shouldForcePostAuthStep,
    user,
  ])

  useEffect(() => {
    if (!hydrated || user || onboardingState.step !== 7) return
    setOnboardingState((prev) => ({ ...prev, step: 6, awaitingPostAuth: false }))
  }, [hydrated, onboardingState.step, user])

  useEffect(() => {
    if (!hydrated || onboardingState.step !== 6) return
    let cancelled = false
    void (async () => {
      try {
        const href = await getFirstLearningPathItemHref()
        if (!cancelled) setGuestFirstItemHref(href)
      } catch {
        if (!cancelled) setGuestFirstItemHref(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, onboardingState.step])

  const showProgressBar = isNumericStep(onboardingState.step) && onboardingState.step <= 6
  const showBackButton =
    isNumericStep(onboardingState.step) && onboardingState.step >= 2 && onboardingState.step <= 5
  const showBottomCta =
    isNumericStep(onboardingState.step) && onboardingState.step >= 1 && onboardingState.step <= 5

  const progressPercent =
    isNumericStep(onboardingState.step) && onboardingState.step <= 6
      ? (onboardingState.step / 6) * 100
      : 0

  const continueLabel = onboardingState.step === 5 ? "Salveaza-ti progresul" : "Continua"

  const isContinueDisabled =
    (onboardingState.step === 2 && !onboardingState.subject) ||
    (onboardingState.step === 3 && !onboardingState.grade) ||
    (onboardingState.step === 4 && !onboardingState.dailyTime)

  const setStep = (step: RegisterStep) =>
    setOnboardingState((prev) => ({
      ...prev,
      step,
    }))

  const handleBack = () => {
    if (!isNumericStep(onboardingState.step)) return
    if (onboardingState.step <= 1) return
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
            description: "Selectează Fizică sau Informatică ca să continuăm.",
            variant: "destructive",
          })
          return
        }
        setStep(3)
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
        if (!onboardingState.dailyTime) {
          toast({
            title: "Alege timpul zilnic",
            description: "Doar un interval scurt ne ajută să-ți calibrăm ritmul.",
            variant: "destructive",
          })
          return
        }
        setStep(5)
        break
      case 5:
        setStep(6)
        break
      default:
        break
    }
  }

  const handleSubjectSelect = (subject: SubjectOption) => {
    setOnboardingState((prev) => ({
      ...prev,
      subject,
    }))
  }

  const handleGradeSelect = (grade: GradeOption) => {
    setOnboardingState((prev) => ({
      ...prev,
      grade,
    }))
  }

  const handleDailyTimeSelect = (dailyTime: DailyTimeOption) => {
    setOnboardingState((prev) => ({
      ...prev,
      dailyTime,
    }))
  }

  const markStateForOAuthReturn = () => {
    const nextState: OnboardingState = {
      ...onboardingState,
      step: 7,
      awaitingPostAuth: true,
    }
    localStorage.setItem(REGISTER_ONBOARDING_STORAGE_KEY, JSON.stringify(nextState))
    localStorage.setItem(ONBOARDING_AFTER_OAUTH_KEY, "1")
    setOnboardingState(nextState)
  }

  const clearOAuthFlag = () => localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)

  const handleTryWithoutAccount = async () => {
    try {
      const target = guestFirstItemHref ?? (await getFirstLearningPathItemHref())
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

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setOauthLoading(provider)
    markStateForOAuthReturn()

    const { error, popupBlocked } =
      provider === "google" ? await loginWithGoogle() : await loginWithGitHub()

    if (error) {
      clearOAuthFlag()
      setOnboardingState((prev) => ({
        ...prev,
        step: 6,
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

  const handleNameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast({
        title: "Conectează-te mai întâi",
        description: "Pentru a salva numele, trebuie să fii autentificat.",
        variant: "destructive",
      })
      setStep(6)
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

    const payload: { name: string; grade?: string } = { name: cleanName }
    if (onboardingState.grade) payload.grade = onboardingState.grade

    const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id)

    if (error) {
      toast({
        title: "Nu am putut salva numele",
        description: "Mai încearcă o dată, te rog.",
        variant: "destructive",
      })
      setNameSaving(false)
      return
    }

    localStorage.removeItem(REGISTER_ONBOARDING_STORAGE_KEY)
    localStorage.removeItem(ONBOARDING_AFTER_OAUTH_KEY)
    try {
      localStorage.setItem(getPostOnboardingDiscountStorageKey(user.id), String(Date.now()))
    } catch {
      // ignore
    }

    let destination = "/dashboard"
    if (onboardingState.grade === "9") {
      const cinematicaHref = await getCinematicaFirstLearningPathItemHref()
      if (cinematicaHref) destination = cinematicaHref
    }
    router.push(destination)
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
              <button
                type="button"
                className={`${choiceButtonClassName} opacity-0 ${
                  onboardingState.subject === "fizica"
                    ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                    : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                }`}
                style={{ animation: STEP_BUTTON_ANIM, animationDelay: "220ms" }}
                onClick={() => handleSubjectSelect("fizica")}
              >
                Fizică
              </button>
              <button
                type="button"
                className={`${choiceButtonClassName} opacity-0 ${
                  onboardingState.subject === "informatica"
                    ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                    : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                }`}
                style={{ animation: STEP_BUTTON_ANIM, animationDelay: "320ms" }}
                onClick={() => handleSubjectSelect("informatica")}
              >
                Informatică
              </button>
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

      case 4:
        return (
          <div className="mx-auto w-full max-w-[520px]">
            <StepHeadingWithIcon
              popFromLeft={!!onboardingState.dailyTime}
              subtitle="Nu îți cerem mult. Chiar și 15 minute pe zi fac diferența."
            >
              {onboardingState.dailyTime ? timeHeadlines[onboardingState.dailyTime] : "Cât timp ai zilnic?"}
            </StepHeadingWithIcon>
            <div className="space-y-3">
              <button
                type="button"
                className={`${choiceButtonClassName} opacity-0 ${
                  onboardingState.dailyTime === "15"
                    ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                    : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                }`}
                style={{ animation: STEP_BUTTON_ANIM, animationDelay: "280ms" }}
                onClick={() => handleDailyTimeSelect("15")}
              >
                15 min
              </button>
              <button
                type="button"
                className={`${choiceButtonClassName} opacity-0 ${
                  onboardingState.dailyTime === "30"
                    ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                    : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                }`}
                style={{ animation: STEP_BUTTON_ANIM, animationDelay: "360ms" }}
                onClick={() => handleDailyTimeSelect("30")}
              >
                30 min
              </button>
              <button
                type="button"
                className={`${choiceButtonClassName} opacity-0 ${
                  onboardingState.dailyTime === "60"
                    ? "border-[#8043f0] bg-[#f4eeff] text-[#5f2fc3]"
                    : "border-[#ececef] bg-[#f8f8fb] text-[#101216] hover:bg-[#f2f2f6]"
                }`}
                style={{ animation: STEP_BUTTON_ANIM, animationDelay: "440ms" }}
                onClick={() => handleDailyTimeSelect("60")}
              >
                1h+
              </button>
            </div>
          </div>
        )

      case 5: {
        const selectedSubject = onboardingState.subject ?? "fizica"
        const selectedGrade = onboardingState.grade ?? "9"

        return (
          <div className="mx-auto w-full max-w-[600px]">
            <StepHeadingWithIcon
              className="mb-4 sm:mb-8"
              subtitle="Experimentează interactiv o parte din ce te așteaptă."
            >
              Un preview pentru tine
            </StepHeadingWithIcon>

            <div
              className="opacity-0"
              style={{ animation: STEP_BUTTON_ANIM, animationDelay: "280ms" }}
            >
              <OnboardingSimulationCard subject={selectedSubject} grade={selectedGrade} />
            </div>
          </div>
        )
      }

      case 6:
        return (
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-3xl border border-[#ececf1] bg-white px-6 py-8 shadow-[0_30px_70px_-40px_rgba(18,20,28,0.5)]">
              <h1 className="text-center text-[30px] font-semibold leading-tight text-[#0f1115]">
                Creează un cont gratuit
              </h1>
              <p className="mb-6 mt-2 text-center text-sm text-[#666a73]">ca să salvăm parcursul tău de învățare.</p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={oauthLoading !== null}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#d9dbe3] bg-white px-4 font-semibold text-[#111111] transition-colors hover:bg-[#f5f6fa] disabled:opacity-70"
                >
                  {oauthLoading === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                  Continuă cu Google
                </button>

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
            <button
              type="button"
              onClick={handleTryWithoutAccount}
              className="mt-6 w-full bg-transparent py-2 text-center text-sm font-medium text-[#5c5f68] underline-offset-4 transition-colors hover:text-[#1a1c21] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8043f0] focus-visible:ring-offset-2"
            >
              Sau încearcă fără cont
            </button>
          </div>
        )

      case 7:
        return (
          <div className="relative flex h-[65vh] flex-col items-center justify-center">
            <p
              className="title-font text-[5rem] font-black text-[#121212] sm:text-[7rem] md:text-[8.5rem]"
              style={{ animation: "registerScaleUp 4.5s ease-out forwards", transform: "scale(0.72)", fontWeight: 900 }}
            >
              PLANCK
            </p>
            <p className="absolute bottom-2 text-center text-sm font-medium text-[#555a66] sm:text-base">
              Cream un Learning Path special pentru tine
            </p>
          </div>
        )

      case "name":
        return (
          <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-[#ececf1] bg-white p-7 shadow-[0_30px_70px_-45px_rgba(18,20,28,0.5)]">
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
                ) : onboardingState.grade === "9" ? (
                  "Începe Cinematică"
                ) : (
                  "Mergi la dashboard"
                )}
              </button>
            </form>
          </div>
        )

      default:
        return null
    }
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

        @keyframes registerScaleUp {
          0% {
            opacity: 0.5;
            transform: scale(0.72);
          }
          70% {
            opacity: 1;
            transform: scale(1.04);
          }
          100% {
            opacity: 1;
            transform: scale(1);
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
          className={`flex flex-1 justify-center overflow-hidden px-4 sm:items-center sm:px-6 ${
            showBottomCta ? "items-center pb-28 pt-3 sm:items-center sm:pb-28 sm:pt-8" : "items-center py-4 sm:py-8"
          }`}
        >
          {renderStepContent()}
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
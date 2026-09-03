"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  AnimatedWords,
  WelcomeCalendarMock,
  WelcomePathMock,
  WelcomeProblemVideoMock,
} from "@/components/premium/premium-welcome-steps"
import { playButtonClickSound } from "@/lib/platform-sounds"
import { supabase } from "@/lib/supabaseClient"
import { getPremiumWelcomeResumeHref } from "@/lib/supabase-learning-paths"

const EASE = [0.22, 1, 0.36, 1] as const

const HERO_POP_MS = 700
const HERO_HOLD_MS = 500
const TITLE_UP_MS = 600
const STEP_MS = 2000

type WelcomePhase = "hero" | "titleUp" | "step1" | "step2" | "step3" | "done"

const STEPS = [
  {
    id: "step1",
    headline: "Peste 1000 de probleme rezolvate video",
    Graphic: WelcomeProblemVideoMock,
  },
  {
    id: "step2",
    headline: "Trasee complete pentru bac",
    Graphic: WelcomePathMock,
  },
  {
    id: "step3",
    headline: "Pregătiri live în fiecare săptămână",
    Graphic: WelcomeCalendarMock,
  },
] as const

function currentStepId(phase: WelcomePhase): (typeof STEPS)[number]["id"] | null {
  if (phase === "step1") return "step1"
  if (phase === "step2") return "step2"
  if (phase === "step3" || phase === "done") return "step3"
  return null
}

export function PremiumWelcomeExperience() {
  const router = useRouter()
  const { user } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<WelcomePhase>(() =>
    prefersReducedMotion ? "done" : "hero",
  )
  const [resumeHref, setResumeHref] = useState("/invata")
  const [ctaLoading, setCtaLoading] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase("done")
      return
    }

    const timers: number[] = []
    const at = (ms: number, next: WelcomePhase) => {
      timers.push(window.setTimeout(() => setPhase(next), ms))
    }

    let t = HERO_POP_MS + HERO_HOLD_MS
    at(t, "titleUp")
    t += TITLE_UP_MS
    at(t, "step1")
    t += STEP_MS
    at(t, "step2")
    t += STEP_MS
    at(t, "step3")
    t += STEP_MS
    at(t, "done")

    return () => {
      for (const id of timers) window.clearTimeout(id)
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    const loadResume = async () => {
      try {
        const href = await getPremiumWelcomeResumeHref(user.id, supabase)
        if (cancelled) return
        setResumeHref(href)
        router.prefetch(href)
      } catch {
        if (!cancelled) setResumeHref("/invata")
      }
    }

    void loadResume()
    return () => {
      cancelled = true
    }
  }, [router, user?.id])

  const titleUp = phase !== "hero"
  const showSteps = phase === "step1" || phase === "step2" || phase === "step3" || phase === "done"
  const showCta = phase === "done" || Boolean(prefersReducedMotion)
  const activeStepId = currentStepId(phase)
  const instant = Boolean(prefersReducedMotion)

  const handleStartLearning = () => {
    if (ctaLoading) return
    playButtonClickSound()
    setCtaLoading(true)
    const target = user ? resumeHref : "/login"
    router.push(target)
  }

  const handleDashboard = () => {
    playButtonClickSound()
    router.push("/dashboard")
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white text-gray-900">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[46%] bg-[linear-gradient(180deg,#ffd6e8_0%,#fff5f8_42%,#ffffff_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className={`flex min-h-0 flex-1 flex-col ${titleUp ? "" : "justify-center"}`}>
          <motion.div
            layout
            className={`flex flex-col items-center overflow-visible text-center ${titleUp ? "pt-10 sm:pt-12" : ""}`}
            transition={instant ? { duration: 0 } : { duration: TITLE_UP_MS / 1000, ease: EASE }}
          >
            <motion.p
              className="title-font text-[1.65rem] font-black leading-[0.95] tracking-tight text-[#111111] sm:text-3xl md:text-4xl"
              initial={instant ? false : { opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                instant
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 16, delay: 0.05 }
              }
            >
              PLANCK
            </motion.p>
            <motion.p
              className="title-font mt-1 inline-block overflow-visible bg-[linear-gradient(90deg,#8b5cf6_0%,#e879f9_55%,#f2b93d_100%)] bg-clip-text pr-[0.28em] pb-[0.1em] text-[2.5rem] font-black italic leading-none tracking-tight text-transparent sm:text-6xl md:text-7xl"
              initial={instant ? false : { opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                instant
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 16, delay: 0.16 }
              }
            >
              PREMIUM
            </motion.p>
          </motion.div>

          <div className={`mt-6 flex min-h-0 flex-1 flex-col justify-center ${titleUp ? "" : "hidden"}`}>
            {prefersReducedMotion ? (
              <div className="space-y-6 overflow-y-auto">
                {STEPS.map((step) => (
                  <div key={step.id} className="space-y-3">
                    <h2 className="text-center text-lg font-bold leading-snug text-[#111111] sm:text-xl">
                      {step.headline}
                    </h2>
                    <step.Graphic />
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {showSteps && activeStepId
                  ? STEPS.filter((step) => step.id === activeStepId).map((step) => (
                      <motion.div
                        key={step.id}
                        className="space-y-5"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.38, ease: EASE }}
                      >
                        <AnimatedWords
                          text={step.headline}
                          className="text-center text-[1.35rem] font-bold leading-snug text-[#111111] sm:text-2xl"
                        />
                        <step.Graphic />
                      </motion.div>
                    ))
                  : null}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div
          className={
            showCta
              ? "mt-5 shrink-0"
              : "pointer-events-none mt-5 h-0 shrink-0 overflow-hidden opacity-0"
          }
        >
          <motion.div
            className="mx-auto flex w-full max-w-sm flex-col items-center"
            initial={false}
            animate={showCta ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: instant ? 0 : 0.4, ease: EASE }}
          >
            <button
              type="button"
              onClick={handleStartLearning}
              disabled={ctaLoading}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#2d2d2d] px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#1a1a1a] transition-[transform,box-shadow,filter] hover:translate-y-0.5 hover:shadow-[0_2px_0_#1a1a1a] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {ctaLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Se deschide...
                </>
              ) : (
                <>
                  Începe să înveți cu <span className="ml-1 italic">PREMIUM</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDashboard}
              className="mt-3 text-sm font-medium text-black/45 transition hover:text-black/70"
            >
              mergi pe dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

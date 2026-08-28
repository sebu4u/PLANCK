"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Coins, Snowflake, Sparkles, Zap } from "lucide-react"
import { PlanckPassBgPattern } from "@/components/dashboard/free-mobile/planckpass-bg-pattern"
import { PLANCKPASS_INTRO_SEASON_LABEL } from "@/lib/planckpass/intro"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import { playSuccessSound } from "@/lib/platform-sounds"
import {
  playRewardUnlockPopSound,
  playXpBarStringPullSound,
  unlockPlanckPassIntroAudio,
} from "@/lib/planckpass/intro-sounds"
import { cn } from "@/lib/utils"

type Step0Phase = "hero" | "placed" | "content" | "cta"

const STEP0_POP_MS = 680
const STEP0_SLIDE_MS = 500
const STEP0_CTA_DELAY_MS = 2000

const LOCKUP_LAYOUT_ID = "planckpass-intro-lockup"
const LOCKUP_SLIDE_TRANSITION = {
  duration: STEP0_SLIDE_MS / 1000,
  ease: [0.22, 1, 0.36, 1] as const,
}
const POP_SPRING = { type: "spring" as const, stiffness: 520, damping: 18, mass: 0.7 }

const STEPS = [
  {
    kicker: PLANCKPASS_INTRO_SEASON_LABEL,
    title: "PLANCKPASS",
    body: "Un sezon cu 50 de niveluri. Înveți, urci pe traseu și deblochezi recompense reale — nu doar o listă de bifate.",
    cta: "Arată-mi cum merge",
  },
  {
    kicker: "Progres",
    title: "Bara de XP crește când înveți",
    body: "Lecțiile și problemele îți umplu XP-ul. Când bara e plină, treci la nivelul următor.",
    cta: "Și recompensele?",
  },
  {
    kicker: "Recompense",
    title: "Avansezi pe traseu, deblochezi premii",
    body: "Monede Quante, freeze de streak, boost-uri și cosmetic-uri. Pass-ul se mișcă odată cu tine.",
    cta: "Intră în sezon",
  },
] as const

const REWARD_PREVIEWS = [
  { id: "coins", label: "50 Q", Icon: Coins, tone: "text-amber-300" },
  { id: "freeze", label: "Freeze", Icon: Snowflake, tone: "text-sky-300" },
  { id: "boost", label: "Boost", Icon: Zap, tone: "text-yellow-300" },
  { id: "badge", label: "Badge", Icon: Sparkles, tone: "text-fuchsia-300" },
  { id: "coins-2", label: "100 Q", Icon: Coins, tone: "text-amber-300" },
] as const

function IntroLockup({ titleId }: { titleId?: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-300 sm:text-xs">
        {PLANCKPASS_INTRO_SEASON_LABEL}
      </p>
      <h1
        id={titleId}
        className="title-font mt-2 text-[1.85rem] italic leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-[2.15rem]"
      >
        PLANCKPASS
      </h1>
    </div>
  )
}

type PlanckPassSeasonIntroProps = {
  onComplete: () => void
}

export function PlanckPassSeasonIntro({ onComplete }: PlanckPassSeasonIntroProps) {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [step0Phase, setStep0Phase] = useState<Step0Phase>("hero")
  const [xp, setXp] = useState(12)
  const [xpPop, setXpPop] = useState(false)
  const [reachedTier, setReachedTier] = useState(1)
  const [trackShift, setTrackShift] = useState(0)
  const isLast = step === STEPS.length - 1
  const copy = STEPS[step]
  const isStep0 = step === 0
  const showStep0Hero = isStep0 && step0Phase === "hero"
  const showStep0Content = !isStep0 || step0Phase === "content" || step0Phase === "cta"
  const showStep0Cta = !isStep0 || step0Phase === "cta"

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    if (!isStep0) return
    if (reduceMotion) {
      setStep0Phase("cta")
      return
    }

    setStep0Phase("hero")
    const toPlaced = window.setTimeout(() => setStep0Phase("placed"), STEP0_POP_MS)
    const toContent = window.setTimeout(
      () => setStep0Phase("content"),
      STEP0_POP_MS + STEP0_SLIDE_MS,
    )
    const toCta = window.setTimeout(
      () => setStep0Phase("cta"),
      STEP0_POP_MS + STEP0_SLIDE_MS + STEP0_CTA_DELAY_MS,
    )
    return () => {
      window.clearTimeout(toPlaced)
      window.clearTimeout(toContent)
      window.clearTimeout(toCta)
    }
  }, [isStep0, reduceMotion])

  useEffect(() => {
    if (step !== 1) {
      setXp(12)
      setXpPop(false)
      return
    }

    setXp(12)
    setXpPop(false)
    const fillMs = 1150
    const start = window.setTimeout(() => {
      setXp(78)
      setXpPop(true)
      playXpBarStringPullSound(fillMs / 1000)
    }, 350)
    const complete = window.setTimeout(() => {
      playSuccessSound()
      fireLearningPathCorrectConfetti()
    }, 350 + fillMs)
    const hidePop = window.setTimeout(() => setXpPop(false), 1600)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(complete)
      window.clearTimeout(hidePop)
    }
  }, [step])

  useEffect(() => {
    if (step !== 2) {
      setReachedTier(1)
      setTrackShift(0)
      return
    }

    setReachedTier(0)
    setTrackShift(0)
    const timers = REWARD_PREVIEWS.map((_, index) =>
      window.setTimeout(() => {
        setReachedTier(index + 1)
        setTrackShift(index * 18)
        playRewardUnlockPopSound(index)
      }, 280 + index * 420),
    )
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [step])

  const highlightedCards = useMemo(() => {
    return REWARD_PREVIEWS.map((reward, index) => ({
      ...reward,
      reached: index < reachedTier,
      current: index === reachedTier - 1,
    }))
  }, [reachedTier])

  const goNext = () => {
    unlockPlanckPassIntroAudio()
    if (isLast) {
      onComplete()
      return
    }
    setStep((prev) => prev + 1)
  }

  return (
    <div
      className="planckpass-intro-iris-open fixed inset-0 z-[620] flex flex-col overflow-hidden text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planckpass-intro-title"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#6a2cff_0%,#5020F0_45%,#3a12c4_100%)]"
      />
      <PlanckPassBgPattern />

      <LayoutGroup id="planckpass-intro-step0">
        {showStep0Hero ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-5">
            <motion.div
              layoutId={LOCKUP_LAYOUT_ID}
              initial={{ opacity: 0, scale: 0.62 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...POP_SPRING, delay: 0.12 }}
              className="text-center"
            >
              <IntroLockup titleId="planckpass-intro-title" />
            </motion.div>
          </div>
        ) : null}

        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="relative z-30 flex items-center justify-between gap-3">
          <motion.span
            initial={false}
            animate={
              showStep0Hero
                ? { opacity: 0, scale: 0.86 }
                : { opacity: 1, scale: 1 }
            }
            transition={showStep0Hero ? { duration: 0 } : POP_SPRING}
            className="rounded-full border-2 border-[#1a0a4a] bg-[#ffd000] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a]"
          >
            {PLANCKPASS_INTRO_SEASON_LABEL}
          </motion.span>
          <button
            type="button"
            onClick={() => {
              onComplete()
            }}
            className="text-sm font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
          >
            Sari peste
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-6">
          <AnimatePresence mode="wait">
            {isStep0 ? (
              <motion.div
                key="step-0"
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="text-center"
              >
                {showStep0Hero ? (
                  <div className="invisible" aria-hidden>
                    <IntroLockup />
                  </div>
                ) : (
                  <motion.div
                    layoutId={LOCKUP_LAYOUT_ID}
                    className="text-center"
                    transition={LOCKUP_SLIDE_TRANSITION}
                  >
                    <IntroLockup titleId="planckpass-intro-title" />
                  </motion.div>
                )}
                <motion.p
                  initial={false}
                  animate={
                    showStep0Content
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 10, scale: 0.96 }
                  }
                  transition={showStep0Content ? POP_SPRING : { duration: 0 }}
                  aria-hidden={!showStep0Content}
                  className="mx-auto mt-3 max-w-[34rem] text-[15px] font-semibold leading-relaxed text-white/85 sm:text-base"
                >
                  {copy.body}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="text-center"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-300">
                  {copy.kicker}
                </p>
                <h1
                  id="planckpass-intro-title"
                  className="title-font mt-2 text-[1.85rem] italic leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-[2.15rem]"
                >
                  {copy.title}
                </h1>
                <p className="mx-auto mt-3 max-w-[34rem] text-[15px] font-semibold leading-relaxed text-white/85 sm:text-base">
                  {copy.body}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="mt-8"
            initial={false}
            animate={
              showStep0Content
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 22, scale: 0.86 }
            }
            transition={showStep0Content ? POP_SPRING : { duration: 0 }}
            style={{ pointerEvents: showStep0Content ? "auto" : "none" }}
            aria-hidden={!showStep0Content}
          >
            <IntroPassStage
              step={step}
              xp={xp}
              xpPop={xpPop}
              reachedTier={reachedTier}
              trackShift={trackShift}
              cards={highlightedCards}
            />
          </motion.div>
        </div>

        <div className="shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <motion.div
            initial={false}
            animate={{ opacity: showStep0Cta ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex items-center justify-center gap-2"
            aria-hidden={!showStep0Cta}
          >
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === step ? "w-7 bg-[#ffd000]" : "w-2 bg-white/30",
                )}
              />
            ))}
          </motion.div>
          <motion.div
            initial={false}
            animate={
              showStep0Cta
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 10 }
            }
            transition={
              showStep0Cta
                ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 }
            }
            className="w-full"
            style={{ pointerEvents: showStep0Cta ? "auto" : "none" }}
          >
            <button
              type="button"
              onClick={goNext}
              disabled={!showStep0Cta}
              aria-hidden={!showStep0Cta}
              tabIndex={showStep0Cta ? 0 : -1}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#ffd000] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#1a0a4a] shadow-[0_4px_0_#8a5a00] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#8a5a00] active:translate-y-1 active:shadow-[0_1px_0_#8a5a00] disabled:pointer-events-none"
            >
              <span className="inline-flex items-center gap-2">
                {copy.cta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </motion.div>
        </div>
      </div>
      </LayoutGroup>
    </div>
  )
}

function IntroPassStage({
  step,
  xp,
  xpPop,
  reachedTier,
  trackShift,
  cards,
}: {
  step: number
  xp: number
  xpPop: boolean
  reachedTier: number
  trackShift: number
  cards: Array<{
    id: string
    label: string
    Icon: (typeof REWARD_PREVIEWS)[number]["Icon"]
    tone: string
    reached: boolean
    current: boolean
  }>
}) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border-[3px] border-[#1a0a4a] bg-[#3b16c0]/55 p-4 shadow-[0_12px_0_rgba(26,10,74,0.55)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="title-font text-sm italic leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
            PLANCKPASS
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-yellow-300">
            {PLANCKPASS_INTRO_SEASON_LABEL}
          </p>
        </div>
        <motion.div
          key={reachedTier}
          initial={{ scale: 0.82 }}
          animate={{ scale: 1 }}
          className="flex h-10 w-10 items-center justify-center rounded-md border-[3px] border-[#1a0a4a] bg-[#ffd000] text-base font-black text-[#1a0a4a] shadow-[0_2px_0_#1a0a4a]"
        >
          {reachedTier}
        </motion.div>
      </div>

      <div className="relative mb-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">XP</span>
          <span className="text-[10px] font-bold text-white/90">{Math.round(xp)}/100</span>
        </div>
        <div className="h-3.5 overflow-hidden rounded-full border-2 border-[#1a0a4a] bg-[#1a0a4a] shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ffd000] to-[#ffb800] shadow-[0_0_6px_rgba(255,208,0,0.5)]"
            animate={{ width: `${xp}%` }}
            transition={{ duration: step === 1 ? 1.15 : 0.45, ease: "easeOut" }}
          />
        </div>
        <AnimatePresence>
          {xpPop ? (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -18 }}
              className="absolute -right-1 -top-3 rounded-full bg-[#ffd000] px-2 py-0.5 text-[10px] font-black text-[#1a0a4a] shadow-[0_2px_0_#8a5a00]"
            >
              +40 XP
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="px-6 sm:px-8">
        <motion.div
          className="flex w-full items-end justify-center gap-2.5 sm:gap-3"
          animate={{ x: step === 2 ? -trackShift : 0 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        >
          {cards.map((card, index) => (
            <div key={card.id} className="flex shrink-0 flex-col items-center gap-2">
              <div
                className={cn(
                  "h-1.5 w-10 rounded-full",
                  card.reached ? "bg-[#ffd000]" : "bg-[#2a1570]",
                )}
              />
              <motion.div
                animate={
                  card.current && step === 2
                    ? { y: [0, -7, 0], scale: [1, 1.06, 1] }
                    : { y: 0, scale: 1 }
                }
                transition={
                  card.current && step === 2
                    ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.25 }
                }
                className="relative h-[70px] w-[58px] sm:h-[92px] sm:w-[78px]"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[10px] bg-[#1a0a4a]"
                  style={{ transform: "skewX(-12deg) translate(3px, 4px)" }}
                />
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[10px] border-2",
                    card.reached
                      ? "border-[#ffd000] bg-gradient-to-b from-[#ffd000] to-[#ffb800]"
                      : "border-[#2a1570] bg-gradient-to-b from-[#7c4dff] to-[#4a1fd6]",
                    !card.reached && "opacity-55",
                  )}
                  style={{ transform: "skewX(-12deg)" }}
                >
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-1 px-1.5"
                    style={{ transform: "skewX(12deg)" }}
                  >
                    <card.Icon
                      className={cn("h-7 w-7 drop-shadow-sm", card.reached ? "text-[#1a0a4a]" : card.tone)}
                      strokeWidth={2.5}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wide",
                        card.reached ? "text-[#1a0a4a]" : "text-white",
                      )}
                    >
                      {card.label}
                    </span>
                  </div>
                </div>
              </motion.div>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold text-white",
                  card.reached ? "bg-[#ffd000]" : "bg-[#4a2bb8]",
                )}
                style={{ WebkitTextStroke: "1px black", paintOrder: "stroke fill" }}
              >
                {index + 1}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

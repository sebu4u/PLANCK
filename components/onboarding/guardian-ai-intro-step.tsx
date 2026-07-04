"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { AnimatedWords } from "@/components/onboarding/animated-words"

const TEXT_STAGE_1 =
  "Modelul nostru AI construiește trasee de învățare personalizate — de la zero, pas cu pas,"
const TEXT_STAGE_2 = "adaptate nivelului fiecărui elev."

const ICON_SIZE_CLASS = "h-24 w-24 sm:h-32 sm:w-32"
const WORD_STAGGER_MS = 80
const WORD_ANIM_MS = 420
const STAGE_GAP_MS = 450
const TEXT_HOLD_MS = 3000
const POPPY_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)"
const SLIDE_DURATION_MS = 760

type AiIntroPhase = "pop" | "slide" | "stream1" | "stream2" | "outro" | "ready"

type GuardianAiIntroStepProps = {
  onReadyChange?: (ready: boolean) => void
}

function getWordRevealDuration(text: string, startDelay = 0): number {
  const wordCount = text.split(" ").length
  if (wordCount <= 0) return startDelay
  return startDelay + (wordCount - 1) * WORD_STAGGER_MS + WORD_ANIM_MS
}

export function GuardianAiIntroStep({ onReadyChange }: GuardianAiIntroStepProps) {
  const [phase, setPhase] = useState<AiIntroPhase>("pop")
  const [iconAtLeft, setIconAtLeft] = useState(false)
  const [iconReturning, setIconReturning] = useState(false)
  const [iconRaised, setIconRaised] = useState(false)
  const [showStage1, setShowStage1] = useState(false)
  const [showStage2, setShowStage2] = useState(false)

  const stage1Duration = useMemo(() => getWordRevealDuration(TEXT_STAGE_1), [])
  const stage2Duration = useMemo(() => getWordRevealDuration(TEXT_STAGE_2), [])

  useEffect(() => {
    onReadyChange?.(false)
    setPhase("pop")
    setIconAtLeft(false)
    setIconReturning(false)
    setIconRaised(false)
    setShowStage1(false)
    setShowStage2(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on mount
  }, [])

  useEffect(() => {
    if (phase === "pop") {
      const timer = window.setTimeout(() => setPhase("slide"), 520)
      return () => window.clearTimeout(timer)
    }

    if (phase === "slide") {
      const startSlide = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIconAtLeft(true))
      })
      const timer = window.setTimeout(() => {
        setPhase("stream1")
        setShowStage1(true)
      }, SLIDE_DURATION_MS)
      return () => {
        window.cancelAnimationFrame(startSlide)
        window.clearTimeout(timer)
      }
    }

    if (phase === "stream1") {
      const timer = window.setTimeout(() => {
        setShowStage2(true)
        setPhase("stream2")
      }, stage1Duration + STAGE_GAP_MS)
      return () => window.clearTimeout(timer)
    }

    if (phase === "stream2") {
      const timer = window.setTimeout(() => {
        setShowStage1(false)
        setShowStage2(false)
        setIconReturning(true)
        setIconAtLeft(false)
        setPhase("outro")
      }, stage2Duration + TEXT_HOLD_MS)
      return () => window.clearTimeout(timer)
    }

    if (phase === "outro") {
      const timer = window.setTimeout(() => {
        setIconReturning(false)
        setPhase("ready")
        onReadyChange?.(true)
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setIconRaised(true))
        })
      }, SLIDE_DURATION_MS)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [onReadyChange, phase, stage1Duration, stage2Duration])

  const showTextPanel = showStage1 || showStage2
  const showOutroText = phase === "ready"

  const iconTransition =
    iconReturning || iconAtLeft || iconRaised || phase === "ready"
      ? `left ${SLIDE_DURATION_MS}ms ${POPPY_EASING}, transform ${SLIDE_DURATION_MS}ms ${POPPY_EASING}`
      : undefined

  const iconTransform = iconAtLeft
    ? "translateY(-50%)"
    : iconRaised
      ? "translate(-50%, calc(-50% - 1.25rem))"
      : "translate(-50%, -50%)"

  return (
    <div className="mx-auto flex min-h-[360px] w-full max-w-[760px] flex-col items-center justify-center px-2 sm:min-h-[400px]">
      <div className="relative flex w-full min-h-[220px] items-center sm:min-h-[240px]">
        <div
          className="absolute top-1/2 z-10 will-change-[left,transform]"
          style={{
            left: iconAtLeft ? 0 : "50%",
            transform: iconTransform,
            transition: iconTransition,
          }}
        >
          <div
            className={phase === "pop" ? "opacity-0" : "opacity-100"}
            style={
              phase === "pop"
                ? {
                    animation: `guardianStreakPop 480ms ${POPPY_EASING} forwards`,
                  }
                : phase === "slide" || iconReturning
                  ? {
                      animation: `guardianStreakSlideBump ${SLIDE_DURATION_MS}ms ${POPPY_EASING} forwards`,
                    }
                  : undefined
            }
          >
            <Image
              src="/streak-icon.png"
              alt=""
              width={128}
              height={128}
              className={`${ICON_SIZE_CLASS} rounded-xl object-contain`}
            />
          </div>
        </div>

        <div
          className={`ml-0 flex min-h-[120px] flex-1 flex-col justify-center gap-3 pl-[104px] transition-opacity duration-300 sm:pl-[136px] ${
            showTextPanel ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {showStage1 ? (
            <AnimatedWords
              text={TEXT_STAGE_1}
              className="text-left text-base font-medium leading-relaxed text-[#222222] sm:text-lg"
            />
          ) : null}

          {showStage2 ? (
            <AnimatedWords
              text={TEXT_STAGE_2}
              className="text-left text-base font-semibold leading-relaxed text-[#111111] sm:text-lg"
            />
          ) : null}
        </div>
      </div>

      <div
        className={`w-full text-center transition-[opacity,margin] duration-500 ${
          showOutroText
            ? "-mt-10 opacity-100 sm:-mt-12"
            : "pointer-events-none mt-0 opacity-0"
        }`}
        aria-hidden={!showOutroText}
      >
        {showOutroText ? (
          <AnimatedWords
            as="h2"
            text="Haide să începem"
            className="text-[1.75rem] font-bold text-[#111111] sm:text-4xl"
          />
        ) : null}
      </div>
    </div>
  )
}

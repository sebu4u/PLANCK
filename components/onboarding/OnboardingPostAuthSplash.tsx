"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import type { OnboardingSubjectId } from "@/lib/onboarding"
import {
  buildOnboardingRevealLines,
  fetchOnboardingProfileStats,
  type OnboardingProfileStats,
} from "@/lib/onboarding-profile-stats"

const SUBJECT_LABELS: Record<OnboardingSubjectId, string> = {
  matematica: "Matematică",
  fizica: "Fizică",
  informatica: "Informatică",
  biologie: "Biologie",
}

const POP_MS = 320
const RISE_MS = 550
const LOGO_SETTLE_MS = POP_MS + RISE_MS + 120
const LINE_LOAD_MS = 880
const LINE_GAP_MS = 160
const LOADING_EXIT_MS = 420
const TITLE_REVEAL_MS = 480
const STAT_REVEAL_MS = 520
const CONTINUE_DELAY_MS = 520

type LineStatus = "hidden" | "loading" | "done"
type SplashPhase = "loading" | "loading-exit" | "reveal" | "ready"

function getLoadingLines(subject: OnboardingSubjectId | null) {
  const materie = subject ? SUBJECT_LABELS[subject] : "materia aleasă"
  return [
    "Pregătim platforma PLANCK...",
    "Îți configurăm profilul...",
    `Construim traseele de învățare la ${materie}...`,
    "Personalizăm primul tău parcurs...",
    "Aproape gata...",
  ]
}

function playPopSound() {
  if (typeof window === "undefined") return

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(640, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07)

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.12)

    window.setTimeout(() => {
      void ctx.close()
    }, 180)
  } catch {
    // ignore if audio is blocked
  }
}

export function OnboardingPostAuthSplash({
  subject,
  grade,
  onContinue,
}: {
  subject: OnboardingSubjectId | null
  grade: string | null
  onContinue: () => void
}) {
  const lines = useMemo(() => getLoadingLines(subject), [subject])
  const [lineStatuses, setLineStatuses] = useState<LineStatus[]>(() => lines.map(() => "hidden"))
  const [phase, setPhase] = useState<SplashPhase>("loading")
  const [stats, setStats] = useState<OnboardingProfileStats | null>(null)
  const [showTitle, setShowTitle] = useState(false)
  const [visibleRevealCount, setVisibleRevealCount] = useState(0)
  const [showContinue, setShowContinue] = useState(false)
  const revealStartedRef = useRef(false)

  const revealLines = useMemo(
    () => (stats ? buildOnboardingRevealLines(stats) : []),
    [stats],
  )

  const showLogo = phase === "loading" || phase === "loading-exit"
  const showLoadingList = phase === "loading" || phase === "loading-exit"
  const showReveal = phase === "reveal" || phase === "ready"

  useEffect(() => {
    playPopSound()
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchOnboardingProfileStats(subject, grade).then((result) => {
      if (!cancelled) setStats(result)
    })
    return () => {
      cancelled = true
    }
  }, [grade, subject])

  useEffect(() => {
    setLineStatuses(lines.map(() => "hidden"))
    setPhase("loading")
    setShowTitle(false)
    setVisibleRevealCount(0)
    setShowContinue(false)
    revealStartedRef.current = false

    const timers: number[] = []
    let cursor = LOGO_SETTLE_MS

    lines.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setLineStatuses((prev) => {
            const next = [...prev]
            next[index] = "loading"
            return next
          })
        }, cursor),
      )

      cursor += LINE_LOAD_MS

      timers.push(
        window.setTimeout(() => {
          setLineStatuses((prev) => {
            const next = [...prev]
            next[index] = "done"
            return next
          })
        }, cursor),
      )

      cursor += LINE_GAP_MS
    })

    timers.push(
      window.setTimeout(() => {
        setPhase("loading-exit")
      }, cursor + 80),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [lines])

  useEffect(() => {
    if (phase !== "loading-exit" || revealStartedRef.current) return

    const goReveal = () => {
      if (revealStartedRef.current) return
      revealStartedRef.current = true
      setPhase("reveal")
    }

    const timer = window.setTimeout(() => {
      if (stats) goReveal()
    }, LOADING_EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [phase, stats])

  useEffect(() => {
    if (phase !== "loading-exit" || !stats || revealStartedRef.current) return
    revealStartedRef.current = true
    setPhase("reveal")
  }, [phase, stats])

  useEffect(() => {
    if (phase !== "reveal" || !stats) return

    const timers: number[] = []

    timers.push(
      window.setTimeout(() => {
        setShowTitle(true)
      }, 0),
    )

    revealLines.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleRevealCount(index + 1)
        }, TITLE_REVEAL_MS + index * STAT_REVEAL_MS),
      )
    })

    timers.push(
      window.setTimeout(() => {
        setPhase("ready")
        setShowContinue(true)
      }, TITLE_REVEAL_MS + revealLines.length * STAT_REVEAL_MS + CONTINUE_DELAY_MS),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [phase, revealLines, stats])

  return (
    <>
      {showReveal ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-[#e6f4eb] via-[#f4fbf6] to-white transition-opacity duration-500"
        />
      ) : null}

      <div className="relative z-10 flex min-h-[65vh] w-full max-w-[420px] flex-col px-4">
        <div className="flex flex-1 flex-col items-center">
          {showLogo ? (
            <p
              className={`title-font mt-[16vh] text-[4rem] font-black text-[#121212] sm:mt-[18vh] sm:text-[5.5rem] md:text-[6.5rem] ${
                phase === "loading-exit" ? "opacity-0 transition-opacity duration-300" : "opacity-0"
              }`}
              style={
                phase === "loading"
                  ? {
                      animation: `registerLogoIntro ${POP_MS + RISE_MS}ms ease-out forwards`,
                      fontWeight: 900,
                    }
                  : { fontWeight: 900 }
              }
            >
              PLANCK
            </p>
          ) : null}

          {showLoadingList ? (
            <ul
              className={`mt-8 w-full max-w-[340px] space-y-3 transition-all duration-300 sm:mt-10 ${
                phase === "loading-exit" ? "pointer-events-none opacity-0 -translate-y-2" : "opacity-100"
              }`}
            >
              {lines.map((line, index) => {
                const status = lineStatuses[index]
                if (status === "hidden") return null

                const isDone = status === "done"

                return (
                  <li
                    key={line}
                    className={`flex items-center gap-2.5 text-[13px] font-medium transition-colors duration-300 sm:text-sm ${
                      isDone ? "text-[#1a7f4b]" : "text-[#555a66]"
                    }`}
                    style={{
                      animation: "registerLoadingLine 360ms ease-out forwards",
                    }}
                  >
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      {isDone ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      )}
                    </span>
                    <span>{line}</span>
                  </li>
                )
              })}
            </ul>
          ) : null}

          {showReveal ? (
            <div className="flex w-full flex-1 flex-col items-center justify-center px-2 text-center">
              {showTitle ? (
                <h2
                  className="max-w-[340px] text-[1.65rem] font-semibold leading-tight text-[#121212] opacity-0 sm:text-[2rem]"
                  style={{
                    animation: "registerStatPop 560ms cubic-bezier(0.34, 1.25, 0.64, 1) forwards",
                  }}
                >
                  Ți-am creat un traseu special pentru tine
                </h2>
              ) : null}

              <div className="mt-7 w-full max-w-[320px] space-y-3 sm:mt-8">
                {revealLines.slice(0, visibleRevealCount).map((line) => (
                  <p
                    key={line}
                    className="text-[14px] font-medium text-[#2f4f3d] opacity-0 sm:text-[15px]"
                    style={{
                      animation: "registerStatPop 520ms cubic-bezier(0.34, 1.25, 0.64, 1) forwards",
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={`pb-2 pt-4 transition-all duration-[400ms] sm:pb-4 ${
            showContinue ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={onContinue}
            className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition-[transform,box-shadow] ${
              showReveal
                ? "bg-[#1a7f4b] shadow-[0_4px_0_#0f5c36] hover:translate-y-1 hover:shadow-[0_1px_0_#0f5c36]"
                : "bg-[#2a2a2a] shadow-[0_4px_0_#050505] hover:translate-y-1 hover:shadow-[0_1px_0_#050505]"
            }`}
          >
            Continuă
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes registerLogoIntro {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(0);
          }
          22% {
            opacity: 1;
            transform: scale(1.02) translateY(0);
          }
          32% {
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(-10vh);
          }
        }

        @keyframes registerLoadingLine {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes registerStatPop {
          0% {
            opacity: 0;
            transform: scale(0.94) translateY(14px);
          }
          70% {
            opacity: 1;
            transform: scale(1.02) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  )
}

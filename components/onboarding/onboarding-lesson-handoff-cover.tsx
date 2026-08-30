"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import {
  endOnboardingLessonHandoff,
  subscribeOnboardingLessonHandoff,
} from "@/lib/onboarding-lesson-handoff"

const HANDOFF_TIMEOUT_MS = 20_000

export function OnboardingLessonHandoffCover() {
  const [active, setActive] = useState(false)

  useEffect(() => subscribeOnboardingLessonHandoff(setActive), [])

  useEffect(() => {
    if (!active) return
    const timeoutId = window.setTimeout(() => {
      endOnboardingLessonHandoff()
    }, HANDOFF_TIMEOUT_MS)
    return () => window.clearTimeout(timeoutId)
  }, [active])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[800] flex items-center justify-center bg-[#ffffff] px-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="Se deschide lecția demo"
    >
      <div className="mx-auto mt-16 w-full max-w-[420px] sm:mt-24">
        <div className="relative">
          <Image
            src="/images/exerseaza/pregatiri-icon.png"
            alt=""
            width={360}
            height={360}
            className="pointer-events-none absolute -top-[12rem] -right-4 z-0 h-72 w-72 select-none object-contain sm:-top-[14.5rem] sm:-right-8 sm:h-96 sm:w-96"
          />
          <div className="relative z-10 rounded-3xl border border-[#ececf1] bg-white p-7 shadow-[0_30px_70px_-45px_rgba(18,20,28,0.5)]">
            <h1 className="text-3xl font-semibold text-[#0f1115]">Vrei să începi să înveți?</h1>
            <p className="mb-6 mt-2 text-sm text-[#666a73]">
              Poți face primul traseu demo în aproximativ 2 minute, sau poți merge direct pe dashboard.
            </p>
            <button
              type="button"
              disabled
              className="inline-flex min-w-[200px] w-full items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Începe lecția demo (~2 min)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

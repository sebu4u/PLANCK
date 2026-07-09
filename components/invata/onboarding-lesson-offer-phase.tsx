"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { usePostOnboardingDiscountWindow } from "@/hooks/use-post-onboarding-discount-window"
import { playButtonClickSound } from "@/lib/platform-sounds"

interface OnboardingLessonOfferPhaseProps {
  onDecline: () => void | Promise<void>
}

/**
 * Final phase after the onboarding custom lesson: the one-time -50% offer, reusing the
 * discount window already started in localStorage at the end of `/register` (see
 * `getPostOnboardingDiscountStorageKey`) and the dashboard "Start" CTA styling.
 */
export function OnboardingLessonOfferPhase({ onDecline }: OnboardingLessonOfferPhaseProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { active, remainingLabel } = usePostOnboardingDiscountWindow(user?.id)

  const handleAccept = () => {
    // Sound already played by the global `.dashboard-start-glow` click listener.
    router.push("/pricing")
  }

  const handleDecline = () => {
    playButtonClickSound()
    void onDecline()
  }

  return (
    <div className="fixed inset-0 z-[502] flex flex-col bg-[linear-gradient(180deg,#fff9e8_0%,#ffffff_28%,#ffffff_100%)]">
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-500 to-[#e11d48] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(239,68,68,0.45)]">
            Ofertă unică −50%
          </span>

          <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[#111111] sm:text-3xl">
            Dispare curând: jumătate din preț la orice plan.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#5f657b] sm:text-base">
            Ai deblocat o ofertă valabilă doar acum, cât timp continui pe PLANCK.
          </p>

          {active ? (
            <p className="mt-5 text-sm font-semibold leading-snug text-[#b91c1c]">
              Expiră în{" "}
              <span className="font-mono text-lg font-black tabular-nums tracking-tight">
                {remainingLabel}
              </span>
            </p>
          ) : null}
        </motion.div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[503] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col items-center">
          <button
            type="button"
            onClick={handleAccept}
            className="dashboard-start-glow inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8f91f1] via-[#cd83db] to-[#f2b93d] px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#9a5aa8] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#9a5aa8] active:translate-y-0.5 active:shadow-[0_2px_0_#9a5aa8]"
            style={{ "--start-glow-tint": "rgba(248, 220, 228, 0.88)" } as CSSProperties}
          >
            <span className="relative z-[1]">Accepta oferta</span>
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="mt-3 text-sm font-medium text-black/50 transition hover:text-black/70"
          >
            nu mulțumesc
          </button>
        </div>
      </div>
    </div>
  )
}

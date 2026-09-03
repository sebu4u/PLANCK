"use client"

import { FadeInUp, ScaleIn } from "@/components/scroll-animations"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import {
  PLANCK_WEEK_FINAL_HEADLINE,
  PLANCK_WEEK_FINAL_MICROCOPY,
  PLANCK_WEEK_FINAL_SCARCITY,
} from "@/lib/planck-week"

export function PlanckWeekFinalCtaSection({ onReserve }: { onReserve: () => void }) {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EBE8FF] opacity-50 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <ScaleIn>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {PLANCK_WEEK_FINAL_HEADLINE}
          </h2>
        </ScaleIn>

        <FadeInUp delay={0.12} className="mt-4">
          <p className="text-base text-gray-500 sm:text-lg">{PLANCK_WEEK_FINAL_SCARCITY}</p>
        </FadeInUp>

        <FadeInUp delay={0.22} className="mt-10">
          <PlanckWeekCtaButton onClick={onReserve} />
        </FadeInUp>

        <FadeInUp delay={0.28}>
          <p className="mt-3 text-sm text-gray-500">{PLANCK_WEEK_FINAL_MICROCOPY}</p>
        </FadeInUp>
      </div>
    </section>
  )
}

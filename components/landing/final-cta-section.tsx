"use client"

import Link from "next/link"
import { FunnelCtaLink } from "@/components/funnel-cta-link"
import { ArrowRight } from "lucide-react"
import { FadeInUp, ScaleIn } from "@/components/scroll-animations"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_YEARLY_RON,
  type CountdownState,
  useCountdown,
} from "@/lib/landing-campaign"

export function LandingFinalCtaSection({ countdown }: { countdown?: CountdownState }) {
  const local = useCountdown()
  const { days, hours, minutes, seconds } = countdown ?? local

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EBE8FF] opacity-50 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <ScaleIn>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Gata să înveți mai simplu pentru BAC?
          </h2>
        </ScaleIn>

        <FadeInUp delay={0.12} className="mt-4">
          <p className="text-base text-gray-500 sm:text-lg">
            Un profesor AI + om real, toată materia, și earlybird{" "}
            <strong className="text-gray-700">{EARLYBIRD_YEARLY_RON} RON/an</strong> până pe{" "}
            {EARLYBIRD_DEADLINE_LABEL}.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.18} className="mt-8 flex justify-center">
          <div className="flex max-w-full flex-wrap items-end justify-center gap-2.5 sm:gap-4">
            <CountdownUnit value={days} label="zile" />
            <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
            <CountdownUnit value={hours} label="ore" />
            <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
            <CountdownUnit value={minutes} label="min" />
            <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
            <CountdownUnit value={seconds} label="sec" />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.26} className="mt-10">
          <FunnelCtaLink
            href="/register"
            ctaId="landing_final_start"
            placement="landing_final"
            className="inline-flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#7C5CFC] px-10 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 sm:w-auto"
          >
            Începe gratuit acum
            <ArrowRight className="ml-2 h-4 w-4" />
          </FunnelCtaLink>
        </FadeInUp>
      </div>
    </section>
  )
}

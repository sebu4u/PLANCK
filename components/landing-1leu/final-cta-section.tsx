"use client"

import { FadeInUp, ScaleIn } from "@/components/scroll-animations"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import { Landing1LeuCtaLink } from "@/components/landing-1leu/cta-link"
import { PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT, useLanding1LeuCampaign } from "@/lib/landing-1leu"

export function Landing1LeuFinalCtaSection() {
  const { days, hours, minutes, seconds, isLive } = useLanding1LeuCampaign()

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EBE8FF] opacity-50 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <ScaleIn>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            {isLive
              ? "Roata e deschisă. Învârte acum."
              : "Creează cont acum. La 12:00 doar învârți."}
          </h2>
        </ScaleIn>

        <FadeInUp delay={0.12} className="mt-4">
          <p className="text-base text-gray-500 sm:text-lg">
            {PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT} de abonamente anuale la 1 leu. Restul premiilor sunt
            tot garantate. Cont de elev, fără card până câștigi.
          </p>
        </FadeInUp>

        {!isLive ? (
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
        ) : null}

        <FadeInUp delay={0.26} className="mt-10">
          <Landing1LeuCtaLink
            showArrow
            ctaId="1leu_final_start"
            placement="1leu_final"
            className="inline-flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#7C5CFC] px-10 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 sm:w-auto"
          />
        </FadeInUp>
      </div>
    </section>
  )
}

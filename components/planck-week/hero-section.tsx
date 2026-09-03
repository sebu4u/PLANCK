"use client"

import { FadeInUp } from "@/components/scroll-animations"
import { HomePageNavbar } from "@/components/homepage-navbar"
import { Landing1LeuHeroConfetti } from "@/components/landing-1leu/hero-confetti"
import { PlanckWeekCtaButton } from "@/components/planck-week/cta-button"
import { PLANCK_WEEK_DATES, PLANCK_WEEK_MICROCOPY } from "@/lib/planck-week"

export function PlanckWeekHeroSection({ onReserve }: { onReserve: () => void }) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(to_bottom,#c8e6ff_0%,#e8f4ff_16%,#ffffff_38%)]">
      <Landing1LeuHeroConfetti />
      <HomePageNavbar variant="light" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10 pt-[9.25rem] text-center sm:px-6 sm:pb-14 sm:pt-[10.5rem] lg:px-8 lg:pb-16 lg:pt-[11.5rem]">
        <FadeInUp>
          <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3.5 py-1.5 text-xs font-black tracking-wider text-white shadow-[0_4px_16px_rgba(124,92,252,0.28)]">
            {PLANCK_WEEK_DATES}
          </span>
        </FadeInUp>

        <FadeInUp delay={0.08}>
          <h1 className="mt-5 text-3xl font-black leading-[1.12] tracking-tight text-gray-900 sm:text-5xl sm:leading-[1.08] lg:text-[3.35rem] lg:leading-[1.06]">
            5 zile de meditații live{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
              gratuite
            </span>
          </h1>
          <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
        </FadeInUp>

        <FadeInUp delay={0.14}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg sm:leading-8">
            10–14 septembrie, la Fizică, Mate, Info, Biologie sau Chimie — predate de olimpici. Fără
            card. Complet gratuit.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.2} className="mt-8">
          <PlanckWeekCtaButton onClick={onReserve} />
        </FadeInUp>

        <FadeInUp delay={0.24}>
          <p className="mt-2.5 text-sm leading-relaxed text-gray-500 sm:text-[15px]">
            {PLANCK_WEEK_MICROCOPY}
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}

"use client"

import { ArrowRight, Award, ShieldCheck, Star } from "lucide-react"
import { FunnelCtaLink } from "@/components/funnel-cta-link"
import { FadeInUp } from "@/components/scroll-animations"
import {
  LandingHeroReviewRowsDesktop,
  LandingHeroReviewRowsMobile,
} from "@/components/landing/hero-review-rows"
import { HOME_HERO_HEADLINE_GRADIENT } from "@/lib/platform-marketing"

export function LandingHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#ffffff]">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-32 sm:px-6 sm:pb-12 sm:pt-36 lg:px-8 lg:pb-20 lg:pt-40">
        <div className="flex max-w-xl flex-col text-center lg:max-w-lg lg:text-left xl:max-w-xl">
          <FadeInUp>
            <span className="mx-auto inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(124,92,252,0.28)] lg:mx-0">
              Un AN de PLANCK
            </span>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl">
              Materia pe care nu ai{" "}
              <br className="hidden sm:block" />
              înțeles-o niciodată,{" "}
              <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
                {HOME_HERO_HEADLINE_GRADIENT}
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.14}>
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg sm:leading-8">
              Simulări și pregătiri pentru BAC, în fiecare zi! Peste{" "}
              <strong className="font-semibold text-gray-700">10.000 de grile și exerciții</strong>{" "}
              rezolvate video complet.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.2} className="mt-8">
            <FunnelCtaLink
              href="/register"
              ctaId="landing_hero_start"
              placement="landing_hero"
              className="inline-flex h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98]"
            >
              Începe gratuit!
              <ArrowRight className="ml-2 h-4 w-4" />
            </FunnelCtaLink>
          </FadeInUp>

          <FadeInUp delay={0.24}>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-500 sm:text-[15px]">
              Pentru toți elevii de clasa a 9-a până la clasa a 12-a.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.28} className="mt-4">
            <div className="rounded-xl border border-[#EBE8FF] bg-[#F8F7FF] px-4 py-2.5 text-left sm:px-5">
              <p className="text-sm font-semibold leading-snug text-gray-700">
                5 materii de bac. Toate pregătirile înregistrate video.
              </p>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.34} className="mt-6 sm:mt-8">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 lg:justify-start">
              <Award className="hidden h-7 w-7 shrink-0 text-[#F59E3A] sm:block" aria-hidden />

              <div
                className="flex w-full max-w-[280px] overflow-hidden rounded-xl border border-amber-100 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.06)] sm:max-w-[320px]"
                role="group"
                aria-label="Rating mediu 4,8 din 5 și peste 100 de recenzii verificate"
              >
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-r border-gray-100 px-2.5 py-2.5 sm:px-3 sm:py-3">
                  <div className="flex items-center gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-[#F59E3A] text-[#F59E3A] sm:h-3.5 sm:w-3.5"
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-lg font-bold text-[#4F6EF7] sm:text-xl">4,8/5</p>
                  <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">rating mediu</p>
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2.5 py-2.5 sm:px-3 sm:py-3">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#4F6EF7]" aria-hidden />
                    <p className="text-lg font-bold text-[#4F6EF7] sm:text-xl">100+</p>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">recenzii verificate</p>
                </div>
              </div>

              <Award
                className="hidden h-7 w-7 shrink-0 scale-x-[-1] text-[#F59E3A] sm:block"
                aria-hidden
              />
            </div>
          </FadeInUp>
        </div>

        <LandingHeroReviewRowsMobile />
      </div>

      <LandingHeroReviewRowsDesktop />
    </section>
  )
}

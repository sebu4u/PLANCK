"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, Route, Target } from "lucide-react"
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/scroll-animations"

const STEPS = [
  {
    step: "1",
    Icon: BookOpen,
    title: "Alegi materia și nivelul",
    text: "Fizică, mate, info sau biologie — de la clasă la BAC sau olimpiadă.",
  },
  {
    step: "2",
    Icon: Route,
    title: "Insight îți construiește traseul",
    text: "Personalizat după greșeli: ce repeți, ce sari, ce exersezi următorul.",
  },
  {
    step: "3",
    Icon: Target,
    title: "Exersezi și prinzi conceptul",
    text: "Probleme, grile și explicații — înțelegi de ce, nu doar răspunsul.",
  },
] as const

export function LandingSolutionSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative mx-auto grid max-w-7xl lg:grid-cols-[minmax(0,1fr)_minmax(280px,38%)]">
        {/* Left: compact title + steps + CTA — defines desktop section height */}
        <div className="flex min-w-0 flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:max-w-xl lg:px-8 lg:py-20 xl:pr-6">
          <FadeInUp>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-[1.85rem] lg:leading-snug xl:text-[2.05rem] xl:leading-snug">
              Un singur loc. Toată materia. Un profesor AI care nu obosește niciodată.
            </h2>
          </FadeInUp>

          <StaggerContainer className="mt-7 space-y-2.5" staggerDelay={0.08}>
            {STEPS.map(({ step, Icon, title, text }) => (
              <StaggerItem key={step}>
                <div className="relative flex gap-3 rounded-[16px] bg-[#F8F7FF] p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] ring-1 ring-[#EBE8FF] sm:gap-3.5 sm:p-3.5">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] text-xs font-black text-white shadow-[0_2px_0_#5B47D6] sm:h-8 sm:w-8 sm:text-sm">
                    {step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white sm:inline-flex">
                        <Icon className="h-3.5 w-3.5 text-[#7C5CFC]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold leading-snug text-gray-900">
                          {title}
                        </h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 sm:text-[13px] sm:leading-relaxed">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInUp delay={0.2} className="mt-6">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#7C5CFC] px-7 text-sm font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
            >
              Creează-ți contul gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeInUp>
        </div>

        {/*
          Right: hero phone sized to column width (no left crop).
          Clip only vertically — height 142.86% → top ~70% visible,
          bottom cut by section/column overflow.
        */}
        <div className="relative px-4 pt-2 sm:px-6 lg:px-4 lg:pt-0 xl:px-6">
          <div className="relative mx-auto aspect-[1080/1344] w-full max-w-[280px] overflow-hidden sm:max-w-[320px] lg:absolute lg:inset-y-0 lg:left-0 lg:right-0 lg:mx-0 lg:aspect-auto lg:max-w-none lg:overflow-x-visible lg:overflow-y-hidden">
            <Image
              src="/hero-phone.png"
              alt="Aplicația PLANCK pe telefon"
              width={1080}
              height={1920}
              className="pointer-events-none absolute left-1/2 top-0 h-[142.86%] w-auto max-w-none -translate-x-1/2 object-contain object-top lg:left-1/2 lg:h-auto lg:w-full lg:max-w-full lg:-translate-x-1/2"
              sizes="(max-width: 1024px) 320px, 38vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

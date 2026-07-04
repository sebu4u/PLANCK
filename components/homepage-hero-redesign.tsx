"use client"

import Image from "next/image"
import Link from "next/link"
import { type CSSProperties } from "react"
import { ArrowRight, Award, ShieldCheck, Star } from "lucide-react"
import { LiveStats } from "@/components/live-stats"
import { HomePageNavbar } from "@/components/homepage-navbar"
import {
  HOME_HERO_HEADLINE_GRADIENT,
  HOME_HERO_SUBTITLE,
  HOME_HERO_SUBTITLE_MOBILE,
} from "@/lib/platform-marketing"
import { GUARDIAN_ONBOARDING_PATH } from "@/lib/onboarding"

export function HomePageHeroRedesign({ isMobile: _isMobile = false }: { isMobile?: boolean }) {
    return (
        <section
            id="hero-section"
            className="flex w-full flex-col bg-white min-h-[100dvh]"
        >
            <div className="relative h-24 shrink-0">
                <HomePageNavbar variant="light" />
            </div>

            <div className="relative z-10 flex flex-col px-6 pb-12 pt-12 sm:pt-14 lg:px-8 lg:pb-16 lg:pt-20">
                <div className="flex flex-col translate-y-[3px]">
                    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-start lg:gap-x-16">
                        <div className="max-lg:contents lg:flex lg:flex-col lg:gap-6">
                            <div className="order-1 mx-auto flex w-full max-w-2xl flex-col text-left lg:mx-0 lg:max-w-2xl">
                                <LiveStats variant="light" centerOnMobile />

                                <h1 className="scroll-animate-fade-up mb-4 text-center text-3xl font-black leading-[1.08] tracking-tight text-gray-900 sm:mb-6 sm:text-4xl lg:text-left lg:text-5xl xl:text-6xl">
                                    Materia pe care nu ai{" "}
                                    <br className="hidden sm:block" />
                                    înțeles-o niciodată,{" "}
                                    <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
                                        {HOME_HERO_HEADLINE_GRADIENT}
                                    </span>
                                </h1>
                                <p className="scroll-animate-fade-up animate-delay-200 mb-6 text-center text-base leading-relaxed text-gray-600 sm:mb-8 sm:text-lg lg:mb-0 lg:hidden">
                                    {HOME_HERO_SUBTITLE_MOBILE}
                                </p>
                                <p className="scroll-animate-fade-up animate-delay-200 mb-6 hidden text-base leading-relaxed text-gray-600 sm:mb-8 sm:text-lg lg:mb-0 lg:block">
                                    {HOME_HERO_SUBTITLE}
                                </p>
                            </div>

                            <div className="scroll-animate-fade-up animate-delay-400 order-2 mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 lg:mx-0 lg:max-w-2xl lg:flex-row lg:flex-wrap lg:items-center lg:justify-start lg:gap-4">
                                <Link
                                    href="/register"
                                    className="dashboard-start-glow box-border inline-flex h-11 w-full max-w-[260px] shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] px-7 text-sm font-semibold text-white shadow-[0_3px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98] lg:h-14 lg:max-w-none lg:w-auto lg:px-9 lg:text-base lg:shadow-[0_4px_0_#5B47D6]"
                                    style={{ "--start-glow-tint": "rgba(224, 215, 255, 0.88)" } as CSSProperties}
                                >
                                    <span className="relative z-10 inline-flex items-center gap-1.5 text-white lg:gap-2">
                                        Încearcă gratuit
                                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white lg:h-4 lg:w-4" aria-hidden />
                                    </span>
                                </Link>

                                <Link
                                    href={GUARDIAN_ONBOARDING_PATH}
                                    className="box-border inline-flex h-12 w-full max-w-[260px] shrink-0 items-center justify-center rounded-full border border-gray-300 border-b-4 border-b-[#b8bcc4] bg-white px-7 text-sm font-semibold leading-snug text-gray-900 transition-[background-color,border-color] hover:bg-gray-50 hover:border-gray-400 hover:border-b-[#a8adb6] lg:h-[62px] lg:max-w-none lg:w-auto lg:border-b-[5px] lg:px-9 lg:text-base"
                                >
                                    Pentru părinți și profesori
                                </Link>
                            </div>

                            <div className="order-3 w-full max-w-2xl pt-6 sm:pt-8 lg:order-3 lg:mx-0 lg:pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gray-200" aria-hidden />
                                    <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                        Au încredere în noi
                                    </p>
                                    <div className="h-px flex-1 bg-gray-200" aria-hidden />
                                </div>

                                <p className="mt-3 text-center text-lg font-bold leading-snug text-gray-800 sm:text-xl">
                                    <span className="text-[#4F6EF7]">5000+</span>{" "}
                                    elevi, părinți și profesori
                                </p>

                                <div className="mt-4 flex items-center justify-center gap-2 sm:gap-2.5">
                                    <Award
                                        className="hidden h-7 w-7 shrink-0 text-[#F59E3A] sm:block"
                                        aria-hidden
                                    />

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
                                            <p className="mt-1 text-lg font-bold text-[#4F6EF7] sm:text-xl">
                                                4,8/5
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                                                rating mediu
                                            </p>
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2.5 py-2.5 sm:px-3 sm:py-3">
                                            <div className="flex items-center gap-1">
                                                <ShieldCheck
                                                    className="h-4 w-4 shrink-0 text-[#4F6EF7]"
                                                    aria-hidden
                                                />
                                                <p className="text-lg font-bold text-[#4F6EF7] sm:text-xl">
                                                    100+
                                                </p>
                                            </div>
                                            <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">
                                                recenzii verificate
                                            </p>
                                        </div>
                                    </div>

                                    <Award
                                        className="hidden h-7 w-7 shrink-0 scale-x-[-1] text-[#F59E3A] sm:block"
                                        aria-hidden
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="hero-phone-enter scroll-animate-slide-up animate-delay-300 order-4 mx-auto flex w-full justify-center bg-white lg:order-none lg:col-start-2 lg:row-start-1 lg:mx-0 lg:-mt-16 lg:justify-end xl:-mt-20">
                            <Image
                                src="/hero-phone.png"
                                alt="Aplicația PLANCK pe telefon"
                                width={1080}
                                height={1920}
                                priority
                                className="h-auto w-[min(320px,85vw)] bg-white object-contain sm:w-[min(360px,80vw)] lg:w-[min(480px,42vw)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

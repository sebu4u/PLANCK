"use client"

import Image from "next/image"
import Link from "next/link"
import { type CSSProperties } from "react"
import { ArrowRight, Star } from "lucide-react"
import { LiveStats } from "@/components/live-stats"
import { HomePageNavbar } from "@/components/homepage-navbar"
import { HeroFeatureBar } from "@/components/hero-feature-bar"

export function HomePageHeroRedesign({ isMobile: _isMobile = false }: { isMobile?: boolean }) {
    return (
        <section
            id="hero-section"
            className="flex w-full flex-col bg-white lg:h-dvh lg:overflow-hidden"
        >
            {/* Navbar — absolute inside a fixed-height row so content below doesn’t slide under the bar */}
            <div className="relative h-24 shrink-0">
                <HomePageNavbar variant="light" />
            </div>

            {/* Main content — on lg+, fills space between navbar and banner; on mobile, natural height + scroll */}
            <div className="relative z-10 flex flex-col px-6 max-lg:pt-5 lg:min-h-0 lg:flex-1 lg:px-8">
                <div className="flex flex-col translate-y-[3px] lg:min-h-0 lg:flex-1 lg:justify-center">
                    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-center lg:gap-x-16">
                        {/* max-lg:contents = mobil păstrează ordinea intro → imagine → CTA; lg = o coloană flex fără „gol” sub subtext */}
                        <div className="max-lg:contents lg:flex lg:min-h-0 lg:flex-col lg:justify-center lg:gap-3">
                            <div className="order-1 mx-auto flex w-full max-w-2xl flex-col text-center lg:mx-0 lg:max-w-2xl lg:text-left">
                                <LiveStats variant="light" />

                                <h1 className="scroll-animate-fade-up mb-4 text-3xl font-bold leading-tight text-gray-900 sm:mb-6 sm:text-4xl lg:text-4xl xl:text-5xl">
                                    Explicații clare pentru note mai mari
                                </h1>
                                <p className="scroll-animate-fade-up animate-delay-200 mb-0 text-base leading-relaxed text-gray-600 sm:text-lg">
                                    Lecții structurate, exerciții interactive și AI care te ajută exact când te blochezi.
                                </p>
                            </div>

                            <div className="scroll-animate-fade-up animate-delay-400 order-3 mx-auto flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 lg:order-2 lg:mx-0 lg:max-w-2xl lg:flex-row lg:flex-wrap lg:items-center lg:justify-start">
                                <Link
                                    href="/register"
                                    className="dashboard-start-glow box-border inline-flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#4ade80] to-[#29cc57] px-9 text-base font-semibold text-white shadow-[0_4px_0_#169c4a] transition-[filter] duration-200 hover:brightness-105 active:brightness-[0.98] lg:w-auto"
                                    style={{ "--start-glow-tint": "rgba(200, 255, 230, 0.88)" } as CSSProperties}
                                >
                                    <span className="relative z-10 inline-flex items-center gap-2 text-white">
                                        Începe gratuit
                                        <ArrowRight className="h-4 w-4 shrink-0 text-white" aria-hidden />
                                    </span>
                                </Link>

                                <Link
                                    href="/probleme"
                                    className="box-border inline-flex h-[62px] w-full shrink-0 items-center justify-center rounded-full border border-gray-300 border-b-[5px] border-b-[#b8bcc4] bg-white px-9 text-base font-semibold leading-snug text-gray-900 transition-[background-color,border-color] hover:bg-gray-50 hover:border-gray-400 hover:border-b-[#a8adb6] lg:w-auto"
                                >
                                    Explorează problemele
                                </Link>
                            </div>
                        </div>

                        {/* Image — mobil între intro și CTA; desktop coloana dreaptă */}
                        <div className="order-2 flex min-h-0 items-center justify-center lg:order-none lg:col-start-2 lg:row-start-1">
                            <Image
                                src="/hero-homepage.png"
                                alt="Elevi colaborand la masa"
                                width={1024}
                                height={1024}
                                priority
                                className="h-auto max-h-[30vh] w-auto max-w-full object-contain sm:max-h-[35vh] lg:max-h-[55vh]"
                            />
                        </div>
                    </div>
                </div>

                {/* Trust row — above feature banner, centered */}
                <div className="flex shrink-0 flex-col items-center justify-center pb-3 pt-10 sm:pb-4 sm:pt-4">
                    <div
                        className="flex items-center justify-center gap-0.5"
                        role="img"
                        aria-label="5 din 5 stele"
                    >
                        {Array.from({ length: 5 }, (_, i) => (
                            <Star
                                key={i}
                                className="h-5 w-5 shrink-0 fill-yellow-400 text-yellow-400 sm:h-5 sm:w-5"
                                aria-hidden
                            />
                        ))}
                    </div>
                    <p className="mt-1.5 text-center text-sm font-semibold text-gray-500 sm:text-base">
                        „Folosit de elevi din 200+ școli”
                    </p>
                </div>
            </div>

            {/* Feature banner — pinned to bottom, never shrinks */}
            <div className="shrink-0">
                <HeroFeatureBar />
            </div>
        </section>
    )
}

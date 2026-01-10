"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FadeInUp } from "@/components/scroll-animations"

export function BlackHoleSection() {
    return (
        <section className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-[#111111]">
            {/* Gradient Overlay for seamless transition - Top */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#111111] to-transparent z-10" />

            {/* Black Hole Background Image */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none"
                style={{
                    backgroundImage: 'url(/images/black-hole-bg.png)',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center 60%', // Adjust vertical position to keep the black hole somewhat lower
                }}
            >
                {/* Overlay to ensure text readability */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Content */}
            <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center gap-8 mb-32">
                <FadeInUp>
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight">
                        Un nou mod de a învăța
                    </h2>
                </FadeInUp>

                <FadeInUp delay={0.1}>
                    <p className="text-lg md:text-xl lg:text-2xl text-white font-bold max-w-3xl leading-relaxed">
                        Explorează conexiunile dintre concepte într-un mod vizual și intuitiv.
                        Space te ajută să înțelegi fizica prin legături logice, nu prin memorare mecanică.
                        Navighează prin graficul de cunoștințe și descoperă cum se leagă formulele de teorie.
                    </p>
                </FadeInUp>

                <FadeInUp delay={0.2} className="mt-4">
                    <Link href="/space" className="group relative inline-flex">
                        <span className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-purple-400/60 to-blue-400/60 -z-20 pointer-events-none"></span>
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none"></span>
                        <span className="absolute inset-[1px] rounded-full bg-transparent group-hover:bg-transparent -z-10 pointer-events-none"></span>

                        <Button
                            variant="outline"
                            size="lg"
                            className="border-white text-white hover:border-transparent transition-all duration-300 flex items-center gap-2 bg-transparent relative z-10 rounded-full h-14 px-8 text-lg"
                        >
                            <span className="relative z-10 bg-gradient-to-r from-white to-white group-hover:from-purple-400 group-hover:to-blue-400 bg-clip-text group-hover:text-transparent transition-all duration-300 font-semibold">
                                Explorează Space
                            </span>
                        </Button>
                    </Link>
                </FadeInUp>
            </div>

            {/* Bottom gradient to blend into darkness if subsequent sections are dark */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

        </section>
    )
}

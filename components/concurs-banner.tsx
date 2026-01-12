"use client"

import Link from "next/link"
import { ArrowRight, Trophy, Sparkles } from "lucide-react"

export function ConcursBanner() {
    return (
        <section className="relative w-full py-4 overflow-hidden bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-[10%] w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                <div className="absolute top-1/3 left-[25%] w-1.5 h-1.5 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute top-2/3 left-[40%] w-1 h-1 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/4 right-[30%] w-2 h-2 bg-white/35 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute top-1/2 right-[15%] w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/3 right-[20%] w-1 h-1 bg-white/45 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
            </div>

            {/* Content */}
            <Link
                href="/concurs"
                className="group relative flex items-center justify-center gap-3 px-6 cursor-pointer"
            >
                {/* Trophy icon */}
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm">
                    <Trophy className="w-4 h-4 text-white" />
                </div>

                {/* Text content */}
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm md:text-base">
                        🏆 Concursul Național de Fizică PLANCK 2026
                    </span>
                    <span className="hidden sm:inline text-white/90 text-sm">
                        — Înscrie-te acum și câștigă premii!
                    </span>
                </div>

                {/* CTA Arrow */}
                <div className="flex items-center gap-1 text-white font-medium text-sm group-hover:gap-2 transition-all duration-300">
                    <span className="hidden md:inline">Află mai multe</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>

                {/* Sparkles decoration */}
                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 hidden lg:block" />
            </Link>

            {/* Bottom shine effect */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </section>
    )
}

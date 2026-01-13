"use client"

import Link from "next/link"
import { Trophy, ArrowRight } from "lucide-react"

export function ContestPromoCard() {
    return (
        <Link
            href="/concurs"
            prefetch={false}
            className="block lg:hidden group"
        >
            <div className="relative overflow-hidden rounded-xl p-3 bg-[#181818] border border-orange-500/40 hover:border-orange-500/60 transition-all duration-300 hover:bg-[#1c1c1c]">
                {/* Subtle orange glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20">
                        <Trophy className="w-4 h-4 text-orange-400" />
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white/90 leading-tight group-hover:text-orange-400 transition-colors">
                            🏆 Concursul Național PLANCK 2026
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                            Înscrie-te gratuit și câștigă premii
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500/20 transition-all duration-300">
                        <ArrowRight className="w-3.5 h-3.5 text-orange-400 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                </div>
            </div>
        </Link>
    )
}

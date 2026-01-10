"use client"

import { ProblemsSearchBar } from "@/components/problems-search-bar"
import { FadeInUp } from "@/components/scroll-animations"
import Link from "next/link"

const popularCategories = [
    { name: "Cinematică", href: "/probleme?chapter=cinematica" },
    { name: "Dinamică", href: "/probleme?chapter=dinamica" },
    { name: "Termodinamică", href: "/probleme?chapter=termodinamica" },
    { name: "Electromagnetism", href: "/probleme?chapter=electromagnetism" },
    { name: "Optică", href: "/probleme?chapter=optica" },
    { name: "Mecanică", href: "/probleme?chapter=mecanica" },
]

export function ProblemsShowcaseSection() {
    return (
        <section className="w-full py-16 lg:py-20" style={{ backgroundColor: '#111111' }}>
            <div className="max-w-[900px] mx-auto px-6">
                <FadeInUp className="text-center mb-8">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        Găsește problema perfectă
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                        Caută printre sute de probleme rezolvate pas cu pas, de la mecanică la fizică cuantică.
                    </p>
                </FadeInUp>

                <FadeInUp delay={0.1} className="mb-8">
                    <ProblemsSearchBar />
                </FadeInUp>

                <FadeInUp delay={0.2}>
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-gray-500 text-sm">Categorii populare:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {popularCategories.map((category) => (
                                <Link
                                    key={category.name}
                                    href={category.href}
                                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </FadeInUp>
            </div>
        </section>
    )
}

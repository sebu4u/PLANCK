"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Star } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"

/** Hero — leave UI/copy unchanged for campaign restructure. */
export function LandingHeroSection() {
  return (
    <section className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#EBE8FF] opacity-40 blur-[120px]" />
      </div>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-16 pt-28 text-center">
        <FadeInUp>
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
            <Sparkles className="h-3.5 w-3.5" />
            Ofertă specială de lansare
          </span>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Materia pe care nu ai{" "}
            <br className="hidden sm:block" />
            înțeles-o niciodată,{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
              explicată simplu.
            </span>
          </h1>
        </FadeInUp>

        <FadeInUp delay={0.18} className="mt-6">
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg sm:leading-8">
            Cursuri complete pe toate materiile, un catalog de{" "}
            <strong className="font-semibold text-gray-700">1000+ probleme rezolvate video</strong>, și un profesor AI care îți creează un{" "}
            <strong className="font-semibold text-gray-700">traseu personalizat</strong> — totul într-un singur abonament.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.26} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98]"
          >
            Încearcă gratuit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex h-14 items-center justify-center rounded-full border border-gray-300 border-b-[3px] border-b-[#b8bcc4] bg-white px-8 text-base font-bold text-gray-900 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
          >
            Vezi planurile
          </a>
        </FadeInUp>

        <FadeInUp delay={0.34} className="mt-8 flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-[#F59E3A] text-[#F59E3A]" />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Peste 1.000 de elevi</span> învață deja pe PLANCK
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}

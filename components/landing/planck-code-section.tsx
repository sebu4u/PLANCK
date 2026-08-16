"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Code2 } from "lucide-react"
import { FadeInLeft, FadeInRight } from "@/components/scroll-animations"

export function LandingPlanckCodeSection() {
  return (
    <section className="overflow-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeInRight>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              <Code2 className="h-3.5 w-3.5" />
              Planck Code
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Și dacă vrei să înveți și să programezi?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
              IDE complet cu Python și C++, probleme de informatică, Insight integrat direct în cod — util pentru BAC la info sau dacă vrei să începi programarea.
            </p>
            <Link
              href="/planckcode"
              className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-[#7C5CFC] px-8 text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
            >
              Explorează Planck Code
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeInRight>

          <FadeInLeft>
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-[24px] shadow-[0_24px_60px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
              <Image
                src="/code_analysis_demo.png"
                alt="Planck Code — analiză AI pe cod"
                width={900}
                height={600}
                className="h-auto w-full object-cover"
              />
            </div>
          </FadeInLeft>
        </div>
      </div>
    </section>
  )
}

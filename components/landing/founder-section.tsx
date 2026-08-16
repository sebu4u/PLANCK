"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeInLeft, FadeInUp } from "@/components/scroll-animations"
import { teamMembers } from "@/lib/despre-constants"

const founder = teamMembers[0]

export function LandingFounderSection() {
  return (
    <section className="relative overflow-hidden bg-[#1A1A1E]">
      <div className="relative mx-auto grid max-w-7xl items-end lg:grid-cols-[minmax(220px,38%)_minmax(0,1fr)]">
        {/* Left: transparent PNG, flush to section bottom */}
        <div className="relative flex items-end justify-center px-4 pt-10 sm:px-6 lg:px-4 lg:pt-12 xl:px-6">
          <FadeInUp className="w-full max-w-[210px] lg:max-w-none">
            <Image
              src="/images/homepage/fondator.png"
              alt={founder.name}
              width={720}
              height={1080}
              className="mx-auto h-auto w-full max-w-[196px] object-contain object-bottom sm:max-w-[224px] lg:max-w-[266px] xl:max-w-[294px]"
              sizes="(max-width: 1024px) 224px, 28vw"
              priority={false}
            />
          </FadeInUp>
        </div>

        {/* Right: story copy */}
        <div className="flex min-w-0 flex-col justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:max-w-2xl lg:px-8 lg:pb-20 lg:pt-20 xl:pl-4">
          <FadeInLeft>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Construit de cineva care a trecut chiar el prin asta.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
              {founder.name} are 18 ani, medalie de argint la Olimpiada Națională de Fizică, și a construit PLANCK de unul singur — pentru că nu exista ce își dorea el ca elev: explicații clare, un plan real și un profesor care nu obosește.
            </p>
            <p className="mt-3 text-sm font-medium text-[#B8A6FF]">{founder.badge}</p>
            <Link
              href="/despre"
              className="mt-8 inline-flex h-14 items-center justify-center rounded-full border border-white/20 border-b-[3px] border-b-white/30 bg-white px-8 text-base font-bold text-gray-900 transition-[background-color,border-color,filter] hover:bg-zinc-100"
            >
              Citește povestea Planck
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeInLeft>
        </div>
      </div>
    </section>
  )
}

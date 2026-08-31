"use client"

import type { ReactNode } from "react"
import { Camera, Instagram } from "lucide-react"

import { FadeInUp } from "@/components/scroll-animations"
import {
  PLANCK_INSTAGRAM_HANDLE,
  PLANCK_INSTAGRAM_HREF,
} from "@/lib/prize-wheel/campaign"
import { cn } from "@/lib/utils"

const STEPS = [
  "Fă o poză sau o captură cu premiul câștigat.",
  `Pune-o într-un story pe Instagram și dă tag la ${PLANCK_INSTAGRAM_HANDLE}.`,
  "Primești, pe lângă premiu, o meditație 1:1 complet gratuită cu un profesor de pe platformă.",
] as const

function InstagramCta({ className }: { className?: string }) {
  return (
    <a
      href={PLANCK_INSTAGRAM_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)] text-[15px] font-bold text-white shadow-[0_4px_0_#9d1757] transition hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_#9d1757]",
        className,
      )}
    >
      <Instagram className="h-4 w-4" aria-hidden />
      Deschide Instagram
    </a>
  )
}

export function CastigaInstagramBonusCard({
  compact = false,
  className,
  footer,
}: {
  compact?: boolean
  className?: string
  footer?: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] bg-white text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-[#EBE8FF]",
        compact ? "px-4 py-4" : "px-4 py-5 sm:px-5 sm:py-6",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)] text-white">
          <Camera className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ee2a7b]">
            Bonus extra
          </p>
          <p className="mt-0.5 text-base font-black tracking-tight text-gray-900 sm:text-lg">
            Meditație 1:1 gratuită
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-[15px]">
        Pune un story pe Instagram cu o poză a premiului câștigat și dă tag la{" "}
        <span className="font-bold text-gray-800">{PLANCK_INSTAGRAM_HANDLE}</span>. Pe lângă
        premiul tău, primești o meditație 1:1 complet gratuită cu un profesor de pe platformă.
      </p>

      <ol className="mt-4 space-y-2">
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-gray-600">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F8F7FF] text-[11px] font-black text-[#7C5CFC] ring-1 ring-[#EBE8FF]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <InstagramCta className="mt-4" />
      {footer}
    </div>
  )
}

export function CastigaInstagramBonusSection() {
  return (
    <section className="bg-[#F8F7FF] px-4 pb-28 pt-2 sm:px-6 sm:pb-24">
      <div className="mx-auto w-full max-w-xl">
        <FadeInUp className="text-center">
          <h2 className="text-[1.65rem] font-black tracking-tight text-gray-900 sm:text-4xl">
            Bonus pe Instagram
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
            După ce câștigi și accepți premiul, poți lua și o meditație 1:1 gratuită.
          </p>
        </FadeInUp>
        <FadeInUp delay={0.08} className="mt-8 sm:mt-10">
          <CastigaInstagramBonusCard />
        </FadeInUp>
      </div>
    </section>
  )
}

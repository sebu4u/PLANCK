"use client"

import { BookOpen, GraduationCap, Layers, Sparkles, Users } from "lucide-react"

const STATS = [
  { value: "50.000+", label: "elevi", Icon: Users },
  { value: "20+", label: "olimpici profesori", Icon: GraduationCap },
  { value: "10.000+", label: "exerciții", Icon: BookOpen },
  { value: "5", label: "materii", Icon: Layers },
  { value: "Tutor AI", label: null, Icon: Sparkles },
] as const

function StatsRow({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex gap-3 pr-3 sm:gap-4 sm:pr-4" aria-hidden={hidden || undefined}>
      {STATS.map(({ value, label, Icon }) => (
        <div
          key={value}
          className="flex min-w-[220px] flex-shrink-0 items-center gap-3 rounded-2xl bg-[#F8F7FF] px-5 py-4 ring-1 ring-[#EBE8FF] sm:min-w-[250px] sm:px-6"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#EBE8FF]">
            <Icon className="h-5 w-5 text-[#7C5CFC]" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">{value}</p>
            {label ? <p className="text-sm font-medium text-gray-500">{label}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function LandingSocialProofSection() {
  return (
    <section
      className="overflow-hidden border-y border-[#EBE8FF] bg-white py-8 sm:py-10"
      aria-label="Rezultatele platformei"
    >
      <div
        className="flex w-max motion-safe:animate-stats-marquee motion-safe:hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: "28s" }}
      >
        <StatsRow />
        <StatsRow hidden />
      </div>
    </section>
  )
}

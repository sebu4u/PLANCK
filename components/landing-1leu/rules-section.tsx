"use client"

import { Clock3, Gift, UserPlus } from "lucide-react"

import { FadeInUp } from "@/components/scroll-animations"
import {
  LANDING_1LEU_YEARLY_RON,
  PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT,
} from "@/lib/landing-1leu"

const STEPS = [
  {
    Icon: UserPlus,
    title: "Cont de elev, gratuit",
    body: "Îl faci acum, fără card. La 12:00 nu mai stai pe formular — doar învârți.",
  },
  {
    Icon: Clock3,
    title: `1 septembrie, 12:00: primii ${PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT}`,
    body: `Ai până la două învârtiri. Primii ${PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT} iau un an de Premium la 1 leu, nu la ${LANDING_1LEU_YEARLY_RON} RON.`,
  },
  {
    Icon: Gift,
    title: "Dacă nu prinzi locul, tot câștigi",
    body: "7 zile Premium, −50% anual sau −70% lunar. Premiu garantat, nu „mai încearcă mâine”.",
  },
] as const

export function Landing1LeuRulesSection() {
  return (
    <section className="bg-gradient-to-b from-white via-[#F8F7FF] to-[#F8F7FF] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Da, e real. Condițiile:
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            Fără stele mici. Fără „doar azi, doar dacă dai share”. Așa merge roata.
          </p>
        </FadeInUp>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
          {STEPS.map((step, index) => (
            <FadeInUp key={step.title} delay={0.06 * index}>
              <div className="h-full rounded-[24px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-[#EBE8FF] sm:px-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8F7FF] text-[#7C5CFC] ring-1 ring-[#EBE8FF]">
                  <step.Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-lg font-black tracking-tight text-gray-900">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:text-[15px]">{step.body}</p>
              </div>
            </FadeInUp>
          ))}
        </div>

        <FadeInUp delay={0.16} className="mx-auto mt-8 max-w-3xl">
          <p className="rounded-2xl bg-white px-5 py-4 text-center text-sm leading-relaxed text-gray-600 ring-1 ring-[#EBE8FF] sm:text-[15px]">
            1 leu e pentru primul an. După 12 luni, dacă nu anulezi, se reînnoiește la prețul
            normal ({LANDING_1LEU_YEARLY_RON} RON). Anulezi din cont în ~30 de secunde.
          </p>
        </FadeInUp>
      </div>
    </section>
  )
}

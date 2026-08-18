"use client"

import { CalendarClock, GraduationCap, Wallet } from "lucide-react"
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/scroll-animations"
import { EARLYBIRD_YEARLY_RON } from "@/lib/landing-campaign"
import {
  PARENT_TUTORING_HOUR_MAX_RON,
  PARENT_TUTORING_HOUR_MIN_RON,
  PARENT_TUTORING_MONTHLY_MAX_RON,
  PARENT_TUTORING_MONTHLY_MIN_RON,
} from "@/lib/landing-parinti"

const COMPARISON = [
  {
    Icon: Wallet,
    title: "Meditațiile private",
    text: `${PARENT_TUTORING_HOUR_MIN_RON}–${PARENT_TUTORING_HOUR_MAX_RON} RON pe oră. Două ședințe pe săptămână înseamnă circa ${PARENT_TUTORING_MONTHLY_MIN_RON}–${PARENT_TUTORING_MONTHLY_MAX_RON} RON/lună — pe o singură materie.`,
  },
  {
    Icon: CalendarClock,
    title: "PLANCK, un an întreg",
    text: `${EARLYBIRD_YEARLY_RON} RON/an pentru toate cele 5 materii, cu pregătiri live zilnice și înregistrări dacă a ratat ora.`,
  },
  {
    Icon: GraduationCap,
    title: "Nota de BAC",
    text: "Ritm zilnic, nu o oră ocazională. Simulări, grile video și un plan clar — ca să recupereze cât încă mai e timp.",
  },
] as const

export function ParentSavingsSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <FadeInUp className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Economisești mii de lei pe an. Copilul are ritm, nu o meditație pe săptămână.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Un abonament acoperă ce ai plăti separat la mate, fizică, info, chimie sau bio — și
            pregătirea nu se oprește între ședințe.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-3" staggerDelay={0.08}>
          {COMPARISON.map(({ Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-[20px] bg-[#F8F7FF] p-6 ring-1 ring-[#EBE8FF]">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-[#EBE8FF]">
                  <Icon className="h-5 w-5 text-[#7C5CFC]" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

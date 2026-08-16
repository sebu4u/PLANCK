"use client"

import { AlertCircle, BookX, Wallet } from "lucide-react"
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/scroll-animations"

const PAINS = [
  {
    Icon: Wallet,
    title: "Meditațiile costă",
    text: "100–150 RON pe oră se adună rapid — și tot nu ai un plan clar între ședințe.",
  },
  {
    Icon: BookX,
    title: "Grilele nu explică",
    text: "Platformele tipice îți arată răspunsul corect, nu raționamentul. Rămâi cu aceeași greșeală.",
  },
  {
    Icon: AlertCircle,
    title: "Presiune fără plan",
    text: "BAC și admiterea vin, dar fără un traseu personalizat e greu să știi ce să repeți și când.",
  },
] as const

export function LandingProblemSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <FadeInUp className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Meditațiile costă. Grilele nu explică. Tu ai nevoie de altceva.
          </h2>
        </FadeInUp>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-3" staggerDelay={0.08}>
          {PAINS.map(({ Icon, title, text }) => (
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

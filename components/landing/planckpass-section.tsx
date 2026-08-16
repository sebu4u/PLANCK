"use client"

import { Coins, Sparkles, Trophy, Zap } from "lucide-react"
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/scroll-animations"

const REWARDS = [
  { Icon: Trophy, label: "50 de niveluri", text: "Progres vizibil, nu doar un checklist" },
  { Icon: Coins, label: "Monedă Quante", text: "Câștigi pe măsură ce înveți" },
  { Icon: Zap, label: "Recompense reale", text: "Badge-uri, freeze, boost-uri de progres" },
  { Icon: Sparkles, label: "Motivație zilnică", text: "Te ține în ritm fără presiune toxică" },
] as const

export function LandingPlanckPassSection() {
  return (
    <section className="bg-[#F8F7FF] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeInUp className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Învățatul care te ține motivat, nu doar disciplinat.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            PlanckPass: 50 de niveluri, monedă Quante, recompense — transformi progresul într-un joc real, nu doar o listă de bifate.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
          {REWARDS.map(({ Icon, label, text }) => (
            <StaggerItem key={label}>
              <div className="h-full rounded-[20px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#c77bff]">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.15} className="mt-10">
          <div className="mx-auto flex max-w-xl items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C5CFC] via-[#9a7bff] to-[#F59E3A] p-[2px]">
            <div className="flex w-full items-center justify-between gap-3 rounded-[14px] bg-white px-4 py-4 sm:px-6">
              {[1, 2, 3, 4, 5].map((tier) => (
                <div key={tier} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black sm:h-12 sm:w-12 sm:text-sm ${
                      tier <= 3
                        ? "bg-[#7C5CFC] text-white"
                        : "bg-[#EBE8FF] text-[#5B47D6]"
                    }`}
                  >
                    {tier}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 sm:text-xs">
                    Nv. {tier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}

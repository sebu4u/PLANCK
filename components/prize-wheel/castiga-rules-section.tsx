"use client"

import { BadgeCheck, Clock3, Gift, UserPlus } from "lucide-react"

import { FadeInUp } from "@/components/scroll-animations"

const RULES = [
  {
    Icon: UserPlus,
    title: "Este necesar un cont",
    body: "Ai nevoie de un cont de elev ca să participi. Îl faci gratuit, în câteva secunde.",
  },
  {
    Icon: Clock3,
    title: "O singură învârtire",
    body: "Roata poate fi învârtită o singură dată, marți 1 septembrie, la ora 12:00.",
  },
  {
    Icon: Gift,
    title: "Premiul e cupon pe profil",
    body: "Premiul este salvat sub formă de cupon în profilul tău și îl poți folosi oricând.",
  },
  {
    Icon: BadgeCheck,
    title: "Toate premiile sunt câștigătoare",
    body: "Nu ai nevoie de card ca să participi. Toată lumea care învârte câștigă.",
  },
] as const

export function CastigaRulesSection() {
  return (
    <section className="bg-gradient-to-b from-white via-[#F8F7FF] to-[#F8F7FF] px-4 pb-28 pt-6 sm:px-6 sm:pb-24 sm:pt-12">
      <div className="mx-auto w-full max-w-xl">
        <FadeInUp className="text-center">
          <h2 className="text-[1.65rem] font-black tracking-tight text-gray-900 sm:text-4xl">
            Regulile promoției
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
        </FadeInUp>

        <ol className="mt-8 flex flex-col gap-3 sm:mt-10 sm:gap-4">
          {RULES.map((rule, index) => (
            <FadeInUp key={rule.title} delay={0.05 * index}>
              <li className="flex gap-3.5 rounded-[24px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-[#EBE8FF] sm:gap-4 sm:px-5 sm:py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8F7FF] text-[#7C5CFC] ring-1 ring-[#EBE8FF]">
                  <rule.Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7C5CFC]">
                    {index + 1}
                  </p>
                  <p className="mt-0.5 text-base font-black tracking-tight text-gray-900 sm:text-lg">
                    {rule.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500 sm:text-[15px]">{rule.body}</p>
                </div>
              </li>
            </FadeInUp>
          ))}
        </ol>
      </div>
    </section>
  )
}

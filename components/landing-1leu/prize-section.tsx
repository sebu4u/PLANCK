"use client"

import { FadeInUp } from "@/components/scroll-animations"
import { LANDING_1LEU_YEARLY_RON } from "@/lib/landing-1leu"

const HIGHLIGHTS = [
  "Trasee, grile și probleme rezolvate video",
  "Insight, tutorul AI, nelimitat",
  "Pregătiri live + înregistrări, tot anul",
] as const

export function Landing1LeuPrizeSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Ce faci cu premiul
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            Un an de PLANCK Premium — același abonament pe care îl plătești altfel cu{" "}
            {LANDING_1LEU_YEARLY_RON} RON. Acces la tot ce e pe platformă, 12 luni.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.08} className="mx-auto mt-8 max-w-2xl sm:mt-10">
          <ul className="divide-y divide-[#EBE8FF] overflow-hidden rounded-[24px] bg-[#F8F7FF] ring-1 ring-[#EBE8FF] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="px-5 py-4 text-center text-sm font-semibold leading-snug text-gray-800 sm:px-4 sm:py-6 sm:text-[15px]"
              >
                {item}
              </li>
            ))}
          </ul>
        </FadeInUp>
      </div>
    </section>
  )
}

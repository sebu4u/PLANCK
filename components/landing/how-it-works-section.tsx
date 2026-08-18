"use client"

import Image from "next/image"
import { FadeInLeft, FadeInRight } from "@/components/scroll-animations"

export function LandingHowItWorksSection() {
  return (
    <section className="bg-[#ffffff] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:gap-6 lg:px-8">
        <FadeInRight className="w-full lg:w-[42%] lg:shrink-0">
          <div className="overflow-hidden rounded-none bg-gray-100">
            <Image
              src="/images/landing-copil.jpeg"
              alt="Elev PLANCK la învățat"
              width={900}
              height={720}
              className="h-auto w-full object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
          <p className="mt-4 text-sm font-semibold leading-snug text-gray-800 sm:text-base">
            9/10 elevi și-au mărit considerabil media cu PLANCK
          </p>
        </FadeInRight>

        <FadeInLeft className="min-w-0 w-full lg:flex-1">
          <span className="inline-flex rounded-md bg-[#7C5CFC] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Cum funcționează?
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            Un ritm zilnic, nu o meditație ocazională
          </h2>
          <div className="mt-3 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
          <p className="mt-6 text-base leading-relaxed text-gray-600 sm:text-lg">
            Alegi materia, intri în grupa live și ai pregătire în fiecare zi — cu profesor real, nu
            cu un PDF. Dacă ratezi ora, rămâne înregistrarea. Între sesiuni lucrezi grile și
            exerciții rezolvate video, pe programa de la clasa a 9-a până la a 12-a.
          </p>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            Profesorii sunt olimpici naționali și internaționali: îți arată cum gândesc, nu doar ce
            formulă să pui. Un singur abonament acoperă cele 5 materii. Tu ții ritmul, noi ținem
            structura — până când media se mișcă vizibil.
          </p>
        </FadeInLeft>
      </div>
    </section>
  )
}

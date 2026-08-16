"use client"

import Image from "next/image"
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/scroll-animations"
import { PLATFORM_STATS } from "@/lib/platform-marketing"

const LOGOS = [
  { src: "/images/reusite/zbr.png", alt: "Zbor" },
  { src: "/images/reusite/TIA.png", alt: "Tinerii în Arenă" },
  { src: "/images/reusite/concurs.png", alt: "Concursul Național de Fizică PLANCK" },
  { src: "/images/reusite/startYourStartUp.png", alt: "Start your Start up" },
  { src: "/images/reusite/Lace%20(2).png", alt: "Lace Magazine" },
] as const

export function LandingSocialProofSection() {
  return (
    <section className="border-y border-[#EBE8FF] bg-[#F8F7FF] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeInUp className="text-center">
          <h2 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl md:text-3xl">
            Recomandat de profesori și elevi olimpici din toată țara
          </h2>
          <p className="mt-3 text-base font-semibold text-[#7C5CFC]">
            {PLATFORM_STATS.activeUsers} elevi activi în ultimul an
          </p>
        </FadeInUp>

        <StaggerContainer
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-12"
          staggerDelay={0.06}
        >
          {LOGOS.map((logo) => (
            <StaggerItem key={logo.alt}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={140}
                height={56}
                className="h-10 w-auto object-contain opacity-80 grayscale transition-[opacity,filter] hover:opacity-100 hover:grayscale-0 sm:h-12"
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

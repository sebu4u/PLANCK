"use client"

import Image from "next/image"
import { FadeInUp } from "@/components/scroll-animations"

export function PlanckWeekFaqTeacher() {
  return (
    <div className="bg-white">
      <FadeInUp className="flex justify-center leading-none">
        <Image
          src="/landing-teacher.png"
          alt="Profesoară PLANCK"
          width={1024}
          height={1024}
          className="block h-auto w-[240px] select-none object-contain object-bottom sm:w-[300px] lg:w-[340px]"
          sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 340px"
        />
      </FadeInUp>
    </div>
  )
}

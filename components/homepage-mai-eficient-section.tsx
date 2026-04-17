"use client"

import Image from "next/image"

const IMG_W = 1200
const IMG_H = 900

export function HomePageMaiEficientSection() {
  return (
    <section
      id="home-mai-eficient"
      className="bg-gradient-to-b from-[#f7f7f7] to-[#ebf7f6] pt-16 pb-0 sm:pt-20 sm:pb-0 md:bg-gradient-to-r md:from-[#f7f7f7] md:to-[#ebf7f6] lg:pt-24 lg:pb-0"
      aria-labelledby="home-mai-eficient-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
        <div className="flex flex-col items-stretch gap-10 md:grid md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="order-2 flex min-h-0 flex-col justify-end md:order-1 md:min-w-0 md:items-start">
            <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-t-[2rem] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.18)] sm:max-w-[320px] md:mx-0 md:mr-auto md:max-w-[360px] lg:max-w-[400px]">
              <Image
                src="/images/reusite/distractiv.png"
                alt="Ilustrație din lecție: fotbal și fizică"
                width={IMG_W}
                height={IMG_H}
                className="h-auto w-full select-none object-cover object-bottom"
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 400px"
                draggable={false}
              />
            </div>
          </div>

          <div className="order-1 md:order-2 md:min-w-0 md:pt-20 lg:pt-28">
            <h2
              id="home-mai-eficient-heading"
              className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-4xl xl:text-5xl"
            >
              <span className="block">Mai eficient,</span>
              <span className="block">mai distractiv</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-700 sm:mt-5 sm:text-lg">
              PLANCK îți explică fizica pe înțelesul tău, prin exemple din viața de zi cu zi și exerciții scurte.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

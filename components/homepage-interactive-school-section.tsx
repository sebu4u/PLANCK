"use client"

import Image from "next/image"

const IMG_SIZE = 1024

/** Aceeași orientare pentru toate cardurile; unghiuri inversate față de varianta anterioară. */
const CARD_3D =
  "[transform:rotateX(-11deg)_rotateY(22deg)] [transform-style:preserve-3d] [transform-origin:center_center]"

const CARDS = [
  {
    src: "/images/reusite/aruncare.png",
    alt: "Simulare interactivă: aruncare de proiectile",
    layout: { left: "0%", top: "0%", z: 10 },
  },
  {
    src: "/images/reusite/info.png",
    alt: "Simulare interactivă: algoritm de pathfinding",
    layout: { left: "24%", top: "16%", z: 20 },
  },
  {
    src: "/images/reusite/pendul.png",
    alt: "Simulare interactivă: oscilații cu pendul",
    layout: { left: "46%", top: "30%", z: 30 },
  },
] as const

export function HomePageInteractiveSchoolSection() {
  return (
    <section
      id="home-interactive-school"
      className="bg-gradient-to-b from-[#f7f7f7] to-[#ebf7f6] py-16 sm:py-20 md:bg-gradient-to-r md:from-[#f7f7f7] md:to-[#ebf7f6] lg:py-24"
      aria-labelledby="home-interactive-school-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-stretch gap-10 md:grid md:grid-cols-2 md:items-center md:gap-12 lg:gap-16">
          <div className="order-1 md:order-2 md:min-w-0">
            <h2
              id="home-interactive-school-heading"
              className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-4xl xl:text-5xl"
            >
              <span className="block">Școala online</span>
              <span className="block">interactivă</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-700 sm:mt-5 sm:text-lg">
              Crește-ți nota la fizică cu lecții care fac conceptele complexe ușor de înțeles. Primești feedback instant pe
              măsură ce înveți.
            </p>
          </div>

          <div className="order-2 md:order-1 md:min-w-0 md:overflow-visible">
            <div className="mx-auto flex w-full max-w-lg justify-center overflow-visible md:max-w-none">
              <div
                className="relative aspect-[10/9] w-full max-w-[min(100%,24rem)] overflow-visible sm:max-w-[27rem] md:aspect-[11/9] md:max-w-[min(100%,30rem)] lg:max-w-[32rem] [perspective:1400px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {CARDS.map((card) => (
                  <div
                    key={card.src}
                    className={`absolute w-[52%] overflow-hidden rounded-2xl shadow-[0_10px_28px_-6px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.04] ${CARD_3D}`}
                    style={{
                      left: card.layout.left,
                      top: card.layout.top,
                      zIndex: card.layout.z,
                    }}
                  >
                    <Image
                      src={card.src}
                      alt={card.alt}
                      width={IMG_SIZE}
                      height={IMG_SIZE}
                      className="h-auto w-full select-none object-cover"
                      sizes="(max-width: 768px) 52vw, 340px"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

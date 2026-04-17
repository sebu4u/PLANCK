"use client"

import Image from "next/image"

type ReusiteItem = {
  src: string
  alt: string
}

const ITEMS: ReusiteItem[] = [
  { src: "/images/reusite/zbr.png", alt: "Zbor — prezentare" },
  { src: "/images/reusite/TIA.png", alt: "Tinerii în Arenă — semifinalist" },
  { src: "/images/reusite/concurs.png", alt: "Concursul Național de Fizică PLANCK" },
  { src: "/images/reusite/startYourStartUp.png", alt: "Start your Start up — premiul I" },
  { src: "/images/reusite/Lace%20(2).png", alt: "Lace Magazine — articol" },
]

const LACE: ReusiteItem = { src: "/images/reusite/Lace%20(2).png", alt: "Lace Magazine — articol" }
const ZBR: ReusiteItem = { src: "/images/reusite/zbr.png", alt: "Zbor — prezentare" }
const CONCURS: ReusiteItem = { src: "/images/reusite/concurs.png", alt: "Concursul Național de Fizică PLANCK" }
const STARTUP: ReusiteItem = { src: "/images/reusite/startYourStartUp.png", alt: "Start your Start up — premiul I" }
const TIA: ReusiteItem = { src: "/images/reusite/TIA.png", alt: "Tinerii în Arenă — semifinalist" }

function LogoImage({
  item,
  className,
  width,
  height,
}: {
  item: ReusiteItem
  className?: string
  width?: number
  height?: number
}) {
  return (
    <Image
      src={item.src}
      alt={item.alt}
      width={width ?? 320}
      height={height ?? 128}
      className={className}
    />
  )
}

export function HomePageReusiteSection() {
  return (
    <section
      id="home-reusite"
      className="bg-gradient-to-r from-[#f2f2f2] to-white pb-10 pt-12 sm:pb-12 sm:pt-14 lg:pb-14 lg:pt-16"
      aria-labelledby="home-reusite-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="home-reusite-heading"
          className="mb-8 text-center font-serif text-3xl font-semibold tracking-tight text-gray-900 sm:mb-10 sm:text-4xl lg:mb-12 lg:text-[2.5rem]"
        >
          Învață alături de mii de elevi din toată țara
        </h2>

        {/* Mobil: 3 rânduri, fără separatoare; concurs mare, suprapus peste zona de dedesubt */}
        <div className="flex flex-col gap-8 overflow-visible md:hidden">
          <div className="relative z-30 flex justify-center overflow-visible py-2">
            {/* Înălțime de „slot” ca înainte — fluxul rămâne la fel pentru rândurile 2–3 */}
            <span className="invisible block h-16 w-px shrink-0 select-none" aria-hidden />
            <Image
              src={CONCURS.src}
              alt={CONCURS.alt}
              width={720}
              height={288}
              className="absolute left-1/2 top-1/2 z-30 h-44 w-auto max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-52"
            />
          </div>
          <div className="relative z-0 grid grid-cols-2 gap-6 py-2">
            <div className="flex items-center justify-center px-2">
              <LogoImage item={LACE} className="h-16 w-auto max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-center px-2">
              <LogoImage item={ZBR} className="h-16 w-auto max-w-full object-contain" />
            </div>
          </div>
          <div className="relative z-0 grid grid-cols-2 gap-6 py-2">
            <div className="flex items-center justify-center px-2">
              <LogoImage item={STARTUP} className="h-16 w-auto max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-center px-2">
              <LogoImage item={TIA} className="h-16 w-auto max-w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Desktop: 5 coloane, logo concurs suprapus */}
        <div className="hidden md:block">
          <div className="overflow-visible">
            <div className="grid w-full min-w-0 grid-cols-5 divide-x divide-gray-200 overflow-visible">
              {ITEMS.map((item) => {
                const isConcursLogo = item.src.includes("concurs.png")
                if (isConcursLogo) {
                  return (
                    <div
                      key={item.src}
                      className="relative z-20 flex items-center justify-center overflow-visible px-4 py-2"
                    >
                      <span className="invisible block h-24 w-px select-none" aria-hidden />
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={640}
                        height={256}
                        className="absolute left-1/2 top-1/2 z-20 h-32 w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain sm:h-40 md:h-48 lg:h-56"
                      />
                    </div>
                  )
                }
                return (
                  <div
                    key={item.src}
                    className="relative z-0 flex items-center justify-center px-4 py-2"
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={320}
                      height={128}
                      className="h-16 w-auto max-w-full object-contain sm:h-20 md:h-24"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

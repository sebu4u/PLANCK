"use client"

import { useCallback, useState } from "react"
import { FadeInUp } from "@/components/scroll-animations"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import { PrizeWheelVisual } from "@/components/prize-wheel/prize-wheel-visual"
import { Landing1LeuCtaLink } from "@/components/landing-1leu/cta-link"
import { Landing1LeuHeroConfetti } from "@/components/landing-1leu/hero-confetti"
import { Landing1LeuWhatIsSheet } from "@/components/landing-1leu/what-is-planck-sheet"
import {
  PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT,
  useLanding1LeuCampaign,
} from "@/lib/landing-1leu"

export function Landing1LeuHeroSection() {
  const { days, hours, minutes, seconds, isLive } = useLanding1LeuCampaign()
  const [whatIsOpen, setWhatIsOpen] = useState(false)
  const openWhatIs = useCallback(() => setWhatIsOpen(true), [])
  const closeWhatIs = useCallback(() => setWhatIsOpen(false), [])

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(to_bottom,#c8e6ff_0%,#e8f4ff_16%,#ffffff_38%)]">
      <Landing1LeuHeroConfetti />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-[7.5rem] sm:px-6 sm:pb-14 sm:pt-[8.5rem] lg:px-8 lg:pb-20 lg:pt-[9.5rem]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:gap-12">
          <div className="flex flex-col text-center lg:text-left">
            <FadeInUp>
              {isLive ? (
                <span className="mx-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(124,92,252,0.28)] lg:mx-0">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#A3E635] opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A3E635]" />
                  </span>
                  Live
                </span>
              ) : (
                <span className="mx-auto inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(124,92,252,0.28)] lg:mx-0">
                  1 septembrie · ora 12:00
                </span>
              )}
            </FadeInUp>

            <FadeInUp delay={0.08}>
              {isLive ? (
                <h1 className="mt-5 text-[2.15rem] font-black leading-[1.06] tracking-tight text-gray-900 min-[400px]:text-[2.55rem] sm:text-5xl sm:leading-[1.06] lg:text-[3.6rem] lg:leading-[1.05]">
                  Roata este deschisă{" "}
                  <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
                    acum!
                  </span>
                </h1>
              ) : (
                <h1 className="mt-5 text-[2rem] font-black leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.35rem]">
                  {PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT} de locuri. Un an de Premium.{" "}
                  <span className="bg-gradient-to-r from-[#9a7bff] via-[#c77bff] to-[#ffb56b] bg-clip-text text-transparent">
                    1 leu.
                  </span>
                </h1>
              )}
              <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#A3E635] lg:mx-0" aria-hidden />
            </FadeInUp>

            <FadeInUp delay={0.14}>
              <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg sm:leading-8">
                {isLive
                  ? `Nu mai aștepta. Învârte acum — primii ${PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT} iau un an de Premium la 1 leu. Restul tot câștigă.`
                  : `Roata se deschide pe 1 septembrie, la prânz. Primii ${PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT} care o învârt iau un an întreg de PLANCK la 1 leu. Restul tot câștigă — premiile sunt garantate.`}
              </p>
            </FadeInUp>

            <div className="mt-8 hidden lg:block">
              <HeroCtaBlock
                days={days}
                hours={hours}
                minutes={minutes}
                seconds={seconds}
                isLive={isLive}
                onWhatIsPlanck={openWhatIs}
              />
            </div>
          </div>

          <FadeInUp delay={0.1} className="flex flex-col items-center">
            <div className="relative">
              <PrizeWheelVisual rotation={12} spinning={false} idle size={280} />
              {!isLive ? (
                <p className="absolute bottom-3 left-1/2 z-30 w-max -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#5B47D6] shadow-[0_8px_24px_-12px_rgba(92,71,214,0.55)] ring-1 ring-[#EBE8FF] sm:text-xs">
                  Se deschide 1 sept, 12:00
                </p>
              ) : (
                <p className="absolute bottom-3 left-1/2 z-30 w-max -translate-x-1/2 rounded-full bg-[#7C5CFC] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_8px_24px_-12px_rgba(92,71,214,0.55)] sm:text-xs">
                  Roata e deschisă
                </p>
              )}
            </div>
          </FadeInUp>

          <div className="lg:hidden">
            <HeroCtaBlock
              days={days}
              hours={hours}
              minutes={minutes}
              seconds={seconds}
              isLive={isLive}
              onWhatIsPlanck={openWhatIs}
            />
          </div>
        </div>
      </div>
      <Landing1LeuWhatIsSheet open={whatIsOpen} onClose={closeWhatIs} />
    </section>
  )
}

function HeroCtaBlock({
  days,
  hours,
  minutes,
  seconds,
  isLive,
  onWhatIsPlanck,
}: {
  days: number
  hours: number
  minutes: number
  seconds: number
  isLive: boolean
  onWhatIsPlanck: () => void
}) {
  return (
    <div className="flex flex-col items-center lg:items-start">
      {!isLive ? (
        <div className="flex max-w-full flex-wrap items-end justify-center gap-2 sm:gap-3 lg:justify-start">
          <CountdownUnit value={days} label="zile" />
          <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
          <CountdownUnit value={hours} label="ore" />
          <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
          <CountdownUnit value={minutes} label="min" />
          <span className="mb-4 text-2xl font-black text-[#7C5CFC]">:</span>
          <CountdownUnit value={seconds} label="sec" />
        </div>
      ) : (
        <p className="text-sm font-semibold text-[#5B47D6]">Locurile merg rapid. Învârte cât e deschisă.</p>
      )}

      <Landing1LeuCtaLink
        short={isLive}
        ctaId="1leu_hero_start"
        placement="1leu_hero"
        className="mt-6 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-full bg-[#7C5CFC] px-6 text-[15px] font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98] sm:h-14 sm:px-8 sm:text-base"
      />
      <p className="mt-2.5 max-w-sm text-center text-sm leading-relaxed text-gray-500 lg:text-left">
        {isLive
          ? "Cont de elev. Fără card acum. 1 leu se plătește doar dacă prinzi locul."
          : "Cont gratuit. Fără card acum. 1 leu se plătește doar dacă prinzi locul."}
      </p>
      <button
        type="button"
        onClick={onWhatIsPlanck}
        className="mt-1 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#7C5CFC] underline-offset-4 hover:underline active:opacity-80"
      >
        Ce este PLANCK? →
      </button>
    </div>
  )
}

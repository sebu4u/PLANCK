"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Clock } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_SAVE_PERCENT,
  EARLYBIRD_YEARLY_RON,
  FULL_YEARLY_RON,
  LANDING_MONTHLY_RON,
  LANDING_PREMIUM_BULLETS,
  LANDING_WEEKLY_RON,
  useCountdown,
  type CountdownState,
} from "@/lib/landing-campaign"
import { cn } from "@/lib/utils"

type Interval = "year" | "month" | "week"

function priceFor(interval: Interval) {
  if (interval === "year") {
    return {
      display: EARLYBIRD_YEARLY_RON,
      struck: FULL_YEARLY_RON,
      unit: "RON/an",
      note: `Ofertă earlybird până pe ${EARLYBIRD_DEADLINE_LABEL}`,
    }
  }
  if (interval === "month") {
    return {
      display: LANDING_MONTHLY_RON,
      struck: null as number | null,
      unit: "RON/lună",
      note: "Facturare lunară",
    }
  }
  return {
    display: LANDING_WEEKLY_RON,
    struck: null as number | null,
    unit: "RON/săptămână",
    note: "Ideal ca să testezi Premium",
  }
}

export function LandingPricingSection({ countdown }: { countdown?: CountdownState }) {
  const local = useCountdown()
  const { days, hours, minutes, seconds } = countdown ?? local
  const [interval, setBillingInterval] = useState<Interval>("year")
  const price = priceFor(interval)

  return (
    <section id="pricing" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <FadeInUp className="mb-4 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            1 An de Planck —{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] to-[#ffb56b] bg-clip-text text-transparent">
              cel mai bun moment să începi.
            </span>
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Premium unic — săptămânal, lunar sau anual. Ofertă valabilă până pe{" "}
            <strong className="text-gray-700">{EARLYBIRD_DEADLINE_LABEL}</strong>.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.1} className="mb-10 flex justify-center">
          <div className="inline-flex flex-col items-center rounded-2xl bg-[#F8F7FF] px-8 py-5 ring-1 ring-[#EBE8FF]">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">
              <Clock className="h-3.5 w-3.5" />
              Oferta expiră în
            </div>
            <div className="flex items-end gap-2">
              <CountdownUnit value={days} label="zile" />
              <span className="mb-4 text-xl font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={hours} label="ore" />
              <span className="mb-4 text-xl font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={minutes} label="min" />
              <span className="mb-4 text-xl font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={seconds} label="sec" />
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.15}>
          <div className="relative rounded-[28px] bg-gradient-to-br from-[#7aaeff] via-[#d39bff] to-[#ffb35c] p-[2.5px] shadow-[0_18px_45px_rgba(124,58,237,0.18)]">
            <div className="rounded-[26px] bg-white p-6 sm:p-8">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-3 py-1 text-xs font-bold text-white">
                ✦ Premium
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-gray-900">
                Premium — 1 an
              </h3>
              <p className="text-sm text-gray-400">
                Trasee, Insight nelimitat, pregătiri live și PlanckPass
              </p>

              <div className="mt-5 inline-flex rounded-full bg-gray-100 p-1">
                {(
                  [
                    { id: "year" as const, label: "Anual" },
                    { id: "month" as const, label: "Lunar" },
                    { id: "week" as const, label: "Săptămânal" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBillingInterval(opt.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors sm:px-4 sm:text-sm",
                      interval === opt.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {price.struck != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-400 line-through">
                      {price.struck} {price.unit}
                    </span>
                    <span className="rounded-full bg-[#FFE566] px-2 py-0.5 text-xs font-bold text-[#7A6000]">
                      -{EARLYBIRD_SAVE_PERCENT}%
                    </span>
                  </div>
                )}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black tracking-tight text-gray-900">
                    {price.display}
                  </span>
                  <span className="text-lg font-semibold text-gray-500">{price.unit}</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{price.note}</p>
              </div>

              <ul className="mt-7 space-y-3">
                {LANDING_PREMIUM_BULLETS.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#ffb35c]">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm leading-snug text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
              >
                Activează Premium acum
              </Link>
              <p className="mt-3 text-center text-xs text-gray-400">
                Continuă pe pagina de prețuri pentru checkout. Oferta de campanie e evidențiată până pe{" "}
                {EARLYBIRD_DEADLINE_LABEL}.
              </p>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}

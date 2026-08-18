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
      note: `Earlybird până pe ${EARLYBIRD_DEADLINE_LABEL}`,
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
  const isYear = interval === "year"

  return (
    <section id="pricing" className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <FadeInUp className="mb-6 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7C5CFC]">
            Ofertă earlybird
          </p>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            1 an de Premium, doar{" "}
            <span className="bg-gradient-to-r from-[#9a7bff] to-[#ffb56b] bg-clip-text text-transparent">
              {EARLYBIRD_YEARLY_RON} RON
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Prețul de campanie pentru tot anul — nu {FULL_YEARLY_RON} RON. Valabil până pe{" "}
            <strong className="text-gray-700">{EARLYBIRD_DEADLINE_LABEL}</strong>.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.08} className="mb-5 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-xl bg-[#F8F7FF] px-4 py-2.5 ring-1 ring-[#EBE8FF]">
            <span className="hidden items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 sm:inline-flex">
              <Clock className="h-3 w-3" />
              Expiră în
            </span>
            <div className="flex items-end gap-1.5">
              <CountdownUnit value={days} label="zile" size="sm" />
              <span className="mb-3 text-sm font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={hours} label="ore" size="sm" />
              <span className="mb-3 text-sm font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={minutes} label="min" size="sm" />
              <span className="mb-3 text-sm font-black text-[#7C5CFC]">:</span>
              <CountdownUnit value={seconds} label="sec" size="sm" />
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.12}>
          <div className="relative rounded-[22px] bg-gradient-to-br from-[#7aaeff] via-[#d39bff] to-[#ffb35c] p-[2px] shadow-[0_10px_28px_rgba(124,58,237,0.14)]">
            <div className="rounded-[20px] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  ✦ Premium anual
                </div>
                <div className="inline-flex rounded-full bg-gray-100 p-0.5">
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
                        "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors sm:px-3",
                        interval === opt.id
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {price.struck != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-400 line-through">
                      {price.struck} {price.unit}
                    </span>
                    <span className="rounded-full bg-[#FFE566] px-2 py-0.5 text-[11px] font-bold text-[#7A6000]">
                      -{EARLYBIRD_SAVE_PERCENT}% earlybird
                    </span>
                  </div>
                )}
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-gray-900 sm:text-[2.75rem]">
                    {price.display}
                  </span>
                  <span className="text-base font-semibold text-gray-500">{price.unit}</span>
                </div>
                {isYear ? (
                  <p className="mt-1 text-sm font-semibold text-[#7C5CFC]">
                    Doar {EARLYBIRD_YEARLY_RON} RON pentru tot anul — nu pe lună.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">{price.note}</p>
                )}
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {LANDING_PREMIUM_BULLETS.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#ffb35c]">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-xs leading-snug text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#c77bff] text-sm font-bold text-white shadow-[0_3px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110"
              >
                Ia earlybird-ul de {EARLYBIRD_YEARLY_RON} RON/an
              </Link>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  )
}

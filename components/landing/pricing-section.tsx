"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Clock } from "lucide-react"
import { FadeInUp } from "@/components/scroll-animations"
import { CountdownUnit } from "@/components/landing/countdown-unit"
import {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_SAVE_PERCENT,
  EARLYBIRD_YEARLY_RON,
  EARLYBIRD_YEARLY_SEATS_TOTAL,
  FULL_YEARLY_RON,
  LANDING_PREMIUM_BULLETS,
  earlybirdSeatsFomoCopy,
  remainingEarlybirdSeats,
  useCountdown,
  type CountdownState,
} from "@/lib/landing-campaign"
import {
  PREMIUM_MONTHLY_RON,
  PREMIUM_WEEKLY_RON,
} from "@/components/pricing/premium-pricing"
import {
  LAUNCH_20_DEADLINE_LABEL,
  LAUNCH_20_PERCENT,
  isLaunch20Active,
} from "@/lib/launch-20-discount"
import { getCampaignPriceRon } from "@/lib/pricing-campaign"
import { tiktokPixel } from "@/lib/tiktok-pixel"
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
    const launch20 = isLaunch20Active()
    return {
      display: getCampaignPriceRon("month"),
      struck: launch20 ? PREMIUM_MONTHLY_RON : null,
      unit: "RON/lună",
      note: launch20
        ? `Cupon −${LAUNCH_20_PERCENT}% până pe ${LAUNCH_20_DEADLINE_LABEL}`
        : "Facturare lunară",
    }
  }
  const launch20 = isLaunch20Active()
  return {
    display: getCampaignPriceRon("week"),
    struck: launch20 ? PREMIUM_WEEKLY_RON : null,
    unit: "RON/săptămână",
    note: launch20
      ? `Cupon −${LAUNCH_20_PERCENT}% până pe ${LAUNCH_20_DEADLINE_LABEL}`
      : "Ideal ca să testezi Premium",
  }
}

export function LandingPricingSection({ countdown }: { countdown?: CountdownState }) {
  const local = useCountdown()
  const { days, hours, minutes, seconds } = countdown ?? local
  const [interval, setBillingInterval] = useState<Interval>("year")
  const [earlybirdSeats, setEarlybirdSeats] = useState(remainingEarlybirdSeats)
  const price = priceFor(interval)
  const isYear = interval === "year"
  const weeklyFrom = getCampaignPriceRon("week")

  useEffect(() => {
    setEarlybirdSeats(remainingEarlybirdSeats())
  }, [])

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
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Prima meditație e gratuită. Apoi abonamentul începe de la{" "}
            <strong className="text-gray-700">{weeklyFrom} RON/săptămână</strong>. Până pe{" "}
            <strong className="text-gray-700">{EARLYBIRD_DEADLINE_LABEL}</strong> poți beneficia de{" "}
            <strong className="text-gray-700">{EARLYBIRD_SAVE_PERCENT}% reducere</strong> la
            abonamentul Premium.
          </p>
          {earlybirdSeats > 0 ? (
            <div className="mx-auto mt-4 max-w-sm rounded-xl border border-orange-200 bg-[#FFF7ED] px-3.5 py-2.5 text-left">
              <p className="text-sm font-bold text-orange-800">
                {earlybirdSeatsFomoCopy(earlybirdSeats)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                  style={{
                    width: `${Math.max(
                      8,
                      (earlybirdSeats / EARLYBIRD_YEARLY_SEATS_TOTAL) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
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
                      onClick={() => {
                        setBillingInterval(opt.id)
                        const next = priceFor(opt.id)
                        tiktokPixel.trackCustomizeProduct({
                          contents: [
                            {
                              content_id: opt.id === "year" ? "premium_year_earlybird" : `premium_${opt.id}`,
                              content_type: "product",
                              content_name:
                                opt.id === "year"
                                  ? "Planck Premium anual earlybird"
                                  : opt.id === "month"
                                    ? "Planck Premium lunar"
                                    : "Planck Premium săptămânal",
                            },
                          ],
                          value: next.display,
                          currency: "RON",
                        })
                      }}
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
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        isYear
                          ? "bg-[#FFE566] text-[#7A6000]"
                          : "bg-[#dcfce7] text-[#166534]",
                      )}
                    >
                      {isYear
                        ? `−${EARLYBIRD_SAVE_PERCENT}% earlybird`
                        : `−${LAUNCH_20_PERCENT}% până pe ${LAUNCH_20_DEADLINE_LABEL}`}
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

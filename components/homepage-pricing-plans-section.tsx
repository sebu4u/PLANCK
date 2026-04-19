"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { FadeInUp } from "@/components/scroll-animations"

type PlanConfig = {
  id: "free" | "plus" | "premium"
  promo: string
  name: string
  tagline: string
  highlighted: boolean
  showValueBadge?: boolean
  priceDisplay: ReactNode
  billingNote?: string
  features: ReactNode[]
  ctaHref: string
  ctaLabel: string
}

function plans(): PlanConfig[] {
  return [
    {
      id: "free",
      promo: "Începe fără card",
      name: "Free",
      tagline: "Intră în platformă și încearcă Insight",
      highlighted: false,
      priceDisplay: (
        <span className="text-4xl font-bold tracking-tight text-gray-900 tabular-nums">Gratuit</span>
      ),
      billingNote: "Fără card. Poți face upgrade oricând.",
      features: [
        <>
          Probleme de fizică, cursuri și materiale pentru{" "}
          <span className="font-semibold rounded px-1 py-0.5 bg-[#EBE8FF]/70">BAC</span> și concursuri
        </>,
        <>
          Insight:{" "}
          <span className="font-semibold rounded px-1 py-0.5 bg-[#EBE8FF]/70">3</span> prompt-uri
          gratuite pe zi
        </>,
        <>Acces limitat la încărcare fișiere și la roadmaps</>,
        <>PlanckCode nelimitat și extra-uri Premium — nu sunt incluse</>,
      ],
      ctaHref: "/register",
      ctaLabel: "Creează cont gratuit",
    },
    {
      id: "plus",
      promo: "Cel mai bun raport preț–rezultate",
      name: "Plus+",
      tagline: "Insight și materiale pentru un an întreg de pregătire",
      highlighted: true,
      showValueBadge: true,
      priceDisplay: (
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm text-gray-400 line-through tabular-nums">49 RON/lună</span>
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span className="text-lg font-semibold text-gray-900 align-super">RON</span>
            <span className="text-4xl font-bold tracking-tight text-gray-900 tabular-nums">29</span>
            <span className="text-base font-medium text-gray-600">/lună</span>
          </div>
        </div>
      ),
      billingNote: "Facturare lunară. Anulezi oricând din cont.",
      features: [
        <>Tot ce include planul Free</>,
        <>
          <span className="font-semibold rounded px-1 py-0.5 bg-[#EBE8FF]/70">800</span> prompt-uri
          Insight pe lună;{" "}
          <span className="font-semibold rounded px-1 py-0.5 bg-[#EBE8FF]/70">10</span> fișiere
          încărcate pe zi
        </>,
        <>Roadmaps complete, toate modelele Insight, memorie îmbunătățită</>,
        <>
          PlanckCode nelimitat — disponibil la{" "}
          <span className="font-semibold rounded px-1 py-0.5 bg-[#EBE8FF]/70">Premium</span>
        </>,
      ],
      ctaHref: "/pricing?plan=plus",
      ctaLabel: "Abonează-te la Plus+",
    },
    {
      id: "premium",
      promo: "Pregătire fără limite",
      name: "Premium",
      tagline: "Insight și PlanckCode fără compromisuri",
      highlighted: false,
      priceDisplay: (
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm text-gray-400 line-through tabular-nums">99 RON/lună</span>
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span className="text-lg font-semibold text-gray-900 align-super">RON</span>
            <span className="text-4xl font-bold tracking-tight text-gray-900 tabular-nums">59</span>
            <span className="text-base font-medium text-gray-600">/lună</span>
          </div>
        </div>
      ),
      billingNote: "Facturare lunară. Anulezi oricând din cont.",
      features: [
        <>Tot ce include planul Plus+</>,
        <>Prompt-uri Insight nelimitate</>,
        <>
          <span className="font-semibold rounded px-1 py-0.5 bg-[#EBE8FF]/70">PlanckCode</span> nelimitat
          pentru probleme de informatică
        </>,
        <>Pregătire pentru olimpiadă, admitere și concursuri</>,
      ],
      ctaHref: "/pricing?plan=premium",
      ctaLabel: "Abonează-te la Premium",
    },
  ]
}

export function HomepagePricingPlansSection() {
  const planList = plans()

  return (
    <section
      id="home-pricing"
      className="w-full bg-[#eef0f4] py-20 md:py-24"
      aria-labelledby="home-pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <FadeInUp className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <h2
            id="home-pricing-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 md:text-5xl"
          >
            Ce poți să descoperi
          </h2>
          <p className="mt-4 text-lg text-gray-600 md:text-xl">
            Alege nivelul care ți se potrivește — poți crește oricând la Plus+ sau Premium.
          </p>
        </FadeInUp>

        <div className="grid gap-8 md:grid-cols-3 md:gap-6 md:items-stretch">
          {planList.map((plan, index) => (
            <FadeInUp key={plan.id} delay={index * 0.08} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/5 transition-transform duration-300",
                  plan.highlighted &&
                    "z-[1] md:-translate-y-3 md:scale-[1.03] md:shadow-[0_22px_55px_rgba(124,92,252,0.22)] md:ring-2 md:ring-[#7C5CFC]"
                )}
              >
                <div className="rounded-t-[18px] bg-[#EBE8FF] px-4 py-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5B47D6] sm:text-sm">
                    {plan.promo}
                  </p>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-6 pt-6 sm:px-6">
                  {plan.showValueBadge && (
                    <div className="mb-3 flex justify-center">
                      <span
                        className="-rotate-6 rounded-md bg-[#FFE566] px-3 py-1 text-xs font-bold text-gray-900 shadow-sm sm:text-sm"
                        aria-hidden
                      >
                        10X value
                      </span>
                    </div>
                  )}

                  <div className={cn("text-center", !plan.showValueBadge && "pt-1")}>
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">{plan.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{plan.tagline}</p>
                  </div>

                  <div className="mt-6 border-b border-gray-100 pb-6">{plan.priceDisplay}</div>
                  {plan.billingNote && (
                    <p className="mt-2 text-xs leading-snug text-gray-500">{plan.billingNote}</p>
                  )}

                  <ul className="mt-6 flex flex-1 flex-col gap-3 text-left text-sm text-gray-800 sm:text-[15px]">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EBE8FF]"
                          aria-hidden
                        >
                          <Check className="h-3 w-3 text-[#7C5CFC]" strokeWidth={3} />
                        </span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href={plan.ctaHref}
                      className={cn(
                        "flex min-h-[48px] w-full items-center justify-center rounded-lg px-4 text-center text-sm font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C5CFC]",
                        "bg-[#7C5CFC]"
                      )}
                    >
                      {plan.ctaLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  )
}

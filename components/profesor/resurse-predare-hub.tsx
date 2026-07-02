"use client"

import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import {
  getProfesorResurseCardCountLabel,
  PROFESOR_RESURSE_CARDS,
  type ProfesorResurseCardConfig,
} from "@/lib/profesor-resurse-config"
import type { ExerseazaCounts } from "@/lib/exerseaza-counts"

interface ResursePredareHubProps {
  counts: ExerseazaCounts
}

function CardImageArea({ card }: { card: ProfesorResurseCardConfig }) {
  const Icon = card.icon

  return (
    <div
      className={cn(
        "relative flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-br sm:h-44 lg:h-48",
        card.imageGradient,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      <Icon className="relative h-14 w-14 text-white/90 drop-shadow-sm sm:h-16 sm:w-16" strokeWidth={1.5} />
    </div>
  )
}

function MobileCard({
  card,
  countLabel,
}: {
  card: ProfesorResurseCardConfig
  countLabel: string
}) {
  const inner = (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_-12px_rgba(11,12,15,0.25)] transition-transform active:scale-[0.99]">
      <CardImageArea card={card} />
      <div className="bg-white px-4 py-3.5">
        <h2 className="text-base font-bold text-[#0b0c0f]">{card.title}</h2>
        <p className="mt-0.5 text-sm text-[#2c2f33]/70">{countLabel}</p>
      </div>
    </article>
  )

  if (card.comingSoon || !card.href) {
    return (
      <div className="relative opacity-80" aria-disabled>
        {inner}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2c2f33]">
          <Clock className="h-3 w-3" />
          În curând
        </span>
      </div>
    )
  }

  return (
    <Link href={card.href} className="block">
      {inner}
    </Link>
  )
}

function DesktopCard({
  card,
  countLabel,
}: {
  card: ProfesorResurseCardConfig
  countLabel: string
}) {
  const Icon = card.icon

  const content = (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0b0c0f]/10 bg-white shadow-[0_8px_30px_-18px_rgba(11,12,15,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0b0c0f]/18",
        card.comingSoon && "opacity-75",
      )}
    >
      <CardImageArea card={card} />
      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0b0c0f]">{card.title}</h2>
            <p className="mt-0.5 text-sm font-medium text-[#2c2f33]/65">{card.subtitle}</p>
          </div>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f4f2] text-[#2c2f33]">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[#2c2f33]/75">{card.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-[#0b0c0f]/8 pt-4">
          <span className="text-sm font-semibold text-[#2c2f33]">{countLabel}</span>
          {card.comingSoon ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#2c2f33]/55">
              <Clock className="h-3.5 w-3.5" />
              În curând
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition-colors group-hover:text-violet-900">
              Deschide
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </article>
  )

  if (card.comingSoon || !card.href) {
    return content
  }

  return (
    <Link href={card.href} className="block h-full">
      {content}
    </Link>
  )
}

export function ResursePredareHub({ counts }: ResursePredareHubProps) {
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
      <div
        className={cn(
          "catalog-problems-scroll h-full overflow-y-auto bg-[#f5f4f2]",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
          "burger:pb-12",
        )}
      >
        <div className="mx-auto max-w-5xl space-y-6 px-5 pb-12 pt-6 sm:px-8 lg:px-10 lg:pt-10">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-[#0b0c0f] sm:text-4xl">Resurse de predare</h1>
            <p className="text-sm text-[#2c2f33]/75 sm:text-base">
              Alege materialele pe care vrei să le explorezi sau să le recomanzi elevilor.
            </p>
          </header>

          <div className="flex flex-col gap-4 lg:hidden">
            {PROFESOR_RESURSE_CARDS.map((card) => (
              <MobileCard
                key={card.id}
                card={card}
                countLabel={getProfesorResurseCardCountLabel(card, counts)}
              />
            ))}
          </div>

          <div className="hidden gap-5 lg:grid lg:grid-cols-2">
            {PROFESOR_RESURSE_CARDS.map((card) => (
              <DesktopCard
                key={card.id}
                card={card}
                countLabel={getProfesorResurseCardCountLabel(card, counts)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

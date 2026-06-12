"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import {
  EXERSEAZA_CARDS,
  formatExerseazaCount,
  type ExerseazaCardConfig,
  type ExerseazaSubjectId,
} from "@/lib/exerseaza-config"
import type { ExerseazaCounts } from "@/lib/exerseaza-counts"
import { fetchFlashcardDeck } from "@/lib/learning-path-flashcard-client"
import { ExerseazaSubjectSelector } from "@/components/exerseaza/exerseaza-subject-selector"

interface ExerseazaHubProps {
  counts: ExerseazaCounts
}

function getCardCountLabel(
  card: ExerseazaCardConfig,
  counts: ExerseazaCounts,
  flashcardCount: number | null,
): string {
  switch (card.id) {
    case "exercitii":
      return formatExerseazaCount(counts.exercises, "problemă", "probleme")
    case "grile":
      return formatExerseazaCount(counts.grile, "grilă", "grile")
    case "teste":
      return "În curând"
    case "flashcard":
      if (flashcardCount == null) return "Se încarcă..."
      return formatExerseazaCount(flashcardCount, "card", "carduri")
    default:
      return ""
  }
}

function CardImageArea({ card }: { card: ExerseazaCardConfig }) {
  const Icon = card.icon

  if (card.imageSrc) {
    return (
      <div className="relative h-40 w-full overflow-hidden sm:h-44 lg:h-48">
        <Image
          src={card.imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    )
  }

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
  card: ExerseazaCardConfig
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
  card: ExerseazaCardConfig
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

function SidebarNav({
  counts,
  flashcardCount,
}: {
  counts: ExerseazaCounts
  flashcardCount: number | null
}) {
  return (
    <nav className="space-y-1" aria-label="Tipuri de exerciții">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/55">
        Alege modul
      </p>
      {EXERSEAZA_CARDS.map((card) => {
        const Icon = card.icon
        const countLabel = getCardCountLabel(card, counts, flashcardCount)
        const itemClassName =
          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[#2c2f33]/80 transition-colors hover:bg-[#faf9f7] hover:text-[#0b0c0f]"

        if (card.comingSoon || !card.href) {
          return (
            <button
              key={card.id}
              type="button"
              disabled
              className={cn(itemClassName, "cursor-not-allowed opacity-60 hover:bg-transparent")}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f4f2]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{card.title}</span>
                <span className="block truncate text-xs text-[#2c2f33]/60">{countLabel}</span>
              </span>
            </button>
          )
        }

        return (
          <Link key={card.id} href={card.href} className={itemClassName}>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f4f2]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{card.title}</span>
              <span className="block truncate text-xs text-[#2c2f33]/60">{countLabel}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function ExerseazaHub({ counts }: ExerseazaHubProps) {
  const { user, loading: authLoading } = useAuth()
  const [selectedSubjectId, setSelectedSubjectId] = useState<ExerseazaSubjectId>("fizica")
  const [flashcardCount, setFlashcardCount] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user?.id) {
      setFlashcardCount(0)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const data = await fetchFlashcardDeck()
        if (cancelled) return
        const cards = Array.isArray(data.cards) ? data.cards : []
        setFlashcardCount(cards.length)
      } catch {
        if (!cancelled) setFlashcardCount(0)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.id])

  return (
    <div className="flex h-full min-h-0 flex-row">
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[300px] bg-white lg:block">
        <div className="catalog-sidebar-scroll h-full overflow-y-auto px-5 py-5">
          <SidebarNav counts={counts} flashcardCount={flashcardCount} />
          <div className="mt-8 rounded-xl border border-[#0b0c0f]/8 bg-[#faf9f7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/55">
              Rezumat
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[#2c2f33]/80">
              <li className="flex justify-between gap-2">
                <span>Probleme</span>
                <span className="font-semibold text-[#0b0c0f]">{counts.exercises}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Grile</span>
                <span className="font-semibold text-[#0b0c0f]">{counts.grile}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Flashcard-uri tale</span>
                <span className="font-semibold text-[#0b0c0f]">
                  {flashcardCount == null ? "—" : flashcardCount}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1 lg:ml-[300px] h-full">
        <div className="absolute inset-0 top-0 overflow-hidden bg-white lg:inset-[3px] lg:rounded-xl lg:bg-[#f5f4f2]">
          <div
            className={cn(
              "catalog-problems-scroll h-full overflow-y-auto",
              MOBILE_BOTTOM_NAV_PADDING_CLASS,
              "burger:pb-12",
            )}
          >
            <div className="space-y-6 px-5 pb-12 -mt-3 pt-0 burger:mt-0 sm:px-8 lg:px-10 lg:pt-10 xl:px-12">
              <header className="hidden space-y-2 lg:block">
                <h1 className="text-3xl font-bold text-[#0b0c0f] sm:text-4xl">Exersează</h1>
                <p className="text-sm text-[#2c2f33]/75 sm:text-base">
                  Alege cum vrei să exersezi: probleme, grile, teste sau flashcard-uri.
                </p>
              </header>

              <ExerseazaSubjectSelector
                selectedId={selectedSubjectId}
                onSelect={setSelectedSubjectId}
              />

              {/* Mobile: vertical cards */}
              <div className="flex flex-col gap-4 lg:hidden">
                {EXERSEAZA_CARDS.map((card) => (
                  <MobileCard
                    key={card.id}
                    card={card}
                    countLabel={getCardCountLabel(card, counts, flashcardCount)}
                  />
                ))}
              </div>

              {/* Desktop: 2x2 grid */}
              <div className="hidden gap-5 lg:grid lg:grid-cols-2">
                {EXERSEAZA_CARDS.map((card) => (
                  <DesktopCard
                    key={card.id}
                    card={card}
                    countLabel={getCardCountLabel(card, counts, flashcardCount)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

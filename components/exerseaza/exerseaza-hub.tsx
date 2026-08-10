"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  Library,
  Video,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { PracticeSubjectSwitcher } from "@/components/exerseaza/practice-subject-switcher"
import { ExerseazaPregatireCta } from "@/components/exerseaza/exerseaza-pregatire-cta"
import { ExerseazaPregatirePromoCard } from "@/components/exerseaza/exerseaza-pregatire-promo-card"
import { ExerseazaMonthCalendar } from "@/components/exerseaza/exerseaza-month-calendar"
import { ExerseazaWeekCalendar } from "@/components/exerseaza/exerseaza-week-calendar"
import { ExerseazaTemePanel } from "@/components/exerseaza/exerseaza-teme-panel"
import { ExerseazaCursuriVideoPanel } from "@/components/exerseaza/exerseaza-cursuri-video-panel"
import {
  EXERSEAZA_CARDS,
  formatExerseazaCount,
  type ExerseazaCardConfig,
  type ExerseazaCardId,
} from "@/lib/exerseaza-config"
import type { ExerseazaCounts } from "@/lib/exerseaza-counts"
import type { UserAssignmentListItem } from "@/lib/classrooms/types"
import { fetchFlashcardDeck } from "@/lib/learning-path-flashcard-client"
import { CatalogDesktopSidebarDiscountOfferCard } from "@/components/catalog/catalog-desktop-sidebar-discount-offer-card"
import { ExerseazaSidebarGradeChart } from "@/components/exerseaza/exerseaza-sidebar-grade-chart"

type ExerseazaDesktopTab = "biblioteca" | "teme" | "cursuri-video"

const DESKTOP_TABS: {
  id: ExerseazaDesktopTab
  label: string
  description: string
  icon: typeof Library
}[] = [
  {
    id: "biblioteca",
    label: "Biblioteca",
    description: "Exerciții, grile, teste",
    icon: Library,
  },
  {
    id: "teme",
    label: "Teme",
    description: "Din clasele tale",
    icon: BookOpen,
  },
  {
    id: "cursuri-video",
    label: "Cursuri video",
    description: "Înregistrări salvate",
    icon: Video,
  },
]

interface ExerseazaHubProps {
  counts: ExerseazaCounts
  assignments?: UserAssignmentListItem[]
}

const MOBILE_CARD_ACCENTS: Record<
  ExerseazaCardId,
  { iconBg: string; iconColor: string; titleColor: string }
> = {
  exercitii: {
    iconBg: "bg-[#dbeafe]",
    iconColor: "text-[#1d4ed8]",
    titleColor: "text-[#2563eb]",
  },
  grile: {
    iconBg: "bg-[#ffedd5]",
    iconColor: "text-[#c2410c]",
    titleColor: "text-[#c2410c]",
  },
  teste: {
    iconBg: "bg-[#fef3c7]",
    iconColor: "text-[#b45309]",
    titleColor: "text-[#92400e]",
  },
  flashcard: {
    iconBg: "bg-[#d1fae5]",
    iconColor: "text-[#047857]",
    titleColor: "text-[#0f766e]",
  },
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
      return formatExerseazaCount(counts.teste, "test", "teste")
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
      <div className="relative h-28 w-full overflow-hidden">
        <Image
          src={card.imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 50vw, 25vw"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        card.imageGradient,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      <Icon className="relative h-12 w-12 text-white/90 drop-shadow-sm" strokeWidth={1.5} />
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
  const Icon = card.icon
  const accent = MOBILE_CARD_ACCENTS[card.id]

  const inner = (
    <article className="flex items-center gap-3 rounded-2xl border-2 border-[#e5e5e5] bg-white px-3.5 py-3.5 transition-transform active:scale-[0.99]">
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          accent.iconBg,
          accent.iconColor,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className={cn("text-base font-bold", accent.titleColor)}>{card.title}</h2>
        <p className="mt-0.5 text-sm text-[#9aa0a6]">{countLabel}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#c4c7cc]" aria-hidden />
    </article>
  )

  if (card.comingSoon || !card.href) {
    return (
      <div className="relative opacity-80" aria-disabled>
        {inner}
        <span className="absolute right-10 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2c2f33]">
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
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white transition-colors duration-200 hover:border-[#d4d4d4]",
        card.comingSoon && "opacity-75",
      )}
    >
      <CardImageArea card={card} />
      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#0b0c0f]">{card.title}</h2>
            <p className="mt-0.5 text-xs font-medium text-[#2c2f33]/65">{card.subtitle}</p>
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f4f2] text-[#2c2f33]">
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-snug text-[#2c2f33]/75">{card.description}</p>
        <div className="mt-3 flex items-center justify-between border-t border-[#0b0c0f]/8 pt-3">
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

function SidebarTabs({
  activeTab,
  onChange,
  temeCount,
}: {
  activeTab: ExerseazaDesktopTab
  onChange: (tab: ExerseazaDesktopTab) => void
  temeCount: number
}) {
  return (
    <nav className="space-y-1" aria-label="Secțiuni Exersează">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/55">
        Navigare
      </p>
      {DESKTOP_TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
              isActive
                ? "bg-[#f5f4f2] text-[#0b0c0f]"
                : "text-[#2c2f33]/80 hover:bg-[#faf9f7] hover:text-[#0b0c0f]",
            )}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                isActive ? "bg-white text-[#0b0c0f]" : "bg-[#f5f4f2] text-[#2c2f33]",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="block text-sm font-semibold">{tab.label}</span>
                {tab.id === "teme" && temeCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#0b0c0f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {temeCount}
                  </span>
                ) : null}
              </span>
              <span className="block truncate text-xs text-[#2c2f33]/60">{tab.description}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

function BibliotecaPanel({
  counts,
  flashcardCount,
}: {
  counts: ExerseazaCounts
  flashcardCount: number | null
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[#0b0c0f] sm:text-4xl">Exersează</h1>
        <p className="text-sm text-[#2c2f33]/75 sm:text-base">
          Alege cum vrei să exersezi: probleme, grile, teste sau flashcard-uri.
        </p>
      </header>

      <PracticeSubjectSwitcher currentSubject="fizica" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <div className="grid grid-cols-2 gap-3 xl:gap-4">
          {EXERSEAZA_CARDS.map((card) => (
            <DesktopCard
              key={card.id}
              card={card}
              countLabel={getCardCountLabel(card, counts, flashcardCount)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <ExerseazaPregatirePromoCard />
          <ExerseazaMonthCalendar />
        </div>
      </div>
    </div>
  )
}

export function ExerseazaHub({ counts, assignments = [] }: ExerseazaHubProps) {
  const { user, loading: authLoading } = useAuth()
  const [flashcardCount, setFlashcardCount] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<ExerseazaDesktopTab>("biblioteca")

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
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[260px] flex-col bg-white lg:flex">
        <div className="catalog-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <SidebarTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            temeCount={assignments.length}
          />
        </div>
        <ExerseazaSidebarGradeChart />
        <CatalogDesktopSidebarDiscountOfferCard />
      </aside>

      <div className="relative min-w-0 flex-1 lg:ml-[260px] h-full">
        <div className="absolute inset-0 top-0 overflow-hidden bg-[#f5f4f2] lg:inset-[3px] lg:rounded-xl lg:bg-[#f5f4f2]">
          <div
            className={cn(
              "catalog-problems-scroll h-full overflow-y-auto",
              MOBILE_BOTTOM_NAV_PADDING_CLASS,
              "burger:pb-12",
            )}
          >
            {/* Mobile layout */}
            <div className="space-y-4 px-5 pb-12 pt-5 burger:mt-0 sm:px-8 lg:hidden">
              <h1 className="text-2xl font-bold tracking-tight text-[#2c2f33]">Exersează</h1>
              <ExerseazaPregatireCta />
              <ExerseazaWeekCalendar />
              <div className="flex flex-col gap-3 pt-1">
                {EXERSEAZA_CARDS.map((card) => (
                  <MobileCard
                    key={card.id}
                    card={card}
                    countLabel={getCardCountLabel(card, counts, flashcardCount)}
                  />
                ))}
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden px-5 pb-12 pt-0 sm:px-8 lg:block lg:px-10 lg:pt-10 xl:px-12">
              {activeTab === "biblioteca" ? (
                <BibliotecaPanel counts={counts} flashcardCount={flashcardCount} />
              ) : null}
              {activeTab === "teme" ? <ExerseazaTemePanel assignments={assignments} /> : null}
              {activeTab === "cursuri-video" ? <ExerseazaCursuriVideoPanel /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

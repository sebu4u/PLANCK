import { Fragment } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatFizicaSimulationDate,
  type FizicaHubCard,
  type FizicaHubCardsData,
} from "@/lib/supabase-fizica-simulations"

interface FizicaSimulationCardsProps {
  preparations: FizicaHubCard[]
  nextSimulation: FizicaHubCard | null
  overlay?: boolean
}

function TextItem({ card, isSimulation }: { card: FizicaHubCard; isSimulation: boolean }) {
  return (
    <article className="flex min-w-0 flex-1 flex-col items-center px-1 sm:px-2">
      {isSimulation ? (
        <span className="mb-1 inline-flex w-fit items-center gap-0.5 rounded-full bg-[#ffc800] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3d2800]">
          <Sparkles className="h-2.5 w-2.5" aria-hidden />
          Sim
        </span>
      ) : null}
      <p
        className="w-full text-center text-[11px] font-bold uppercase leading-tight tracking-wide sm:text-xs"
        style={{ color: card.tema_culoare }}
      >
        {card.tema}
      </p>
      <p className="mt-1 w-full text-center text-[11px] leading-snug sm:text-xs">
        <span
          className={cn(
            "block font-medium",
            isSimulation ? "font-semibold text-[#0b0c0f]" : "text-[#2c2f33]/75",
          )}
        >
          {card.nume}
        </span>
        <span className="text-[#9ca3af]">{formatFizicaSimulationDate(card.data)}</span>
      </p>
    </article>
  )
}

export function FizicaSimulationCards({
  preparations,
  nextSimulation,
  overlay = false,
}: FizicaSimulationCardsProps) {
  const items: Array<{ key: string; kind: "pregatire" | "simulare"; card: FizicaHubCard }> = [
    ...preparations.map((card) => ({ key: card.id, kind: "pregatire" as const, card })),
    ...(nextSimulation
      ? [{ key: nextSimulation.id, kind: "simulare" as const, card: nextSimulation }]
      : []),
  ]

  if (items.length === 0) return null

  return (
    <section
      className={cn("w-full max-w-3xl", !overlay && "mb-6 lg:mb-8")}
      aria-label="Pregătiri și simulări fizică"
    >
      <div className="rounded-2xl border border-[#0b0c0f]/8 bg-white px-3 py-3 shadow-[0_4px_24px_-8px_rgba(11,12,15,0.18)] sm:px-5 sm:py-4">
        <div className="flex items-start gap-1 sm:gap-2">
          {items.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 ? (
                <div className="flex shrink-0 items-center justify-center self-center px-0.5 sm:px-1">
                  <ArrowRight
                    className="h-3.5 w-3.5 text-[#3d6fa8]/70 sm:h-4 sm:w-4"
                    aria-hidden
                  />
                </div>
              ) : null}
              <TextItem card={item.card} isSimulation={item.kind === "simulare"} />
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

export type { FizicaHubCardsData }

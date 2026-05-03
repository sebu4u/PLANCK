import Link from "next/link"
import type { CSSProperties } from "react"
import { Fragment } from "react"
import { Check, X } from "lucide-react"

interface PremiumComparisonContentProps {
  ctaHref?: string
  ctaLabel?: string
}

interface BenefitRow {
  label: string
  free: boolean
  premium: boolean
}

const BENEFITS: BenefitRow[] = [
  { label: "Lecție zilnică", free: true, premium: true },
  { label: "Învățare nelimitată", free: false, premium: true },
  { label: "Suport tutor complet", free: false, premium: true },
  { label: "Fără reclame", free: false, premium: true },
  { label: "Sari înainte și practică personalizată", free: false, premium: true },
]

/** Gradient text ca la outline-ul Go Premium din navbar (titlul principal). */
const premiumWordGradientClass =
  "bg-gradient-to-r from-[#9a7bff] via-[#d77bff] to-[#ffb56b] bg-clip-text text-transparent"

/** Bifa din cardul alb interior: cerc piersică, bifă închisă — ca în mockup. */
function PremiumInnerCheckIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8c8] shadow-[0_2px_6px_rgba(0,0,0,0.09),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/[0.04] sm:h-9 sm:w-9 sm:shadow-[0_3px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.95)]">
      <Check className="h-4 w-4 text-[#141026] sm:h-[18px] sm:w-[18px]" strokeWidth={3} />
    </span>
  )
}

function CheckIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#fcb360] to-[#f59e3a] text-white shadow-[0_3px_8px_rgba(245,158,58,0.32)] sm:h-7 sm:w-7 sm:shadow-[0_4px_10px_rgba(245,158,58,0.35)]">
      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
    </span>
  )
}

function CrossIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#4a4a52] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-7 sm:w-7">
      <X className="h-3.5 w-3.5 shrink-0 text-white sm:h-4 sm:w-4" strokeWidth={3} aria-hidden />
    </span>
  )
}

export function PremiumComparisonContent({
  ctaHref = "/pricing",
  ctaLabel = "Începe acum",
}: PremiumComparisonContentProps) {
  return (
    <div className="flex w-full min-w-0 max-w-2xl flex-col items-center text-center">
      <h2 className="text-3xl font-bold leading-tight text-[#111111] sm:text-4xl md:text-5xl">
        Avansează cu{" "}
        <span className={premiumWordGradientClass}>Premium</span>
      </h2>

      <div className="mt-6 w-full min-w-0 sm:mt-10">
        <div className="mx-auto grid w-full min-w-0 max-w-xl grid-cols-[minmax(0,1fr)_auto_auto] grid-rows-[auto_repeat(5,minmax(2.5rem,auto))] items-stretch gap-x-0.5 sm:grid-rows-[auto_repeat(5,minmax(2.75rem,auto))] sm:gap-x-8">
          <div className="col-start-1 row-start-1 flex min-w-0 items-end pb-2 pt-0.5 text-left text-sm font-semibold text-[#111111] sm:pb-3 sm:pt-1 sm:text-base">
            Beneficii
          </div>
          <div className="col-start-2 row-start-1 flex items-end justify-center pb-2 pt-0.5 text-center text-sm font-semibold text-[#6f6f6f] sm:pb-3 sm:pt-1 sm:text-base">
            Free
          </div>

          {/* Coloana Premium: cadru gradient; ml-1 pe mobil = aer între Free și Premium; sm:-ml aliniază cu Free */}
          <div className="relative col-start-3 ml-1 grid grid-rows-subgrid overflow-hidden rounded-[18px] sm:-ml-5 sm:rounded-[26px] [grid-row:1/-1]">
            {/* Gradient orizontal: mov stânga → portocaliu dreapta */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              aria-hidden
              style={{
                background: "linear-gradient(90deg, #7c5cff 0%, #9a7bff 28%, #c77bff 52%, #ffb56b 100%)",
              }}
            />

            {/* Candy gloss */}
            <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]" aria-hidden>
              <div className="absolute inset-0 bg-[linear-gradient(155deg,transparent_35%,rgba(255,255,255,0.22)_48%,rgba(255,255,255,0.38)_52%,transparent_65%)]" />
              <div className="absolute -right-[15%] -top-[20%] h-[55%] w-[70%] rounded-full bg-white/35 blur-3xl" />
              <div className="absolute -left-[25%] top-[5%] h-[45%] w-[55%] rounded-full bg-white/18 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/45 via-white/12 to-transparent" />
              <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]" />
            </div>

            {/* Titlu pe zona gradient (nu pe cardul alb). */}
            <div className="relative z-[2] row-start-1 flex items-end justify-center px-2 pb-2 pt-3 sm:px-4 sm:pb-3 sm:pt-5">
              <span className="text-lg font-bold tracking-tight text-[#141026] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-xl">
                Premium
              </span>
            </div>

            {/* Card alb cu subgrid: fiecare rând are aceeași înălțime ca Beneficii / Free */}
            <div className="relative z-[2] mx-1.5 mb-3 mt-0 grid grid-rows-subgrid overflow-hidden rounded-xl bg-white px-0.5 row-[2/span_5] sm:mx-3 sm:mb-4 sm:rounded-2xl sm:px-1">
              {BENEFITS.map((row, index) => (
                <div
                  key={`inner-${row.label}`}
                  style={{ gridRowStart: index + 1 }}
                  className={`flex items-center justify-center ${index > 0 ? "border-t border-[#ececec]" : ""}`}
                >
                  {row.premium ? <PremiumInnerCheckIcon /> : <CrossIcon />}
                </div>
              ))}
            </div>
          </div>

          {BENEFITS.map((row, index) => (
            <Fragment key={row.label}>
              <div
                style={{ gridRowStart: index + 2 }}
                className={`col-start-1 flex min-w-0 items-center break-words py-2 text-left text-base leading-snug text-[#1f1f1f] sm:py-3 sm:text-[15px] ${index > 0 ? "border-t border-[#ececec]/90" : ""}`}
              >
                {row.label}
              </div>
              <div
                style={{ gridRowStart: index + 2 }}
                className={`col-start-2 flex items-center justify-center py-2 sm:py-3 ${index > 0 ? "border-t border-[#ececec]/90" : ""}`}
              >
                {row.free ? <CheckIcon /> : <CrossIcon />}
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <Link
        href={ctaHref}
        className="dashboard-start-glow mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#383838] px-4 py-3 text-base font-semibold text-white shadow-[0_4px_0_#282828] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#282828] active:translate-y-1 active:shadow-[0_1px_0_#282828] sm:mt-10"
        style={{ "--start-glow-tint": "rgba(255, 255, 255, 0.38)" } as CSSProperties}
      >
        <span className="relative z-[1] inline-flex items-center justify-center">{ctaLabel}</span>
      </Link>
    </div>
  )
}

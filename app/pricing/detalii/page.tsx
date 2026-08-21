import Link from "next/link"
import { Check, Minus, X } from "lucide-react"
import type { Metadata } from "next"
import { PRICING_PLAN_FEATURES } from "@/components/pricing/pricing-plan-features"
import {
  PREMIUM_MONTHLY_RON,
  PREMIUM_WEEKLY_RON,
  PREMIUM_YEARLY_RON,
  PREMIUM_YEARLY_SAVE_PERCENT,
} from "@/components/pricing/premium-pricing"
import { EARLYBIRD_YEARLY_RON, isEarlybirdActive } from "@/lib/landing-earlybird"
import { isLaunch20Active, LAUNCH_20_PERCENT } from "@/lib/launch-20-discount"
import { getCampaignPriceRon } from "@/lib/pricing-campaign"

export const metadata: Metadata = {
  title: "Detalii abonament Premium | PLANCK",
  description:
    "Compară planul gratuit cu Premium: trasee, Insight 2.5, workshop-uri și PlanckPass.",
  alternates: {
    canonical: "/pricing/detalii",
  },
  robots: {
    index: true,
    follow: true,
  },
}

type ComparisonRow = {
  label: string
  free: boolean | string
  premium: boolean | string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Probleme și materiale BAC", free: "Acces limitat", premium: true },
  { label: "Trasee de învățare complete", free: false, premium: true },
  { label: "Trasee personalizate Insight 2.5", free: false, premium: true },
  { label: "Tutor AI Insight 2.5", free: "Câteva prompt-uri/zi", premium: "Fără limite" },
  { label: "Workshop-uri săptămânale", free: false, premium: "2–3 incluse" },
  { label: "PlanckPass", free: false, premium: "Acces complet" },
  {
    label: "Materii",
    free: "Acces parțial",
    premium: "Fizică, Mate, Info, Biologie",
  },
]

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-5 w-5 text-emerald-600" strokeWidth={2.5} aria-label="Inclus" />
  }
  if (value === false) {
    return <Minus className="mx-auto h-5 w-5 text-gray-300" aria-label="Neinclus" />
  }
  return <span className="text-sm text-gray-700">{value}</span>
}

export default function PricingDetailsPage() {
  const freeFeatures = PRICING_PLAN_FEATURES.free
  const premiumFeatures = PRICING_PLAN_FEATURES.premium

  return (
    <div className="relative min-h-[100dvh] bg-white text-gray-900">
      <div className="fixed inset-0 -z-10 bg-white" aria-hidden />

      <Link
        href="/pricing"
        className="absolute right-3 top-3 z-30 inline-flex items-center justify-center rounded-md p-1.5 text-gray-800 transition hover:opacity-75 sm:right-5 sm:top-5"
        aria-label="Înapoi la prețuri"
      >
        <X className="h-4 w-4" strokeWidth={2.25} />
      </Link>

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-gray-500">
            <Link href="/pricing" className="hover:text-gray-800">
              ← Înapoi la prețuri
            </Link>
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Free vs Premium — toate detaliile
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            Pagina de prețuri te ajută să decizi. Aici vezi comparația completă, ca să fii sigur.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-gray-100 bg-[#f7f7f7] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:px-5 sm:text-sm sm:normal-case sm:tracking-normal">
            <span>Funcție</span>
            <span className="text-center">Free</span>
            <span className="text-center text-gray-900">Premium</span>
          </div>

          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-gray-50 px-3 py-3.5 last:border-b-0 sm:px-5"
            >
              <span className="pr-2 text-sm font-medium text-gray-800">{row.label}</span>
              <div className="text-center">
                <CellValue value={row.free} />
              </div>
              <div className="text-center">
                <CellValue value={row.premium} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-5">
            <h2 className="text-lg font-semibold text-gray-900">Free</h2>
            <p className="mt-1 text-sm text-gray-500">Acces limitat, fără card</p>
            <ul className="mt-4 space-y-2.5">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-900 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Premium</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isLaunch20Active()
                ? `${getCampaignPriceRon("week")} RON/săpt · ${getCampaignPriceRon("month")} RON/lună (−${LAUNCH_20_PERCENT}%) · `
                : `${PREMIUM_WEEKLY_RON} RON/săpt · ${PREMIUM_MONTHLY_RON} RON/lună · `}
              {isEarlybirdActive()
                ? `${EARLYBIRD_YEARLY_RON.toLocaleString("ro-RO")} RON/an earlybird`
                : `${PREMIUM_YEARLY_RON.toLocaleString("ro-RO")} RON/an (−${PREMIUM_YEARLY_SAVE_PERCENT}%)`}
            </p>
            <ul className="mt-4 space-y-2.5">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#2a2a2a] px-8 text-base font-semibold text-white shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505]"
          >
            Devino Premium
          </Link>
          <Link href="/probleme" className="text-sm font-medium text-gray-500 hover:text-gray-800">
            Continui gratuit, cu acces limitat →
          </Link>
        </div>
      </main>
    </div>
  )
}

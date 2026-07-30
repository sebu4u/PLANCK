export type PremiumBillingInterval = "week" | "month" | "year"

export const PREMIUM_WEEKLY_RON = 79
export const PREMIUM_MONTHLY_RON = 199
export const PREMIUM_YEARLY_RON = 1199

/** 199 × 12 — used for annual savings display */
export const PREMIUM_YEARLY_FULL_RON = PREMIUM_MONTHLY_RON * 12

export const PREMIUM_MONTHLY_VS_WEEKLY_SAVE_PERCENT = 42
export const PREMIUM_YEARLY_SAVE_PERCENT = 50

export const PREMIUM_FEATURE_BULLETS = [
  "Toate traseele de învățare, la orice materie",
  "Generare de trasee unice, personalizate de Insight 2.5",
  "Tutorul AI Insight 2.5, fără limite",
  "2-3 workshop-uri incluse în fiecare săptămână",
  "Acces complet la PlanckPass",
  "Fizică, Matematică, Informatică, Biologie — tot ce ai nevoie pentru BAC",
] as const

export const PREMIUM_PRICING_FAQ = [
  {
    id: "cancel",
    question: "Pot anula oricând?",
    answer:
      "Da. Anulezi din cont, în aproximativ 30 de secunde. Păstrezi accesul Premium până la finalul perioadei deja plătite.",
  },
  {
    id: "free",
    question: "Ce primesc pe planul gratuit?",
    answer:
      "Acces limitat la probleme, cursuri și Insight (câteva prompt-uri pe zi). Traseele complete, tutorul nelimitat, workshop-urile și PlanckPass sunt pe Premium.",
  },
  {
    id: "change-interval",
    question: "Pot schimba perioada de plată mai târziu?",
    answer:
      "Da. Din portalul de abonament poți trece între săptămânal, lunar și anual. Schimbarea se aplică la următorul ciclu de facturare.",
  },
  {
    id: "plus-existing",
    question: "Ce se întâmplă dacă am deja Plus+?",
    answer:
      "Plus+ nu mai poate fi cumpărat, dar abonamentul tău rămâne activ. Îl poți gestiona sau trece la Premium din portalul de facturare.",
  },
  {
    id: "weekly",
    question: "Cum funcționează perioada săptămânală?",
    answer:
      "„Încearcă o săptămână” e aceeași experiență Premium, facturată pe 7 zile. Ideal ca să testezi platforma; poți trece apoi la lunar sau anual din cont.",
  },
] as const

export function getPremiumPriceRon(interval: PremiumBillingInterval): number {
  if (interval === "week") return PREMIUM_WEEKLY_RON
  if (interval === "year") return PREMIUM_YEARLY_RON
  return PREMIUM_MONTHLY_RON
}

export function getPremiumPeriodLabel(interval: PremiumBillingInterval): string {
  if (interval === "week") return "/săptămână"
  if (interval === "year") return "/an"
  return "/lună"
}

export function premiumDailyPrice(totalRon: number, days: number): string {
  return (totalRon / days).toFixed(2)
}

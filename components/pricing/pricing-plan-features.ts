export type PricingPlanId = "free" | "plus" | "premium"

export const PRICING_PLAN_FEATURES: Record<PricingPlanId, string[]> = {
  free: [
    "Probleme, cursuri și materiale pentru BAC — acces limitat",
    "Insight: câteva prompt-uri gratuite pe zi",
    "Acces limitat la trasee și la încărcare fișiere",
    "Workshop-uri, PlanckPass și Insight nelimitat — nu sunt incluse",
  ],
  plus: [
    "Tot ce include planul Free",
    "Acces extins la Insight și trasee (abonament vechi)",
    "Plus+ nu mai poate fi cumpărat — treci la Premium pentru acces complet",
  ],
  premium: [
    "Toate traseele de învățare, la orice materie",
    "Generare de trasee unice, personalizate de Insight 2.5",
    "Tutorul AI Insight 2.5, fără limite",
    "2-3 workshop-uri incluse în fiecare săptămână",
    "Acces complet la PlanckPass",
    "Fizică, Matematică, Informatică, Biologie — tot ce ai nevoie pentru BAC",
  ],
}

export const PRICING_PLAN_FEATURE_TITLES: Record<PricingPlanId, string> = {
  free: "Ce include Free",
  plus: "Ce include Plus+",
  premium: "Ce include Premium",
}

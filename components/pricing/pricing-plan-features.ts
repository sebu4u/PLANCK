export type PricingPlanId = "free" | "plus" | "premium"

export const PRICING_PLAN_FEATURES: Record<PricingPlanId, string[]> = {
  free: [
    "Probleme de fizică, cursuri și materiale pentru BAC și concursuri",
    "Insight: 3 prompt-uri gratuite pe zi",
    "Acces limitat la încărcare fișiere și la roadmaps",
    "PlanckCode nelimitat și extra-uri Premium — nu sunt incluse",
  ],
  plus: [
    "Tot ce include planul Free",
    "800 prompt-uri Insight pe lună; 10 fișiere încărcate pe zi",
    "Roadmaps complete, toate modelele Insight, memorie îmbunătățită",
    "PlanckCode nelimitat — disponibil la Premium",
  ],
  premium: [
    "Acces la PLANCKPASS",
    "Tot ce include planul Plus+",
    "Prompt-uri Insight nelimitate",
    "PlanckCode nelimitat pentru probleme de informatică",
    "Pregătire pentru olimpiadă, admitere și concursuri",
  ],
}

export const PRICING_PLAN_FEATURE_TITLES: Record<PricingPlanId, string> = {
  free: "Ce include Free",
  plus: "Ce include Plus+",
  premium: "Ce include Premium",
}

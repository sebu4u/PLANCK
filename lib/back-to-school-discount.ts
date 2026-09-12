import { PREMIUM_MONTHLY_RON } from "@/components/pricing/premium-pricing"

/** First month of Premium at 35 RON (catalog stays 199). */
export const BACK_TO_SCHOOL_DEADLINE = new Date("2026-09-30T23:59:59+03:00")
export const BACK_TO_SCHOOL_MONTHLY_RON = 35
export const BACK_TO_SCHOOL_DEADLINE_LABEL = "30 septembrie"
export const BACK_TO_SCHOOL_AMOUNT_OFF_RON =
  PREMIUM_MONTHLY_RON - BACK_TO_SCHOOL_MONTHLY_RON
export const BACK_TO_SCHOOL_SAVE_PERCENT = Math.round(
  (BACK_TO_SCHOOL_AMOUNT_OFF_RON / PREMIUM_MONTHLY_RON) * 100,
)

export function isBackToSchoolActive(now = new Date()): boolean {
  return now.getTime() < BACK_TO_SCHOOL_DEADLINE.getTime()
}

export const BACK_TO_SCHOOL_FAQ = {
  id: "back2school",
  question: "De ce prima lună costă 35 RON?",
  answer:
    "E oferta Back2School: prima lună de Premium e 35 RON, în loc de 199 RON. Din a doua lună revii la 199 RON/lună. Anulezi oricând din cont, înainte de următoarea factură.",
} as const

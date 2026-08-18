"use client"

import { useEffect, useState } from "react"
import {
  PREMIUM_MONTHLY_RON,
  PREMIUM_WEEKLY_RON,
} from "@/components/pricing/premium-pricing"
import {
  LANDING_DEADLINE,
} from "@/lib/landing-earlybird"

export {
  EARLYBIRD_DEADLINE_LABEL,
  EARLYBIRD_SAVE_PERCENT,
  EARLYBIRD_YEARLY_RON,
  FULL_YEARLY_RON,
  LANDING_DEADLINE,
} from "@/lib/landing-earlybird"

export const LANDING_WEEKLY_RON = PREMIUM_WEEKLY_RON
export const LANDING_MONTHLY_RON = PREMIUM_MONTHLY_RON

export type CountdownState = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function useCountdown(deadline: Date = LANDING_DEADLINE): CountdownState {
  const [t, setT] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calc = () => {
      const diff = deadline.getTime() - Date.now()
      if (diff <= 0) {
        setT({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return t
}

export const LANDING_FAQ_ITEMS = [
  {
    id: "materii",
    question: "Ce materii acoperă PLANCK?",
    answer:
      "Fizică, matematică, informatică și biologie — trasee complete pentru clasele 9–12, de la notă la clasă până la BAC și performanță.",
    href: "/invata/cursuri",
    linkLabel: "Vezi materiile",
  },
  {
    id: "bac-olimpiada",
    question: "Cum mă ajută la BAC vs olimpiadă?",
    answer:
      "Pentru BAC ai trasee structurate, grile și probleme video pe programa oficială. Pentru olimpiadă, problemele de performanță și Insight te forțează să gândești, nu să memorezi — același loc, ritm diferit.",
    href: "/invata",
    linkLabel: "Explorează traseele",
  },
  {
    id: "meditatii-live",
    question: "Cât costă meditațiile live?",
    answer:
      "Pregătirile live sunt incluse în Premium și se deblochează cu energie pe platformă. Nu plătești separat pe oră — vezi orarul și te înscrii din cont.",
    href: "/pregatire",
    linkLabel: "Vezi orarul",
  },
  {
    id: "anulare",
    question: "Pot anula oricând?",
    answer:
      "Da. Anulezi din cont în aproximativ 30 de secunde. Păstrezi accesul Premium până la finalul perioadei deja plătite.",
    href: "/pricing",
    linkLabel: "Vezi planurile",
  },
  {
    id: "telefon",
    question: "Merge pe telefon?",
    answer:
      "Da. PLANCK e optimizat pentru telefon și tabletă — poți învăța, rezolva grile și vorbi cu Insight de oriunde.",
  },
  {
    id: "earlybird",
    question: "Ce înseamnă oferta earlybird de 799 RON/an?",
    answer:
      "Până pe 7 septembrie evidențiem pe această pagină prețul de campanie pentru 1 an de Premium. Activezi abonamentul din pagina de prețuri; oferta de campanie e limitată în timp.",
    href: "/pricing",
    linkLabel: "Activează Premium",
  },
] as const

export const LANDING_PREMIUM_BULLETS = [
  "Toate traseele de învățare, la orice materie",
  "Tutorul AI Insight 2.5, fără limite",
  "10+ pregătiri live săptămânale (cu energie)",
  "Acces complet la PlanckPass și Planck Code",
] as const

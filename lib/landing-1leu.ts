"use client"

import { useEffect, useState } from "react"

import { PRIZE_WHEEL_YEARLY_RON } from "@/lib/prize-wheel/types"
import {
  PRIZE_WHEEL_CAMPAIGN_START_AT,
  PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT,
  isPrizeWheelCampaignOpen,
} from "@/lib/prize-wheel/campaign"

export {
  PRIZE_WHEEL_CAMPAIGN_START_AT,
  PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT,
  isPrizeWheelCampaignOpen,
}

export const LANDING_1LEU_PATH = "/1leu"
export const LANDING_1LEU_SPIN_PATH = "/castiga"
export const LANDING_1LEU_YEARLY_RON = PRIZE_WHEEL_YEARLY_RON

export type Landing1LeuCountdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
  isLive: boolean
}

function getCountdown(now = Date.now()): Landing1LeuCountdown {
  const remaining = Math.max(0, PRIZE_WHEEL_CAMPAIGN_START_AT.getTime() - now)
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isLive: remaining <= 0,
  }
}

export function useLanding1LeuCampaign(): Landing1LeuCountdown {
  const [state, setState] = useState(getCountdown)

  useEffect(() => {
    const tick = () => setState(getCountdown())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return state
}

export const LANDING_1LEU_FAQ_ITEMS = [
  {
    id: "teapa",
    question: "E țeapă? Trebuie să las cardul acum?",
    answer:
      "Nu. Contul e gratuit și nu cerem card ca să te înscrii. 1 leu se plătește doar dacă prinzi unul din cele 20 de locuri și activezi premiul pe pagina de prețuri. Restul premiilor sunt reduceri sau 7 zile Premium, tot reale.",
  },
  {
    id: "primii-20",
    question: "Ce înseamnă „primii 20”?",
    answer: `Roata se deschide pe 1 septembrie, la 12:00. Primii ${PRIZE_WHEEL_GUARANTEED_1LEU_LIMIT} elevi care o învârt primesc un an de Premium la 1 leu (față de ${PRIZE_WHEEL_YEARLY_RON} RON). După ce se ocupă locurile, ceilalți tot câștigă — doar nu anualul la 1 leu.`,
  },
  {
    id: "restul",
    question: "Ce iau dacă nu sunt în primii 20?",
    answer:
      "Un premiu garantat: 7 zile de Premium gratuit, 50% reducere la abonamentul anual sau 70% reducere la cel lunar. Nimeni nu iese cu mâna goală.",
  },
  {
    id: "un-leu",
    question: "1 leu e pe lună sau pe an? Se reînnoiește?",
    answer: `1 leu e pentru primul an de Premium, nu pe lună. După 12 luni, dacă nu anulezi, se reînnoiește la ${PRIZE_WHEEL_YEARLY_RON} RON/an. Anulezi din cont în aproximativ 30 de secunde și păstrezi accesul până la finalul anului deja plătit.`,
  },
  {
    id: "ce-e",
    question: "Ce e PLANCK, concret?",
    answer:
      "Platformă pentru liceu (clasele 9–12): trasee la fizică, matematică, informatică și biologie, 10.000+ grile, probleme rezolvate video, tutor AI Insight și pregătiri live. E pentru notă la clasă, BAC și admitere — nu un PDF și un grup de WhatsApp.",
    href: "/",
    linkLabel: "Vezi platforma",
  },
  {
    id: "telefon",
    question: "Merge pe telefon?",
    answer:
      "Da. PLANCK e făcut pentru telefon: înveți, rezolvi grile și vorbești cu Insight de oriunde. Landing-ul ăsta e gândit tot pentru ecran mic.",
  },
  {
    id: "anulare",
    question: "Pot anula oricând?",
    answer:
      "Da. Anulezi din cont, fără telefon, fără „pachet de fidelitate”. Păstrezi Premium până expiră perioada deja plătită — la 1 leu, ăla e un an.",
    href: "/termeni",
    linkLabel: "Vezi termenii",
  },
  {
    id: "parinte",
    question: "Pot învârti roata din cont de părinte?",
    answer:
      "Nu. Roata e doar pentru conturi de elev. Creează (sau folosește) un cont de elev înainte de 12:00. Părintele poate plăti după, din pagina de prețuri, dacă elevul a câștigat premiul.",
  },
] as const

"use client"

export const ATTRIBUTION_COOKIE = "planck_attribution"
const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const
const CLICK_ID_KEYS = ["gclid", "fbclid", "ttclid"] as const

export type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  ttclid?: string
  landing_page?: string
  referrer?: string
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${name}=`
  const match = document.cookie.split("; ").find((part) => part.startsWith(prefix))
  if (!match) return null
  return decodeURIComponent(match.slice(prefix.length))
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax`
}

export function readAttribution(): Attribution | null {
  const raw = readCookie(ATTRIBUTION_COOKIE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Attribution
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

export function persistFirstTouchAttribution(): Attribution | null {
  if (typeof window === "undefined") return null

  const existing = readAttribution()
  if (existing) return existing

  const params = new URLSearchParams(window.location.search)
  const attribution: Attribution = {}

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim()
    if (value) attribution[key] = value
  }
  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key)?.trim()
    if (value) attribution[key] = value
  }

  attribution.landing_page = window.location.pathname || "/"
  const referrer = document.referrer?.trim()
  if (referrer) attribution.referrer = referrer

  writeCookie(ATTRIBUTION_COOKIE, JSON.stringify(attribution))
  return attribution
}

export function attributionAsProperties(attribution: Attribution | null): Record<string, string> {
  if (!attribution) return {}
  return Object.fromEntries(
    Object.entries(attribution).filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

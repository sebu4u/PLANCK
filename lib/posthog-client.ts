"use client"

import posthog from "posthog-js"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_UI_HOST = "https://eu.posthog.com"

let initialized = false

export function canUsePosthog(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "development" &&
    Boolean(POSTHOG_KEY)
  )
}

export function initPosthog(): void {
  if (initialized || !canUsePosthog() || !POSTHOG_KEY) return

  posthog.init(POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: POSTHOG_UI_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    session_recording: {
      maskAllInputs: true,
    },
  })
  initialized = true
}

export function optOutPosthog(): void {
  if (typeof window === "undefined") return
  if (initialized) {
    posthog.opt_out_capturing()
  }
}

export function optInPosthog(): void {
  if (!canUsePosthog()) return
  initPosthog()
  posthog.opt_in_capturing()
}

export function identifyPosthogUser(
  userId: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!initialized || !canUsePosthog()) return
  posthog.identify(userId, compact(properties))
}

export function resetPosthog(): void {
  if (!initialized) return
  posthog.reset()
}

export function registerPosthogSuperProperties(properties: Record<string, unknown>): void {
  if (!initialized || !canUsePosthog()) return
  const clean = compact(properties)
  if (Object.keys(clean).length === 0) return
  posthog.register(clean)
}

export function capturePosthogEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized || !canUsePosthog()) return
  posthog.capture(event, compact(properties))
}

export function capturePosthogPageview(pathname: string): void {
  if (!initialized || !canUsePosthog()) return
  posthog.capture("$pageview", { $current_url: window.location.href, path: pathname })
}

function compact(properties?: Record<string, unknown>): Record<string, unknown> {
  if (!properties) return {}
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  )
}

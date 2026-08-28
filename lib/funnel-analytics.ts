"use client"

import { attributionAsProperties, readAttribution } from "@/lib/attribution"
import { capturePosthogEvent } from "@/lib/posthog-client"

export const LANDING_PATHS = new Set(["/", "/landing", "/parinti", "/gratuit", "/rezerva", "/1leu"])

export const STUDENT_STEP_NAMES: Record<string, string> = {
  "1": "welcome",
  "2": "subject",
  "3": "grade",
  "4": "self_grade",
  "5": "target_grade",
  "9": "account",
  name: "name",
  lesson_choice: "lesson_choice",
}

export function guardianStepName(
  step: number | "name",
  role: "parinte" | "profesor" | null,
): string {
  if (step === "name") return "name"
  if (step === 1) return "welcome"
  if (step === 2) return "role"
  if (step === 3) return "ai_intro"
  if (step === 4) return role === "profesor" ? "teaching_subject" : "child_age_time"
  if (step === 5) return role === "profesor" ? "classrooms" : "testimonials"
  if (step === 6) return role === "profesor" ? "testimonials" : "account"
  if (step === 7) return "account"
  return `step_${step}`
}

export function trackFunnelEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  capturePosthogEvent(event, {
    ...attributionAsProperties(readAttribution()),
    ...properties,
  })
}

export function landingKey(pathname: string): string | null {
  if (pathname === "/") return "/"
  const normalized = pathname.replace(/\/$/, "") || "/"
  return LANDING_PATHS.has(normalized) ? normalized : null
}

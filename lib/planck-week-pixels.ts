"use client"

import { META_CURRENCY, metaPixel } from "@/lib/meta-pixel"
import { TIKTOK_CURRENCY } from "@/lib/tiktok-constants"
import { tiktokPixel } from "@/lib/tiktok-pixel"

const EMAIL_KEY = "planck_week_lead_email"
const CONTENT_ID = "planck_week"
const CONTENT_NAME = "Planck Week"

export function rememberPlanckWeekLeadEmail(email: string): void {
  const value = email.trim().toLowerCase()
  if (!value) return
  try {
    sessionStorage.setItem(EMAIL_KEY, value)
  } catch {
    // ignore
  }
}

export function trackPlanckWeekLeadPixels(): void {
  let email: string | null = null
  try {
    email = sessionStorage.getItem(EMAIL_KEY)
    if (email) sessionStorage.removeItem(EMAIL_KEY)
  } catch {
    // ignore
  }

  if (email) {
    void tiktokPixel.identify({ email })
    metaPixel.identify({ email })
  }

  const onceKey = email || "planck_week_lead"
  metaPixel.trackLead(CONTENT_ID, CONTENT_NAME)
  metaPixel.trackCompleteRegistration(
    {
      content_ids: [CONTENT_ID],
      content_type: "product",
      content_name: CONTENT_NAME,
      value: 0,
      currency: META_CURRENCY,
    },
    onceKey,
  )
  tiktokPixel.trackSubmitForm(CONTENT_ID, CONTENT_NAME)
  tiktokPixel.trackCompleteRegistration(
    {
      contents: [
        {
          content_id: CONTENT_ID,
          content_type: "product",
          content_name: CONTENT_NAME,
        },
      ],
      value: 0,
      currency: TIKTOK_CURRENCY,
    },
    onceKey,
  )
}

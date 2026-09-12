import "server-only"

import { createHash } from "node:crypto"

import { logger } from "@/lib/logger"
import { META_CURRENCY, META_PIXEL_ID } from "@/lib/meta-constants"

const META_CAPI_ENDPOINT = "https://graph.facebook.com/v21.0"
const META_CAPI_TIMEOUT_MS = 10_000

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = "name" in error ? String(error.name) : ""
  return name === "AbortError" || name === "TimeoutError"
}

export type MetaCapiUser = {
  email?: string | null
  phone?: string | null
  externalId?: string | null
  ip?: string | null
  userAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  fbclid?: string | null
}

export type MetaCapiEvent = {
  eventName: string
  eventId: string
  eventTime?: number
  url: string
  value?: number
  currency?: string
  contentIds?: string[]
  contentType?: "product" | "product_group"
  contentName?: string
  user: MetaCapiUser
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  return trimmed.includes("@") ? trimmed : null
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "")
  if (!digits) return null

  let e164 = digits
  if (e164.startsWith("00")) e164 = `+${e164.slice(2)}`
  if (e164.startsWith("07") && e164.length === 10) e164 = `+4${e164}`
  if (e164.startsWith("40") && !e164.startsWith("+")) e164 = `+${e164}`
  if (!e164.startsWith("+") && e164.length >= 8) e164 = `+${e164}`
  if (!e164.startsWith("+") || e164.length < 10) return null
  return e164
}

function hashIfPresent(
  value: string | null | undefined,
  normalize?: (raw: string) => string | null,
): string | undefined {
  if (!value?.trim()) return undefined
  const normalized = normalize ? normalize(value) : value.trim()
  if (!normalized) return undefined
  return sha256Hex(normalized)
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""),
  ) as T
}

function clickId(fbc?: string | null, fbclid?: string | null): string | undefined {
  if (fbc?.trim()) return fbc.trim()
  const click = fbclid?.trim()
  if (!click) return undefined
  return `fb.1.${Math.floor(Date.now() / 1000)}.${click}`
}

export function getMetaCapiAccessToken(): string | null {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim()
  return token || null
}

export async function sendMetaCapiEvents(events: MetaCapiEvent[]): Promise<boolean> {
  const accessToken = getMetaCapiAccessToken()
  if (!accessToken) {
    logger.warn("[meta/capi] META_CAPI_ACCESS_TOKEN is not set")
    return false
  }
  if (events.length === 0) return true

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || META_PIXEL_ID
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim()

  if (process.env.NODE_ENV === "development" && !testEventCode) {
    return true
  }

  const payload = {
    data: events.map((event) => {
      const hashedEmail = hashIfPresent(event.user.email, normalizeEmail)
      const hashedPhone = hashIfPresent(event.user.phone, normalizePhone)
      const hashedExternalId = hashIfPresent(event.user.externalId)
      return compact({
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.url,
        action_source: "website",
        user_data: compact({
          em: hashedEmail ? [hashedEmail] : undefined,
          ph: hashedPhone ? [hashedPhone] : undefined,
          external_id: hashedExternalId ? [hashedExternalId] : undefined,
          client_ip_address: event.user.ip || undefined,
          client_user_agent: event.user.userAgent || undefined,
          fbp: event.user.fbp?.trim() || undefined,
          fbc: clickId(event.user.fbc, event.user.fbclid),
        }),
        custom_data: compact({
          content_ids: event.contentIds,
          content_type: event.contentType,
          content_name: event.contentName,
          value: event.value,
          currency: event.currency ?? META_CURRENCY,
        }),
      })
    }),
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), META_CAPI_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${META_CAPI_ENDPOINT}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      },
    )
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string }
      events_received?: number
    } | null
    if (!response.ok || body?.error) {
      logger.warn("[meta/capi] Meta rejected event", body?.error?.message || response.status)
      return false
    }
    return true
  } catch (error) {
    if (isAbortError(error)) {
      logger.warn(`[meta/capi] Meta Conversions API timed out after ${META_CAPI_TIMEOUT_MS}ms`)
      return false
    }
    const message = error instanceof Error ? error.message : String(error)
    logger.warn("[meta/capi] Failed to send event", message)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

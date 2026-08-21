import { createHash } from "node:crypto"

import { logger } from "@/lib/logger"
import { PLATFORM_SITE_URL } from "@/lib/platform-marketing"
import { TIKTOK_CURRENCY, TIKTOK_PIXEL_ID, tiktokEventId, type TikTokStandardEvent } from "@/lib/tiktok-constants"

const TIKTOK_EVENTS_ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/"
const TIKTOK_EVENTS_TIMEOUT_MS = 10_000

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = "name" in error ? String(error.name) : ""
  return name === "AbortError" || name === "TimeoutError"
}

export type TikTokServerUser = {
  email?: string | null
  phone?: string | null
  externalId?: string | null
  ip?: string | null
  userAgent?: string | null
  ttclid?: string | null
  ttp?: string | null
  locale?: string | null
}

export type TikTokServerContent = {
  content_id?: string
  content_type?: "product" | "product_group"
  content_name?: string
  price?: number
}

export type TikTokServerEvent = {
  event: TikTokStandardEvent
  eventId: string
  eventTime?: number
  url: string
  referrer?: string | null
  value?: number
  currency?: string
  contents?: TikTokServerContent[]
  contentType?: "product" | "product_group"
  searchString?: string | null
  description?: string | null
  orderId?: string | null
  user: TikTokServerUser
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

function hashIfPresent(value: string | null | undefined, normalize?: (raw: string) => string | null): string | undefined {
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

export function getTikTokEventsAccessToken(): string | null {
  const token = process.env.TIKTOK_EVENTS_ACCESS_TOKEN?.trim()
  return token || null
}

export async function sendTikTokServerEvents(events: TikTokServerEvent[]): Promise<boolean> {
  const accessToken = getTikTokEventsAccessToken()
  if (!accessToken) {
    logger.warn("[tiktok/events] TIKTOK_EVENTS_ACCESS_TOKEN is not set")
    return false
  }
  if (events.length === 0) return true

  const pixelId = process.env.TIKTOK_PIXEL_ID?.trim() || TIKTOK_PIXEL_ID
  const testEventCode = process.env.TIKTOK_EVENTS_TEST_CODE?.trim()

  // Local PageView/etc. hits to TikTok's API time out often and pollute `next dev`.
  // Set TIKTOK_EVENTS_TEST_CODE to actually forward events from development.
  if (process.env.NODE_ENV === "development" && !testEventCode) {
    return true
  }

  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
    data: events.map((event) => {
      const contents = (event.contents ?? []).map((content) =>
        compact({
          content_id: content.content_id,
          content_type: content.content_type,
          content_name: content.content_name,
          price: content.price,
        }),
      )
      const first = contents[0]
      const hashedEmail = hashIfPresent(event.user.email, normalizeEmail)
      const hashedPhone = hashIfPresent(event.user.phone, normalizePhone)
      const hashedExternalId = hashIfPresent(event.user.externalId)

      return compact({
        event: event.event,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        user: compact({
          email: hashedEmail,
          phone: hashedPhone,
          external_id: hashedExternalId,
          ip: event.user.ip || undefined,
          user_agent: event.user.userAgent || undefined,
          ttclid: event.user.ttclid || undefined,
          ttp: event.user.ttp || undefined,
          locale: event.user.locale || undefined,
        }),
        page: compact({
          url: event.url,
          referrer: event.referrer || undefined,
        }),
        properties: compact({
          value: event.value,
          currency: event.currency,
          contents: contents.length > 0 ? contents : undefined,
          content_type: event.contentType ?? first?.content_type,
          content_id: first?.content_id,
          content_name: first?.content_name,
          search_string: event.searchString || undefined,
          description: event.description || undefined,
          order_id: event.orderId || undefined,
        }),
      })
    }),
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIKTOK_EVENTS_TIMEOUT_MS)

  try {
    const response = await fetch(TIKTOK_EVENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    })
    const body = (await response.json().catch(() => null)) as { code?: number; message?: string } | null
    if (!response.ok || (typeof body?.code === "number" && body.code !== 0)) {
      logger.warn("[tiktok/events] TikTok rejected event", body?.message || response.status)
      return false
    }
    return true
  } catch (error) {
    if (isAbortError(error)) {
      logger.warn(`[tiktok/events] TikTok Events API timed out after ${TIKTOK_EVENTS_TIMEOUT_MS}ms`)
      return false
    }
    const message = error instanceof Error ? error.message : String(error)
    logger.warn("[tiktok/events] Failed to send event", message)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

type CheckoutSessionLike = {
  id: string
  amount_total?: number | null
  currency?: string | null
  customer_email?: string | null
  customer_details?: { email?: string | null } | null
  metadata?: Record<string, string> | null
  client_reference_id?: string | null
}

export async function sendTikTokCheckoutPurchase(session: CheckoutSessionLike): Promise<void> {
  const interval = session.metadata?.interval === "week" || session.metadata?.interval === "year"
    ? session.metadata.interval
    : "month"
  const value = typeof session.amount_total === "number" ? session.amount_total / 100 : undefined
  const currency = (session.currency || TIKTOK_CURRENCY).toUpperCase()
  const contentName =
    interval === "week"
      ? "Planck Premium săptămânal"
      : interval === "year"
        ? "Planck Premium anual"
        : "Planck Premium lunar"
  const url = `${PLATFORM_SITE_URL}/pricing?checkout=success&session_id=${encodeURIComponent(session.id)}`
  const user = {
    email: session.customer_details?.email || session.customer_email || null,
    externalId: session.metadata?.payer_user_id || session.metadata?.user_id || session.client_reference_id || null,
  }
  const contents = [
    {
      content_id: `premium_${interval}`,
      content_type: "product" as const,
      content_name: contentName,
      price: value,
    },
  ]

  const events: TikTokStandardEvent[] = ["PlaceAnOrder", "Purchase", "Subscribe"]
  if (interval === "week") events.push("StartTrial")

  await sendTikTokServerEvents(
    events.map((event) => ({
      event,
      eventId: tiktokEventId(event, session.id),
      url,
      value,
      currency,
      contents,
      contentType: "product",
      orderId: session.id,
      user,
    })),
  )
}

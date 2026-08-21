import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { isTikTokStandardEvent } from "@/lib/tiktok-constants"
import { sendTikTokServerEvents } from "@/lib/tiktok-events-api"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

const contentSchema = z.object({
  content_id: z.string().trim().min(1).max(120).optional(),
  content_type: z.enum(["product", "product_group"]).optional(),
  content_name: z.string().trim().min(1).max(200).optional(),
  price: z.number().finite().nonnegative().optional(),
})

const eventSchema = z.object({
  event: z.string().trim().min(1).max(64),
  event_id: z.string().trim().min(8).max(180),
  event_time: z.number().int().positive().optional(),
  url: z.string().trim().url().max(2000),
  referrer: z.string().trim().max(2000).optional().nullable(),
  value: z.number().finite().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  contents: z.array(contentSchema).max(20).optional(),
  search_string: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  external_id: z.string().trim().max(128).optional().nullable(),
})

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 40
const RATE_LIMIT_WINDOW = 60 * 1000

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }
  if (record.count >= RATE_LIMIT_MAX) return true
  record.count++
  return false
}

function isAllowedEventUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    const host = parsed.hostname.toLowerCase()
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "planck.academy" ||
      host.endsWith(".planck.academy")
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Cerere invalidă." }, { status: 400 })
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success || !isTikTokStandardEvent(parsed.data.event)) {
    return NextResponse.json({ ok: false, error: "Eveniment invalid." }, { status: 400 })
  }
  if (!isAllowedEventUrl(parsed.data.url)) {
    return NextResponse.json({ ok: false, error: "URL invalid." }, { status: 400 })
  }

  const event = parsed.data
  let email = event.email ?? null
  let phone = event.phone ?? null
  let externalId = event.external_id ?? null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      email = email || data.user.email || null
      phone = phone || data.user.phone || null
      externalId = data.user.id
    }
  } catch (error) {
    logger.warn("[tiktok/events] Could not read session", error)
  }

  const sent = await sendTikTokServerEvents([
    {
      event: event.event,
      eventId: event.event_id,
      eventTime: event.event_time,
      url: event.url,
      referrer: event.referrer,
      value: event.value,
      currency: event.currency?.toUpperCase(),
      contents: event.contents,
      searchString: event.search_string,
      user: {
        email,
        phone,
        externalId,
        ip: ip === "unknown" ? null : ip,
        userAgent: request.headers.get("user-agent"),
        ttclid: request.cookies.get("ttclid")?.value || null,
        ttp: request.cookies.get("_ttp")?.value || null,
        locale: request.headers.get("accept-language")?.split(",")[0] || null,
      },
    },
  ])

  return NextResponse.json({ ok: sent })
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { isAdminFromDB, getAccessTokenFromRequest } from "@/lib/admin-check"
import {
  FIZICA_CALENDAR_EVENT_TYPE_LIST,
  type FizicaCalendarEventType,
} from "@/lib/invata-fizica-config"
import { logger } from "@/lib/logger"

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }

  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }

  const supabase = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }

  if (!(await isAdminFromDB(supabase, userData.user))) {
    return {
      error: NextResponse.json(
        { error: "Acces interzis. Doar adminii pot accesa această resursă." },
        { status: 403 },
      ),
    }
  }

  return { supabase, user: userData.user }
}

function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.")
  }

  return createClient(url, serviceRoleKey)
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized ? normalized : null
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value.trim())
}

function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

function parseEventType(value: unknown): FizicaCalendarEventType | null {
  if (typeof value !== "string") return null
  return FIZICA_CALENDAR_EVENT_TYPE_LIST.includes(value as FizicaCalendarEventType)
    ? (value as FizicaCalendarEventType)
    : null
}

function formatDbError(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown database error."
  const dbError = error as { code?: string; message?: string; details?: string; hint?: string }
  const parts = [dbError.code, dbError.message, dbError.details, dbError.hint].filter(Boolean)
  return parts.join(" | ") || "Unknown database error."
}

function normalizeTime(value: string): string {
  const trimmed = value.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`
  return trimmed
}

interface EventPayload {
  event_date: string
  event_type: FizicaCalendarEventType
  title: string
  description: string | null
  start_time: string
  color: string
  image_url: string | null
  is_active: boolean
}

function parseEventPayload(body: Record<string, unknown>): { data?: EventPayload; error?: string } {
  const eventDate = body.event_date
  const eventType = parseEventType(body.event_type)
  const title = toNullableString(body.title)
  const description = toNullableString(body.description)
  const startTime = typeof body.start_time === "string" ? body.start_time.trim() : null
  const color = typeof body.color === "string" ? body.color.trim() : null
  const imageUrl = toNullableString(body.image_url)
  const isActive = toBoolean(body.is_active, true)

  if (!isValidDate(eventDate)) {
    return { error: "Data evenimentului este invalidă (format YYYY-MM-DD)." }
  }
  if (!eventType) {
    return { error: "Tipul evenimentului este invalid." }
  }
  if (!title) {
    return { error: "Titlul evenimentului este obligatoriu." }
  }
  if (!startTime || !isValidTime(startTime)) {
    return { error: "Ora de desfășurare este invalidă (format HH:MM)." }
  }
  if (!color || !isValidHexColor(color)) {
    return { error: "Culoarea trebuie să fie un cod hex valid (ex: #2563eb)." }
  }

  return {
    data: {
      event_date: eventDate,
      event_type: eventType,
      title,
      description,
      start_time: normalizeTime(startTime),
      color,
      image_url: imageUrl,
      is_active: isActive,
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("fizica_calendar_events")
      .select("*")
      .order("event_date", { ascending: true })

    if (error) {
      logger.error("[admin/fizica-calendar] Failed to fetch events:", error)
      return NextResponse.json({ error: "Nu am putut încărca evenimentele." }, { status: 500 })
    }

    return NextResponse.json({ events: data ?? [] })
  } catch (err) {
    logger.error("[admin/fizica-calendar] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const body = await req.json()
    const parsed = parseEventPayload(body)
    if (parsed.error || !parsed.data) {
      return NextResponse.json({ error: parsed.error ?? "Date invalide." }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("fizica_calendar_events")
      .insert({ ...parsed.data, updated_at: now })
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Există deja un eveniment în această dată." },
          { status: 409 },
        )
      }
      logger.error("[admin/fizica-calendar] Failed to create event:", error)
      return NextResponse.json({ error: formatDbError(error) }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (err) {
    logger.error("[admin/fizica-calendar] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const body = await req.json()
    const id = toNullableString(body.id)
    if (!id) {
      return NextResponse.json({ error: "ID-ul evenimentului este obligatoriu." }, { status: 400 })
    }

    const parsed = parseEventPayload(body)
    if (parsed.error || !parsed.data) {
      return NextResponse.json({ error: parsed.error ?? "Date invalide." }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("fizica_calendar_events")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Există deja un eveniment în această dată." },
          { status: 409 },
        )
      }
      logger.error("[admin/fizica-calendar] Failed to update event:", error)
      return NextResponse.json({ error: formatDbError(error) }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Evenimentul nu a fost găsit." }, { status: 404 })
    }

    return NextResponse.json({ event: data })
  } catch (err) {
    logger.error("[admin/fizica-calendar] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")?.trim()
    if (!id) {
      return NextResponse.json({ error: "ID-ul evenimentului este obligatoriu." }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from("fizica_calendar_events").delete().eq("id", id)

    if (error) {
      logger.error("[admin/fizica-calendar] Failed to delete event:", error)
      return NextResponse.json({ error: formatDbError(error) }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("[admin/fizica-calendar] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

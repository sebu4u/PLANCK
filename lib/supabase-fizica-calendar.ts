import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { FizicaCalendarEventType } from "@/lib/invata-fizica-config"

export interface FizicaCalendarEvent {
  id: string
  event_date: string
  event_type: FizicaCalendarEventType
  title: string
  description: string | null
  start_time: string
  color: string
  image_url: string | null
}

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function formatFizicaEventTime(time: string): string {
  const normalized = time.trim()
  if (/^\d{2}:\d{2}$/.test(normalized)) return normalized
  const match = normalized.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : normalized
}

export function toFizicaCalendarDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getFizicaCalendarDefaultRange(referenceDate = new Date()): {
  startDate: string
  endDate: string
} {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 2, 0)
  return {
    startDate: toFizicaCalendarDateKey(start),
    endDate: toFizicaCalendarDateKey(end),
  }
}

export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    startDate: toFizicaCalendarDateKey(start),
    endDate: toFizicaCalendarDateKey(end),
  }
}

export function buildFizicaCalendarEventsMap(
  events: FizicaCalendarEvent[],
): Map<string, FizicaCalendarEvent> {
  return new Map(events.map((event) => [event.event_date, event]))
}

export async function fetchFizicaCalendarEventsForRange(
  startDate: string,
  endDate: string,
  client?: SupabaseClient | null,
): Promise<FizicaCalendarEvent[]> {
  const supabase = client ?? getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from("fizica_calendar_events")
      .select(
        "id, event_date, event_type, title, description, start_time, color, image_url",
      )
      .eq("is_active", true)
      .gte("event_date", startDate)
      .lte("event_date", endDate)
      .order("event_date", { ascending: true })

    if (error || !data) return []
    return data as FizicaCalendarEvent[]
  } catch {
    return []
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim()
  if (normalized.length !== 6) return `rgba(37, 99, 235, ${alpha})`
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return `rgba(37, 99, 235, ${alpha})`
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

import { WORKSHOP_TZ } from "@/lib/pregatire/types"

/** ISO week key matching Postgres `to_char(..., 'IYYY-"W"IW')` in Bucharest. */
export function bucharestWeekKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: WORKSHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  const year = Number(get("year"))
  const month = Number(get("month"))
  const day = Number(get("day"))

  // Compute ISO week from Bucharest calendar date
  const utc = new Date(Date.UTC(year, month - 1, day))
  const dayNum = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const isoYear = utc.getUTCFullYear()
  return `${isoYear}-W${String(week).padStart(2, "0")}`
}

export function bucharestParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: WORKSHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  }
}

/** True during Monday 00:00–00:59 Europe/Bucharest. */
export function isBucharestMondayGrantWindow(date: Date = new Date()): boolean {
  const p = bucharestParts(date)
  return p.weekday === "Mon" && p.hour === 0
}

export function formatWorkshopDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("ro-RO", {
    timeZone: WORKSHOP_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatWorkshopTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("ro-RO", {
    timeZone: WORKSHOP_TZ,
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Compact day + time for dashboard previews, e.g. "mar. 28 iul. · 18:00". */
export function formatWorkshopShortDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const day = date.toLocaleDateString("ro-RO", {
    timeZone: WORKSHOP_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const time = formatWorkshopTime(iso)
  return time ? `${day} · ${time}` : day
}

export function formatWorkshopDayKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const p = bucharestParts(date)
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`
}

export function startOfMonthBucharest(year: number, month: number): Date {
  // month 1-12; noon UTC approx avoids DST edge for calendar grid labels
  return new Date(Date.UTC(year, month - 1, 1, 10, 0, 0))
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function startOfWeekMonday(date: Date): Date {
  const p = bucharestParts(date)
  const asUtc = new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0))
  const day = asUtc.getUTCDay() || 7
  asUtc.setUTCDate(asUtc.getUTCDate() - (day - 1))
  return asUtc
}

export function isWorkshopPast(startsAt: string, durationMinutes: number, now = new Date()): boolean {
  const start = new Date(startsAt).getTime()
  if (Number.isNaN(start)) return false
  return start + durationMinutes * 60_000 < now.getTime()
}

export function isWorkshopLive(startsAt: string, durationMinutes: number, now = new Date()): boolean {
  const start = new Date(startsAt).getTime()
  if (Number.isNaN(start)) return false
  return start <= now.getTime() && !isWorkshopPast(startsAt, durationMinutes, now)
}

/** Next upcoming session: enrolled first, else the soonest published. */
export function pickNextWorkshop<
  T extends { starts_at: string; duration_minutes: number; unlocked?: boolean },
>(workshops: T[], now = new Date()): T | null {
  const upcoming = workshops
    .filter((w) => !isWorkshopPast(w.starts_at, w.duration_minutes, now))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  return upcoming.find((w) => w.unlocked) ?? upcoming[0] ?? null
}

/** Live countdown until `starts_at`, e.g. "în 2 zile și 4 ore". */
export function formatWorkshopStartsIn(startsAt: string, now = new Date()): string {
  const start = new Date(startsAt).getTime()
  if (Number.isNaN(start)) return ""
  const remainingMs = start - now.getTime()
  if (remainingMs <= 0) return "Acum"
  const totalMinutes = Math.ceil(remainingMs / 60_000)
  if (totalMinutes <= 1) return "în mai puțin de un minut"
  if (totalMinutes < 60) return `în ${totalMinutes} minute`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) {
    if (minutes === 0) return hours === 1 ? "în 1 oră" : `în ${hours} ore`
    return `în ${hours} ${hours === 1 ? "oră" : "ore"} și ${minutes} minute`
  }
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  if (remHours === 0) return days === 1 ? "în 1 zi" : `în ${days} zile`
  return `${days === 1 ? "în 1 zi" : `în ${days} zile`} și ${remHours} ${remHours === 1 ? "oră" : "ore"}`
}

/** Hero date line, e.g. "marți, 2 septembrie · 18:00". */
export function formatWorkshopHeroDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const day = date.toLocaleDateString("ro-RO", {
    timeZone: WORKSHOP_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const time = formatWorkshopTime(iso)
  return time ? `${day} · ${time}` : day
}

/** Meet link is withheld until this long before `starts_at`. */
export const WORKSHOP_MEET_VISIBLE_BEFORE_MS = 10 * 60 * 1000

export function workshopMeetOpensAtMs(startsAt: string): number | null {
  const start = new Date(startsAt).getTime()
  if (Number.isNaN(start)) return null
  return start - WORKSHOP_MEET_VISIBLE_BEFORE_MS
}

export function isWorkshopMeetVisible(startsAt: string, now = new Date()): boolean {
  const opensAt = workshopMeetOpensAtMs(startsAt)
  if (opensAt == null) return false
  return now.getTime() >= opensAt
}

export function visibleWorkshopMeetUrl(
  startsAt: string,
  meetUrl: string | null | undefined,
  now = new Date(),
): string | null {
  if (!meetUrl) return null
  return isWorkshopMeetVisible(startsAt, now) ? meetUrl : null
}

export function formatWorkshopMeetWait(startsAt: string, now = new Date()): string {
  const opensAt = workshopMeetOpensAtMs(startsAt)
  if (opensAt == null) return ""
  const remainingMs = Math.max(0, opensAt - now.getTime())
  const totalMinutes = Math.ceil(remainingMs / 60_000)
  if (totalMinutes <= 1) return "în mai puțin de un minut"
  if (totalMinutes < 60) return `în ${totalMinutes} minute`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours < 24) {
    if (minutes === 0) return hours === 1 ? "în 1 oră" : `în ${hours} ore`
    return `în ${hours} ${hours === 1 ? "oră" : "ore"} și ${minutes} minute`
  }
  const days = Math.ceil(totalMinutes / (60 * 24))
  return days === 1 ? "în 1 zi" : `în ${days} zile`
}

/** Interpret a Bucharest local date+time as UTC ISO. */
export function bucharestLocalToIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  if (![y, m, d, hh, mm].every((n) => Number.isFinite(n))) {
    throw new Error("invalid_local")
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: WORKSHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })

  let utcMs = Date.UTC(y, m - 1, d, hh, mm, 0)
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(utcMs))
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>
    const asLocalMs = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    )
    const desiredMs = Date.UTC(y, m - 1, d, hh, mm)
    utcMs += desiredMs - asLocalMs
  }

  return new Date(utcMs).toISOString()
}

export function isoToBucharestLocalParts(iso: string): { date: string; time: string } {
  const p = bucharestParts(new Date(iso))
  return {
    date: `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`,
    time: `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`,
  }
}

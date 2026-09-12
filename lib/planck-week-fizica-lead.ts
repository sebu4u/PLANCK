import { isWorkshopSubject, type WorkshopSubject } from "@/lib/pregatire/types"

const NAME_MAX = 80

export function normalizePlanckWeekFizicaName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ")
  if (name.length < 2 || name.length > NAME_MAX) return null
  return name
}

/** Accepts 07xxxxxxxx, +407xxxxxxxx, 407xxxxxxxx. Stores E.164 (+407…). */
export function normalizeRoMobilePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  let national = digits
  if (national.startsWith("0040")) national = national.slice(4)
  else if (national.startsWith("40")) national = national.slice(2)
  else if (national.startsWith("0")) national = national.slice(1)
  if (!/^7\d{8}$/.test(national)) return null
  return `+40${national}`
}

export function parsePlanckWeekLeadSubjects(value: unknown): WorkshopSubject[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<WorkshopSubject>()
  const result: WorkshopSubject[] = []
  for (const item of value) {
    if (!isWorkshopSubject(item) || seen.has(item)) continue
    seen.add(item)
    result.push(item)
  }
  return result
}

export function mergePlanckWeekLeadSubjects(
  current: unknown,
  next: WorkshopSubject[],
): WorkshopSubject[] {
  return parsePlanckWeekLeadSubjects([
    ...(Array.isArray(current) ? current : []),
    ...next,
  ])
}

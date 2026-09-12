import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import {
  mergePlanckWeekLeadSubjects,
  normalizePlanckWeekFizicaName,
  normalizeRoMobilePhone,
  parsePlanckWeekLeadSubjects,
} from "@/lib/planck-week-fizica-lead"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 8
const RATE_LIMIT_WINDOW = 15 * 60 * 1000

const bodySchema = z.object({
  name: z.string(),
  phone: z.string(),
  subjects: z.array(z.string()).optional(),
})

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }
  if (record.count >= RATE_LIMIT_MAX) return true
  record.count += 1
  return false
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Prea multe încercări. Încearcă din nou peste câteva minute." },
        { status: 429 },
      )
    }

    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Completează numele și numărul de telefon." }, { status: 400 })
    }

    const name = normalizePlanckWeekFizicaName(parsed.data.name)
    const phone = normalizeRoMobilePhone(parsed.data.phone)
    const subjects = parsePlanckWeekLeadSubjects(parsed.data.subjects)
    if (!name) {
      return NextResponse.json({ error: "Introdu numele complet." }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json(
        { error: "Introdu un număr de telefon valid (ex. 07xxxxxxxx)." },
        { status: 400 },
      )
    }
    if (subjects.length === 0) {
      return NextResponse.json({ error: "Alege cel puțin o materie." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const { data: existing, error: lookupError } = await supabase
      .from("planck_week_fizica_leads")
      .select("subjects")
      .eq("phone", phone)
      .maybeSingle()

    if (lookupError) {
      logger.error("[planck-week/fizica-lead] lookup failed:", lookupError)
      return NextResponse.json(
        { error: "Nu am putut salva rezervarea. Încearcă din nou." },
        { status: 500 },
      )
    }

    const nextSubjects = mergePlanckWeekLeadSubjects(existing?.subjects, subjects)
    const { error } = await supabase.from("planck_week_fizica_leads").upsert(
      { name, phone, subjects: nextSubjects },
      { onConflict: "phone" },
    )

    if (error) {
      logger.error("[planck-week/fizica-lead] upsert failed:", error)
      return NextResponse.json(
        { error: "Nu am putut salva rezervarea. Încearcă din nou." },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, alreadyRegistered: Boolean(existing) })
  } catch (err) {
    logger.error("[planck-week/fizica-lead] error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

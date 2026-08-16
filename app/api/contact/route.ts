import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

const SUBJECT_VALUES = [
  "cursuri",
  "tehnic",
  "abonament",
  "colaborare",
  "feedback",
  "altul",
] as const

const contactSchema = z.object({
  name: z.string().trim().min(2, "Numele trebuie să aibă cel puțin 2 caractere.").max(120),
  email: z.string().trim().email("Adresa de email nu este validă.").max(254),
  subject: z.enum(SUBJECT_VALUES, { errorMap: () => ({ message: "Selectează un subiect." }) }),
  message: z
    .string()
    .trim()
    .min(10, "Mesajul trebuie să aibă cel puțin 10 caractere.")
    .max(5000, "Mesajul este prea lung."),
})

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000

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

function getClientIP(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          message: "Prea multe mesaje. Te rugăm să încerci din nou peste câteva minute.",
        },
        { status: 429 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: "Cerere invalidă." },
        { status: 400 }
      )
    }

    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Verifică câmpurile și încearcă din nou."
      return NextResponse.json({ success: false, message: first }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      subject: parsed.data.subject,
      message: parsed.data.message,
      user_id: user?.id ?? null,
    })

    if (error) {
      logger.error("contact_messages insert error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Nu am putut trimite mesajul. Încearcă din nou peste câteva minute.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Mesajul a fost trimis. Îți răspundem în maxim 24 de ore în zilele lucrătoare.",
    })
  } catch (error) {
    logger.error("Contact form error:", error)
    return NextResponse.json(
      { success: false, message: "A apărut o eroare. Te rugăm să încerci din nou." },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Metoda GET nu este permisă pentru acest endpoint" },
    { status: 405 }
  )
}

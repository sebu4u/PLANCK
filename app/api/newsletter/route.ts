import { NextRequest, NextResponse } from "next/server"

import { addSubscriberToMailerLiteGroup } from "@/lib/mailerlite/client"
import { logger } from "@/lib/logger"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 60 * 1000

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
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(request: NextRequest) {
  try {
    const groupId = process.env.MAILERLITE_GROUP_ID
    if (!process.env.MAILERLITE_API_KEY || !groupId) {
      logger.error("MailerLite configuration missing")
      return NextResponse.json(
        {
          success: false,
          message:
            "Configurarea newsletter-ului nu este completă. Te rugăm să contactezi administratorul.",
        },
        { status: 500 }
      )
    }

    const clientIP = getClientIP(request)
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          message: "Prea multe încercări. Te rugăm să încerci din nou în câteva minute.",
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Adresa de email este obligatorie" },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Adresa de email nu este validă" },
        { status: 400 }
      )
    }

    const sanitizedEmail = email.trim().toLowerCase()
    const result = await addSubscriberToMailerLiteGroup(sanitizedEmail, groupId)

    return NextResponse.json({
      success: true,
      message: "Te-ai abonat cu succes la newsletter!",
      data: result,
    })
  } catch (error) {
    logger.error("Newsletter subscription error:", error)

    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          {
            success: false,
            message: "Această adresă de email este deja abonată la newsletter",
          },
          { status: 409 }
        )
      }
    }

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

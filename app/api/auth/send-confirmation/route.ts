import { after } from "next/server"
import { NextRequest, NextResponse } from "next/server"

import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS } from "@/lib/email-verification"
import { queueEmailConfirmation, sendConfirmationEmail } from "@/lib/email-verification-server"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(token)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user?.email) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const result = await queueEmailConfirmation({
      userId: userData.user.id,
      email: userData.user.email,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    if ("alreadyVerified" in result && result.alreadyVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }
    if ("skipped" in result && result.skipped === "rate_limit") {
      return NextResponse.json(
        {
          error: `Așteaptă ${EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS} de secunde înainte să retrimiți.`,
          skipped: "rate_limit",
        },
        { status: 429 },
      )
    }
    if ("to" in result && "confirmUrl" in result) {
      const to = result.to
      const confirmUrl = result.confirmUrl
      after(() => {
        void sendConfirmationEmail({ to, confirmUrl }).then((sent) => {
          if (!sent.ok) {
            logger.error("[auth/send-confirmation] send failed:", sent.message)
          }
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("[auth/send-confirmation] unexpected error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

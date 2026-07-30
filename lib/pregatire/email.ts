import "server-only"

import { Resend } from "resend"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress() {
  return process.env.WORKSHOP_EMAIL_FROM || "Planck Pregatire <onboarding@resend.dev>"
}

export async function sendWorkshopReminderEmail(input: {
  to: string
  workshopTitle: string
  workshopId: string
  startsAt: string
  reminderKind: "24h" | "30m"
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, message: "RESEND_API_KEY missing" }
  }

  const when = formatWorkshopDateTime(input.startsAt)
  const timing =
    input.reminderKind === "24h" ? "în 24 de ore" : "în 30 de minute"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://planck.academy"
  const url = `${siteUrl.replace(/\/$/, "")}/pregatire/${input.workshopId}`

  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: `Pregătire ${timing}: ${input.workshopTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <p style="font-size: 14px; color: #b45309; font-weight: 600; margin: 0 0 8px;">Planck Pregatire</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">${escapeHtml(input.workshopTitle)}</h1>
          <p style="font-size: 15px; line-height: 1.5; color: #374151;">
            Pregătirea ta începe <strong>${escapeHtml(timing)}</strong> — ${escapeHtml(when)}.
          </p>
          <p style="margin: 24px 0;">
            <a href="${url}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">
              Deschide pregătirea
            </a>
          </p>
          <p style="font-size: 13px; color: #9ca3af;">Ai deblocat această sesiune pe Planck. Link-ul Meet este disponibil pe pagină.</p>
        </div>
      `,
    })

    if (result.error) {
      return { ok: false, message: result.error.message }
    }

    return { ok: true, id: result.data?.id }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

import "server-only"

import { Resend } from "resend"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"
import { WORKSHOP_SUBJECT_LABELS, type WorkshopSubject } from "@/lib/pregatire/types"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromAddress() {
  return process.env.WORKSHOP_EMAIL_FROM || "Planck Pregatire <onboarding@resend.dev>"
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendPlanckWeekMagicLinkEmail(input: {
  to: string
  name: string
  confirmUrl: string
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, message: "RESEND_API_KEY missing" }
  }

  const greeting = input.name.trim() ? `Salut, ${escapeHtml(input.name.trim())}.` : "Salut."

  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: "Activează-ți locul la Planck Week",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <p style="font-size: 14px; color: #7C5CFC; font-weight: 600; margin: 0 0 8px;">Planck Week</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">Confirmă-ți locul la meditațiile live</h1>
          <p style="font-size: 15px; line-height: 1.5; color: #374151;">
            ${greeting} Deschide linkul ca să intri în programul 10–14 septembrie. Fără parolă, fără card.
          </p>
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(input.confirmUrl)}" style="display:inline-block;background:#7C5CFC;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">
              Activează locul
            </a>
          </p>
          <p style="font-size: 13px; color: #9ca3af;">Dacă nu ai cerut tu rezervarea, poți ignora acest email.</p>
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

export type PlanckWeekClaimedSession = {
  title: string
  startsAt: string
  subject: WorkshopSubject
}

export async function sendPlanckWeekClaimSummaryEmail(input: {
  to: string
  name: string
  sessions: PlanckWeekClaimedSession[]
  pregatireUrl: string
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, message: "RESEND_API_KEY missing" }
  }

  const greeting = input.name.trim() ? `Salut, ${escapeHtml(input.name.trim())}.` : "Salut."
  const rows = input.sessions
    .map((session) => {
      const label = WORKSHOP_SUBJECT_LABELS[session.subject]
      return `<li style="margin:0 0 8px;"><strong>${escapeHtml(label)}</strong> — ${escapeHtml(session.title)}<br /><span style="color:#6b7280;font-size:13px;">${escapeHtml(formatWorkshopDateTime(session.startsAt))}</span></li>`
    })
    .join("")

  const listHtml =
    input.sessions.length > 0
      ? `<ul style="padding-left:18px;margin:16px 0;">${rows}</ul>`
      : `<p style="font-size:15px;line-height:1.5;color:#374151;">Deschide programul live ca să rezervi ședințele care mai au locuri.</p>`

  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: "Locul tău la Planck Week e activ",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <p style="font-size: 14px; color: #7C5CFC; font-weight: 600; margin: 0 0 8px;">Planck Week</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">Ești înscris la meditațiile live</h1>
          <p style="font-size: 15px; line-height: 1.5; color: #374151;">${greeting} Locul tău e rezervat pe platformă.</p>
          ${listHtml}
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(input.pregatireUrl)}" style="display:inline-block;background:#7C5CFC;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">
              Vezi programul live
            </a>
          </p>
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

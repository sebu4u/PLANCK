import "server-only"

import { createHash, randomBytes } from "crypto"
import { Resend } from "resend"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS,
  EMAIL_UNVERIFIED_CODE,
} from "@/lib/email-verification"
import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const TOKEN_TTL_HOURS = 48

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.planck.academy").replace(/\/$/, "")
}

function fromAddress() {
  return process.env.AUTH_EMAIL_FROM || process.env.WORKSHOP_EMAIL_FROM || "Planck <onboarding@resend.dev>"
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function isProfileEmailVerified(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    logger.warn("[email-verification] lookup failed:", error)
    return true
  }

  return data?.email_verified !== false
}

export async function assertEmailVerified(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: 403; code: string; error: string }> {
  const verified = await isProfileEmailVerified(supabase, userId)
  if (verified) return { ok: true }
  return {
    ok: false,
    status: 403,
    code: EMAIL_UNVERIFIED_CODE,
    error: "Confirmă-ți emailul ca să continui.",
  }
}

export async function sendConfirmationEmail(input: {
  to: string
  confirmUrl: string
}): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return { ok: false, message: "RESEND_API_KEY missing" }
  }

  const resend = new Resend(key)
  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: "Confirmă-ți emailul pe Planck",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <p style="font-size: 14px; color: #6d28d9; font-weight: 600; margin: 0 0 8px;">Planck</p>
          <h1 style="font-size: 22px; margin: 0 0 12px;">Confirmă-ți adresa de email</h1>
          <p style="font-size: 15px; line-height: 1.5; color: #374151;">
            Apasă butonul de mai jos ca să confirmi emailul. Contul tău e deja activ — confirmarea e doar ca să nu pierzi notificările și sesiunile live.
          </p>
          <p style="margin: 24px 0;">
            <a href="${escapeHtml(input.confirmUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">
              Confirmă emailul
            </a>
          </p>
          <p style="font-size: 13px; color: #9ca3af;">Dacă nu ai cerut acest email, îl poți ignora.</p>
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

export type QueueConfirmationResult =
  | { ok: true; alreadyVerified: true }
  | { ok: true; skipped: "rate_limit" }
  | { ok: true; to: string; confirmUrl: string }
  | { ok: false; error: string; status: number }

export async function queueEmailConfirmation(input: {
  userId: string
  email: string
}): Promise<QueueConfirmationResult> {
  const admin = getServiceRoleSupabase()

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("email_verified")
    .eq("user_id", input.userId)
    .maybeSingle()

  if (profileError) {
    logger.error("[email-verification] profile read failed:", profileError)
    return { ok: false, error: "Nu am putut verifica statusul emailului.", status: 500 }
  }

  if (profile?.email_verified === true) {
    return { ok: true, alreadyVerified: true }
  }

  const { data: recent } = await admin
    .from("email_confirmation_tokens")
    .select("created_at")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recent?.created_at) {
    const ageMs = Date.now() - new Date(recent.created_at).getTime()
    if (ageMs < EMAIL_CONFIRMATION_RATE_LIMIT_SECONDS * 1000) {
      return { ok: true, skipped: "rate_limit" }
    }
  }

  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await admin.from("email_confirmation_tokens").insert({
    user_id: input.userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  if (insertError) {
    logger.error("[email-verification] token insert failed:", insertError)
    return { ok: false, error: "Nu am putut pregăti emailul de confirmare.", status: 500 }
  }

  return {
    ok: true,
    to: input.email,
    confirmUrl: `${siteUrl()}/auth/confirm-email?token=${encodeURIComponent(token)}`,
  }
}

export async function confirmEmailWithToken(token: string): Promise<{
  ok: true
} | { ok: false; error: string }> {
  const trimmed = token.trim()
  if (!trimmed) {
    return { ok: false, error: "Link invalid." }
  }

  const admin = getServiceRoleSupabase()
  const tokenHash = hashToken(trimmed)

  const { data: row, error } = await admin
    .from("email_confirmation_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, error: "Link invalid sau expirat." }
  }
  if (row.used_at) {
    return { ok: false, error: "Link-ul a fost deja folosit." }
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "Link-ul a expirat. Retrimite emailul de confirmare." }
  }

  const now = new Date().toISOString()
  const { error: usedError } = await admin
    .from("email_confirmation_tokens")
    .update({ used_at: now })
    .eq("id", row.id)

  if (usedError) {
    logger.error("[email-verification] token consume failed:", usedError)
    return { ok: false, error: "Nu am putut confirma emailul." }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ email_verified: true })
    .eq("user_id", row.user_id)

  if (profileError) {
    logger.error("[email-verification] profile update failed:", profileError)
    return { ok: false, error: "Nu am putut confirma emailul." }
  }

  await admin
    .from("email_confirmation_tokens")
    .update({ used_at: now })
    .eq("user_id", row.user_id)
    .is("used_at", null)

  return { ok: true }
}

/**
 * Google/GitHub OAuth în fereastră popup, fără redirect la întreaga pagină.
 * Deschide popup-ul sincron (about:blank) înainte de await ca să evite blocarea de către browser.
 *
 * În Supabase Dashboard → Authentication → URL Configuration, adaugă la redirect URLs:
 * `http://localhost:3000/auth/callback` și URL-ul de producție (același path `/auth/callback`).
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export const AUTH_MESSAGE_SUCCESS = "auth-success" as const
export const AUTH_MESSAGE_ERROR = "auth-error" as const

export type AuthPopupMessage =
  | { type: typeof AUTH_MESSAGE_SUCCESS }
  | { type: typeof AUTH_MESSAGE_ERROR; message?: string }

const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600

export function getCenteredPopupFeatures(): string {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2
  return [
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${Math.max(0, left)}`,
    `top=${Math.max(0, top)}`,
    "scrollbars=yes",
    "resizable=yes",
  ].join(",")
}

export type OAuthPopupResult =
  | { error: null }
  | { error: Error; popupBlocked?: boolean }

export async function signInWithOAuthPopup(
  supabase: SupabaseClient,
  provider: "google" | "github"
): Promise<OAuthPopupResult> {
  const redirectTo = `${window.location.origin}/auth/callback`

  const popup = window.open("about:blank", "planck-oauth", getCenteredPopupFeatures())
  if (!popup) {
    return { error: new Error("POPUP_BLOCKED"), popupBlocked: true }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      popup.close()
      return { error }
    }

    if (!data?.url) {
      popup.close()
      return { error: new Error("Nu s-a primit URL de autentificare.") }
    }

    popup.location.href = data.url
    return { error: null }
  } catch (e) {
    try {
      popup.close()
    } catch {
      /* ignore */
    }
    return { error: e instanceof Error ? e : new Error(String(e)) }
  }
}

export function isAuthPopupMessage(data: unknown): data is AuthPopupMessage {
  if (!data || typeof data !== "object") return false
  const t = (data as { type?: unknown }).type
  return t === AUTH_MESSAGE_SUCCESS || t === AUTH_MESSAGE_ERROR
}

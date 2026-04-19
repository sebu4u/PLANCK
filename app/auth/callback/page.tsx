"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AUTH_MESSAGE_ERROR, AUTH_MESSAGE_SUCCESS, type AuthPopupMessage } from "@/lib/oauth-popup"

function postToOpener(payload: AuthPopupMessage) {
  if (typeof window === "undefined" || !window.opener) return
  try {
    window.opener.postMessage(payload, window.location.origin)
  } catch {
    /* ignore */
  }
}

/**
 * Pagină încărcată în popup după OAuth.
 * Schimbă codul/token-ul în sesiune, notifică fereastra părinte, apoi se închide.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const href = window.location.href
      const url = new URL(href)

      const searchErr = url.searchParams.get("error")
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""))
      const hashErr = hash.get("error")
      const oauthError = searchErr || hashErr

      if (oauthError) {
        const desc = url.searchParams.get("error_description") || hash.get("error_description") || oauthError
        postToOpener({
          type: AUTH_MESSAGE_ERROR,
          message: desc.replace(/\+/g, " "),
        })
        window.close()
        return
      }

      try {
        const code = url.searchParams.get("code")
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(href)
          if (exchangeError) {
            if (!cancelled) {
              postToOpener({ type: AUTH_MESSAGE_ERROR, message: exchangeError.message })
            }
            window.close()
            return
          }
        }

        await supabase.auth.getSession()
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          if (!cancelled) {
            postToOpener({ type: AUTH_MESSAGE_ERROR, message: sessionError.message })
          }
          window.close()
          return
        }

        if (!session) {
          if (!cancelled) {
            postToOpener({
              type: AUTH_MESSAGE_ERROR,
              message: "Sesiune indisponibilă după autentificare. Încearcă din nou.",
            })
          }
        } else if (!cancelled) {
          postToOpener({ type: AUTH_MESSAGE_SUCCESS })
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Eroare la finalizarea autentificării."
        if (!cancelled) postToOpener({ type: AUTH_MESSAGE_ERROR, message: msg })
      }

      window.close()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}

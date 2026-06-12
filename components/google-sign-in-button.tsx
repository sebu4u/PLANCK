"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { GoogleLogin, useGoogleOAuth, type CredentialResponse } from "@react-oauth/google"
import { signInWithGoogleIdToken } from "@/lib/google-sign-in"
import { createGoogleSignInNonce, type GoogleSignInNonce } from "@/lib/google-nonce"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import { supabase } from "@/lib/supabaseClient"
import { useGoogleOAuthBridge } from "@/components/google-oauth-bridge"
import { cn } from "@/lib/utils"

type GoogleSignInButtonProps = {
  className?: string
  disabled?: boolean
  onStart?: () => void
  onResult: (result: OAuthPopupResult) => void
  children: ReactNode
}

const missingClientIdMessage =
  "Google Sign-In nu este configurat în producție. Adaugă NEXT_PUBLIC_GOOGLE_CLIENT_ID în Vercel și redeploy."

function GoogleSignInButtonUnavailable({
  className,
  disabled,
  onResult,
  children,
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={() =>
        onResult({
          error: new Error(missingClientIdMessage),
        })
      }
    >
      {children}
    </button>
  )
}

function GoogleSignInButtonInner({
  className,
  disabled,
  onStart,
  onResult,
  children,
}: GoogleSignInButtonProps) {
  const { scriptLoadedSuccessfully } = useGoogleOAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(false)
  const credentialReceivedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popupRecoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removePopupRecoveryListenersRef = useRef<(() => void) | null>(null)
  const pendingNonceRef = useRef<string | null>(null)
  const [noncePair, setNoncePair] = useState<GoogleSignInNonce | null>(null)
  const [googleButtonReady, setGoogleButtonReady] = useState(false)

  const refreshNonce = useCallback(async () => {
    const nextNonce = await createGoogleSignInNonce()
    pendingNonceRef.current = nextNonce.nonce
    setNoncePair(nextNonce)
    setGoogleButtonReady(false)
  }, [])

  useEffect(() => {
    void refreshNonce()
  }, [refreshNonce])

  useEffect(() => {
    if (!noncePair || !scriptLoadedSuccessfully) {
      setGoogleButtonReady(false)
      return
    }

    const timer = window.setInterval(() => {
      const hasGoogleButton = Boolean(
        containerRef.current?.querySelector("iframe, div[role='button']")
      )
      if (hasGoogleButton) {
        setGoogleButtonReady(true)
        window.clearInterval(timer)
      }
    }, 100)

    const timeout = window.setTimeout(() => {
      window.clearInterval(timer)
    }, 5000)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [noncePair, scriptLoadedSuccessfully])

  const clearPendingTimeout = useCallback(() => {
    if (!timeoutRef.current) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const clearPopupRecovery = useCallback(() => {
    if (popupRecoveryTimeoutRef.current) {
      clearTimeout(popupRecoveryTimeoutRef.current)
      popupRecoveryTimeoutRef.current = null
    }
    removePopupRecoveryListenersRef.current?.()
    removePopupRecoveryListenersRef.current = null
  }, [])

  const finish = useCallback(
    (result: OAuthPopupResult) => {
      clearPendingTimeout()
      clearPopupRecovery()
      activeRef.current = false
      pendingNonceRef.current = null
      onResult(result)
      void refreshNonce()
    },
    [clearPendingTimeout, clearPopupRecovery, onResult, refreshNonce]
  )

  const finishCancelled = useCallback(() => {
    if (!activeRef.current || credentialReceivedRef.current) return
    finish({ error: null, cancelled: true })
  }, [finish])

  const attachPopupRecovery = useCallback(() => {
    clearPopupRecovery()

    const scheduleCancelIfStillActive = () => {
      if (popupRecoveryTimeoutRef.current) {
        clearTimeout(popupRecoveryTimeoutRef.current)
      }

      popupRecoveryTimeoutRef.current = setTimeout(() => {
        popupRecoveryTimeoutRef.current = null
        finishCancelled()
      }, 800)
    }

    const onWindowFocus = () => {
      if (!activeRef.current) return
      scheduleCancelIfStillActive()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !activeRef.current) return
      scheduleCancelIfStillActive()
    }

    window.addEventListener("focus", onWindowFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)
    removePopupRecoveryListenersRef.current = () => {
      window.removeEventListener("focus", onWindowFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [clearPopupRecovery, finishCancelled])

  const start = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true
    credentialReceivedRef.current = false
    onStart?.()
    attachPopupRecovery()
    timeoutRef.current = setTimeout(() => {
      finish({ error: new Error("Autentificarea cu Google a expirat. Încearcă din nou.") })
    }, 60_000)
  }, [attachPopupRecovery, finish, onStart])

  const triggerGoogleButton = useCallback(() => {
    const googleTarget = containerRef.current?.querySelector<HTMLElement>("iframe, div[role='button']")
    if (!googleTarget) return false
    googleTarget.click()
    return true
  }, [])

  const handleFallbackClick = useCallback(() => {
    if (disabled || activeRef.current) return

    if (!scriptLoadedSuccessfully) {
      onResult({
        error: new Error("Google Sign-In se încarcă. Încearcă din nou peste câteva secunde."),
      })
      return
    }

    if (!noncePair || !googleButtonReady) {
      onResult({
        error: new Error("Butonul Google nu este încă pregătit. Reîncarcă pagina și încearcă din nou."),
      })
      return
    }

    start()
    if (!triggerGoogleButton()) {
      activeRef.current = false
      clearPendingTimeout()
      clearPopupRecovery()
      onResult({
        error: new Error(
          `Autentificarea Google nu este disponibilă pe ${window.location.origin}. Adaugă acest URL la Authorized JavaScript origins în Google Cloud Console.`
        ),
      })
    }
  }, [
    clearPendingTimeout,
    clearPopupRecovery,
    disabled,
    googleButtonReady,
    noncePair,
    onResult,
    scriptLoadedSuccessfully,
    start,
    triggerGoogleButton,
  ])

  const handleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      credentialReceivedRef.current = true
      const credential = credentialResponse.credential
      const nonce = pendingNonceRef.current

      if (!credential) {
        finish({ error: new Error("Nu s-a primit token-ul Google pentru autentificare.") })
        return
      }

      if (!nonce) {
        finish({ error: new Error("Nonce-ul de autentificare Google lipsește. Încearcă din nou.") })
        return
      }

      finish(await signInWithGoogleIdToken(supabase, credential, nonce))
    },
    [finish]
  )

  const handleError = useCallback(() => {
    finishCancelled()
  }, [finishCancelled])

  useEffect(() => {
    return () => {
      clearPendingTimeout()
      clearPopupRecovery()
    }
  }, [clearPendingTimeout, clearPopupRecovery])

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        className={className}
        onClick={handleFallbackClick}
      >
        {children}
      </button>

      {noncePair ? (
        <div
          ref={containerRef}
          aria-hidden
          className={cn(
            "absolute inset-0 z-10 overflow-hidden opacity-[0.01]",
            disabled || activeRef.current || !googleButtonReady
              ? "pointer-events-none"
              : "pointer-events-auto"
          )}
        >
          <GoogleLogin
            key={noncePair.hashedNonce}
            nonce={noncePair.hashedNonce}
            onSuccess={handleSuccess}
            onError={handleError}
            text="continue_with"
            shape="pill"
            size="large"
            ux_mode="popup"
            width={400}
            click_listener={start}
          />
        </div>
      ) : null}
    </div>
  )
}

export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const { isGoogleConfigured } = useGoogleOAuthBridge()

  if (!isGoogleConfigured) {
    return <GoogleSignInButtonUnavailable {...props} />
  }

  return <GoogleSignInButtonInner {...props} />
}

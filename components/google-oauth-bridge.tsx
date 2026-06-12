"use client"

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google"
import type { SupabaseClient } from "@supabase/supabase-js"
import { signInWithGoogleIdToken } from "@/lib/google-sign-in"
import { createGoogleSignInNonce, type GoogleSignInNonce } from "@/lib/google-nonce"
import type { OAuthPopupResult } from "@/lib/oauth-popup"
import { supabase } from "@/lib/supabaseClient"

type GoogleOAuthBridgeContextValue = {
  isGoogleConfigured: boolean
  loginWithGoogle: (supabase: SupabaseClient) => Promise<OAuthPopupResult>
}

const GoogleOAuthBridgeContext = createContext<GoogleOAuthBridgeContextValue | undefined>(undefined)

const missingClientIdResult = (): OAuthPopupResult => ({
  error: new Error("Lipsește NEXT_PUBLIC_GOOGLE_CLIENT_ID pentru autentificarea cu Google."),
})

export function GoogleOAuthBridgeProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return (
      <GoogleOAuthBridgeContext.Provider
        value={{
          isGoogleConfigured: false,
          loginWithGoogle: async () => missingClientIdResult(),
        }}
      >
        {children}
      </GoogleOAuthBridgeContext.Provider>
    )
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleOAuthBridgeInner>{children}</GoogleOAuthBridgeInner>
    </GoogleOAuthProvider>
  )
}

function GoogleOAuthBridgeInner({ children }: { children: ReactNode }) {
  const loginWithGoogle = useCallback(async (): Promise<OAuthPopupResult> => {
    return {
      error: new Error("Autentificarea cu Google trebuie pornită din butonul Google vizibil."),
    }
  }, [])

  return (
    <GoogleOAuthBridgeContext.Provider value={{ isGoogleConfigured: true, loginWithGoogle }}>
      {children}
    </GoogleOAuthBridgeContext.Provider>
  )
}

export function useGoogleOAuthBridge() {
  const context = useContext(GoogleOAuthBridgeContext)
  if (!context) {
    throw new Error("useGoogleOAuthBridge must be used within GoogleOAuthBridgeProvider")
  }
  return context
}

type GoogleIdentityButtonOverlayProps = {
  disabled?: boolean
  onStart?: () => void
  onResult: (result: OAuthPopupResult) => void
}

export function GoogleIdentityButtonOverlay({
  disabled,
  onStart,
  onResult,
}: GoogleIdentityButtonOverlayProps) {
  const { isGoogleConfigured } = useGoogleOAuthBridge()
  const activeRef = useRef(false)
  const credentialReceivedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popupRecoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removePopupRecoveryListenersRef = useRef<(() => void) | null>(null)
  const pendingNonceRef = useRef<string | null>(null)
  const [noncePair, setNoncePair] = useState<GoogleSignInNonce | null>(null)

  const refreshNonce = useCallback(async () => {
    const nextNonce = await createGoogleSignInNonce()
    pendingNonceRef.current = nextNonce.nonce
    setNoncePair(nextNonce)
  }, [])

  useEffect(() => {
    if (!isGoogleConfigured) return
    void refreshNonce()
  }, [isGoogleConfigured, refreshNonce])

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

  if (!isGoogleConfigured || !noncePair) return null

  return (
    <div
      aria-hidden
      style={{
        alignItems: "center",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        opacity: 0.01,
        overflow: "hidden",
        pointerEvents: disabled || activeRef.current ? "none" : "auto",
        position: "absolute",
        zIndex: 10,
      }}
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
  )
}

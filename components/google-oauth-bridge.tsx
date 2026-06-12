"use client"

import React, { createContext, ReactNode, useCallback, useContext } from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { OAuthPopupResult } from "@/lib/oauth-popup"

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

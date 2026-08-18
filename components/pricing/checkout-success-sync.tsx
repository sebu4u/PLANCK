"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

export function CheckoutSuccessSync() {
  const searchParams = useSearchParams()
  const { user, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [syncingSessionId, setSyncingSessionId] = useState<string | null>(null)

  useEffect(() => {
    const status = searchParams.get("checkout")
    const sessionId = searchParams.get("session_id")

    if (status === "success") {
      toast({
        title: "Plată reușită",
        description: "Abonamentul va fi activat în câteva secunde.",
      })
    } else if (status === "canceled") {
      toast({
        title: "Plata a fost anulată",
        description: "Poți relua rezervarea oricând.",
      })
    }

    if (!sessionId || !user) return
    if (syncingSessionId === sessionId) return
    if (status !== "success") return

    const syncSubscription = async () => {
      try {
        setSyncingSessionId(sessionId)
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) return

        const response = await fetch("/api/stripe/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "Nu am putut sincroniza abonamentul.")
        }
        await refreshProfile()
      } catch (error) {
        toast({
          title: "Sincronizare eșuată",
          description: error instanceof Error ? error.message : "Încearcă din nou.",
          variant: "destructive",
        })
      }
    }

    void syncSubscription()
  }, [refreshProfile, searchParams, syncingSessionId, toast, user])

  return null
}

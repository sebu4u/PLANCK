"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { PLANCK_PASS_XP_UPDATED_EVENT } from "@/lib/planckpass/award-client"
import { unlockPlanckPassClaimAudio } from "@/lib/planckpass/claim-sounds"
import type { PlanckPassClaimResult, PlanckPassState } from "@/lib/planckpass/types"

const EMPTY: PlanckPassState = {
  season: null,
  currentTier: 0,
  xpCurrent: 0,
  xpMax: 150,
  xpTotal: 0,
  tiers: [],
  canClaimPremium: false,
  coins: 0,
  eloBoostUntil: null,
  streakFreezeUntil: null,
}

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function usePlanckPass() {
  const [state, setState] = useState<PlanckPassState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [reveal, setReveal] = useState<PlanckPassClaimResult | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setState(EMPTY)
        return
      }
      const res = await fetch("/api/planckpass", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut încărca pass-ul.")
      setState(json as PlanckPassState)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onXp = () => {
      void refresh()
    }
    window.addEventListener(PLANCK_PASS_XP_UPDATED_EVENT, onXp)
    // Also refresh when tab becomes visible (solve happened on another page)
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.removeEventListener(PLANCK_PASS_XP_UPDATED_EVENT, onXp)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [refresh])

  const claim = useCallback(
    async (tierNumber: number) => {
      // Unlock audio on the claim tap so the reveal open SFX can play after the API returns.
      unlockPlanckPassClaimAudio()

      setClaiming(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Necesită autentificare.")
        const res = await fetch("/api/planckpass/claim", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tierNumber }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Claim eșuat.")
        setReveal(json.reward as PlanckPassClaimResult)
        await refresh()
        return json.reward as PlanckPassClaimResult
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Eroare"
        setError(msg)
        throw e
      } finally {
        setClaiming(false)
      }
    },
    [refresh],
  )

  const dismissReveal = useCallback(() => setReveal(null), [])

  return {
    state,
    loading,
    error,
    claiming,
    reveal,
    claim,
    dismissReveal,
    refresh,
  }
}

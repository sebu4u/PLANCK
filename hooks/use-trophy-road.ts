"use client"

import { useCallback, useEffect, useState } from "react"
import { unlockPlanckPassClaimAudio } from "@/lib/planckpass/claim-sounds"
import { supabase } from "@/lib/supabaseClient"
import type { TrophyRoadClaimResult, TrophyRoadState } from "@/lib/trophy-road/types"

const EMPTY: TrophyRoadState = {
  userElo: 500,
  milestones: [],
  claimableCount: 0,
  coins: 0,
  eloBoostUntil: null,
  streakFreezeUntil: null,
}

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function useTrophyRoad(enabled = true) {
  const [state, setState] = useState<TrophyRoadState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [reveal, setReveal] = useState<TrophyRoadClaimResult | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setState(EMPTY)
        return
      }
      const res = await fetch("/api/trophy-road", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut încărca Trophy Road.")
      setState(json as TrophyRoadState)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const claim = useCallback(
    async (milestoneId: string) => {
      unlockPlanckPassClaimAudio()
      setClaiming(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Necesită autentificare.")
        const res = await fetch("/api/trophy-road/claim", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ milestoneId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "Claim eșuat.")
        setReveal(json.reward as TrophyRoadClaimResult)
        await refresh()
        return json.reward as TrophyRoadClaimResult
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

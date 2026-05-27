"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"

export const LP_TEST_MAX_BATTERIES = 3

export interface LpTestBatteryState {
  count: number
  nextRefillAt: string | null
  refillQueue: string[]
}

export function useLpTestBatteryState() {
  const { user } = useAuth()
  const [state, setState] = useState<LpTestBatteryState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc("get_lp_test_battery_state")
    if (rpcError) {
      setError("Nu am putut încărca bateriile.")
      setLoading(false)
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      setState({ count: LP_TEST_MAX_BATTERIES, nextRefillAt: null, refillQueue: [] })
    } else {
      const refillQueue = Array.isArray(row.refill_queue)
        ? (row.refill_queue as string[])
        : []
      setState({
        count: typeof row.count === "number" ? row.count : Number(row.count ?? 0),
        nextRefillAt: typeof row.next_refill_at === "string" ? row.next_refill_at : null,
        refillQueue,
      })
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [refresh])

  return { state, setState, loading, error, refresh }
}

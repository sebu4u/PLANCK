"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  borderPresetIdFromCosmetic,
  type BorderPresetId,
} from "@/lib/planckpass/border-presets"

/**
 * Batch-resolve equipped border preset IDs for a set of user IDs.
 * Relies on public SELECT RLS on user_cosmetics_equipped + planckpass_cosmetics.
 */
export function useEquippedBorderPresets(userIds: string[]) {
  const [map, setMap] = useState<Record<string, BorderPresetId | null>>({})
  const key = userIds.slice().sort().join(",")

  const load = useCallback(async () => {
    const ids = key ? key.split(",").filter(Boolean) : []
    if (ids.length === 0) {
      setMap({})
      return
    }

    const { data: rows } = await supabase
      .from("user_cosmetics_equipped")
      .select("user_id, border_id")
      .in("user_id", ids)

    const borderIds = [
      ...new Set(
        (rows ?? [])
          .map((r) => r.border_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ]

    let cosmeticsById = new Map<string, { id: string; meta?: Record<string, unknown> | null }>()
    if (borderIds.length > 0) {
      const { data: cos } = await supabase
        .from("planckpass_cosmetics")
        .select("id, meta")
        .in("id", borderIds)
      cosmeticsById = new Map((cos ?? []).map((c) => [c.id, c]))
    }

    const next: Record<string, BorderPresetId | null> = {}
    for (const id of ids) next[id] = null
    for (const row of rows ?? []) {
      const cos = row.border_id ? cosmeticsById.get(row.border_id) : null
      next[row.user_id] = borderPresetIdFromCosmetic(cos ?? null)
    }
    setMap(next)
  }, [key])

  useEffect(() => {
    void load()
  }, [load])

  return map
}

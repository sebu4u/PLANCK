"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { BadgePresetPreview } from "@/components/planckpass/badges/badge-preset-layer"
import { BorderPresetPreview } from "@/components/planckpass/borders/border-preset-layer"
import { supabase } from "@/lib/supabaseClient"
import { badgePresetIdFromCosmetic } from "@/lib/planckpass/badge-presets"
import { borderPresetIdFromCosmetic } from "@/lib/planckpass/border-presets"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PlanckPassCosmeticKind } from "@/lib/planckpass/types"

type InventoryItem = {
  cosmeticId: string
  acquiredAt: string
  source: string
  cosmetic: {
    id: string
    kind: PlanckPassCosmeticKind
    name: string
    imageUrl: string
    meta?: Record<string, unknown> | null
  } | null
}

type Equipped = {
  iconId: string | null
  borderId: string | null
  badgeId: string | null
  skinId: string | null
}

const KIND_LABELS: Record<PlanckPassCosmeticKind, string> = {
  icon: "Iconițe",
  border: "Borduri",
  badge: "Badge-uri",
  skin: "Skin-uri IDE",
}

const COSMETICS_CHANGED_EVENT = "planckpass:cosmetics-changed"

function emitCosmeticsChanged(payload: { equipped: Equipped; inventory: InventoryItem[] }) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(COSMETICS_CHANGED_EVENT, { detail: payload }))
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sesiune expirată.")
  return { Authorization: `Bearer ${token}` }
}

export function PlanckPassInventory({
  className,
  onEquippedChange,
}: {
  className?: string
  onEquippedChange?: (payload: {
    equipped: Equipped
    inventory: InventoryItem[]
  }) => void
}) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [equipped, setEquipped] = useState<Equipped>({
    iconId: null,
    borderId: null,
    badgeId: null,
    skinId: null,
  })
  const [tab, setTab] = useState<PlanckPassCosmeticKind>("icon")

  const onEquippedChangeRef = useRef(onEquippedChange)
  onEquippedChangeRef.current = onEquippedChange

  const load = useCallback(async () => {
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/planckpass/equip", { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut încărca inventarul.")
      const nextEquipped = json.equipped ?? {
        iconId: null,
        borderId: null,
        badgeId: null,
        skinId: null,
      }
      const nextInventory = json.inventory ?? []
      setInventory(nextInventory)
      setEquipped(nextEquipped)
      emitCosmeticsChanged({
        equipped: nextEquipped,
        inventory: nextInventory,
      })
      onEquippedChangeRef.current?.({
        equipped: nextEquipped,
        inventory: nextInventory,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const byKind = useMemo(() => {
    return inventory.filter((i) => i.cosmetic?.kind === tab)
  }, [inventory, tab])

  const equippedIdForTab =
    tab === "icon"
      ? equipped.iconId
      : tab === "border"
        ? equipped.borderId
        : tab === "badge"
          ? equipped.badgeId
          : equipped.skinId

  const equip = async (cosmeticId: string) => {
    setBusy(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/planckpass/equip", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ cosmeticId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut echipa.")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  const unequip = async () => {
    setBusy(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/planckpass/equip", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ kind: tab, unequip: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut dezechipa.")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      <h3 className="mb-1 text-lg font-semibold text-[#191919]">Inventar PLANCKPASS</h3>
      <p className="mb-4 text-sm text-[#666666]">
        Echipează iconițe, borduri, badge-uri și skin-uri deblocate din pass.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(KIND_LABELS) as PlanckPassCosmeticKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              tab === k
                ? "bg-[#191919] text-white"
                : "bg-[#f7f7f7] text-[#555] hover:bg-[#eeeeee]",
            )}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#707070]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Se încarcă…
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : byKind.length === 0 ? (
        <p className="text-sm text-[#8a8a8a]">Nu ai încă iteme de tipul ăsta. Revendică-le din PLANCKPASS.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {byKind.map((item) => {
            if (!item.cosmetic) return null
            const active = equippedIdForTab === item.cosmetic.id
            return (
              <button
                key={item.cosmeticId}
                type="button"
                disabled={busy}
                onClick={() => void equip(item.cosmeticId)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-3 transition",
                  active
                    ? "border-[#5020F0] bg-[#f5f0ff] ring-2 ring-[#5020F0]/30"
                    : "border-[#e5e5e5] hover:border-[#cfcfcf]",
                )}
              >
                {(() => {
                  const borderPreset = borderPresetIdFromCosmetic(item.cosmetic)
                  if (borderPreset) {
                    return <BorderPresetPreview presetId={borderPreset} size={56} />
                  }
                  const badgePreset = badgePresetIdFromCosmetic(item.cosmetic)
                  if (badgePreset) {
                    return <BadgePresetPreview presetId={badgePreset} size={48} />
                  }
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cosmetic.imageUrl}
                      alt=""
                      className="h-14 w-14 object-contain"
                    />
                  )
                })()}
                <span className="line-clamp-2 text-center text-[11px] font-medium text-[#333]">
                  {item.cosmetic.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {equippedIdForTab ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-full"
          disabled={busy}
          onClick={() => void unequip()}
        >
          Dezechipează {KIND_LABELS[tab].toLowerCase()}
        </Button>
      ) : null}
    </div>
  )
}

export function useEquippedCosmetics() {
  const [equipped, setEquipped] = useState<Equipped>({
    iconId: null,
    borderId: null,
    badgeId: null,
    skinId: null,
  })
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const headers = await authHeaders()
        const res = await fetch("/api/planckpass/equip", { headers })
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        setEquipped(json.equipped ?? { iconId: null, borderId: null, badgeId: null, skinId: null })
        setInventory(json.inventory ?? [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ equipped: Equipped; inventory: InventoryItem[] }>).detail
      if (!detail) return
      setEquipped(detail.equipped)
      setInventory(detail.inventory)
      setLoaded(true)
    }
    window.addEventListener(COSMETICS_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(COSMETICS_CHANGED_EVENT, onChanged)
  }, [])

  const find = (id: string | null) =>
    inventory.find((i) => i.cosmeticId === id)?.cosmetic ?? null

  return {
    loaded,
    equipped,
    inventory,
    setFromInventory: (payload: { equipped: Equipped; inventory: InventoryItem[] }) => {
      setEquipped(payload.equipped)
      setInventory(payload.inventory)
      setLoaded(true)
      emitCosmeticsChanged(payload)
    },
    icon: find(equipped.iconId),
    border: find(equipped.borderId),
    badge: find(equipped.badgeId),
    skin: find(equipped.skinId),
    borderPresetId: borderPresetIdFromCosmetic(find(equipped.borderId)),
    badgePresetId: badgePresetIdFromCosmetic(find(equipped.badgeId)),
  }
}

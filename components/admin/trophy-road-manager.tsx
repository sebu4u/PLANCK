"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { BadgePresetPreview } from "@/components/planckpass/badges/badge-preset-layer"
import { BorderPresetPreview } from "@/components/planckpass/borders/border-preset-layer"
import {
  BADGE_PRESETS,
  getBadgePresetByCosmeticId,
} from "@/lib/planckpass/badge-presets"
import {
  BORDER_PRESETS,
  getBorderPresetByCosmeticId,
} from "@/lib/planckpass/border-presets"
import { isMilestoneConfigured } from "@/lib/trophy-road/types"
import type { TrophyRoadRewardKind } from "@/lib/trophy-road/types"

type Cosmetic = {
  id: string
  kind: string
  name: string
  image_url: string
  meta?: Record<string, unknown> | null
}

type MilestoneRow = {
  id: string
  threshold: number
  sort_order: number
  reward_kind: TrophyRoadRewardKind
  label: string
  coins_amount: number | null
  elo_amount: number | null
  elo_multiplier_minutes: number | null
  streak_freeze_hours: number | null
  cosmetic_id: string | null
  is_active: boolean
  planckpass_cosmetics?: Cosmetic | Cosmetic[] | null
}

const REWARD_OPTIONS: { value: TrophyRoadRewardKind; label: string }[] = [
  { value: "coins", label: "Coins" },
  { value: "elo", label: "+ELO" },
  { value: "elo_2x", label: "2x ELO" },
  { value: "streak_freeze", label: "Streak freeze" },
  { value: "icon", label: "Icon" },
  { value: "badge", label: "Badge" },
  { value: "border", label: "Border" },
  { value: "skin", label: "Skin IDE" },
]

function cosmeticOf(row: MilestoneRow): Cosmetic | null {
  const c = row.planckpass_cosmetics
  if (!c) return null
  return Array.isArray(c) ? c[0] ?? null : c
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sesiune expirată.")
  return { Authorization: `Bearer ${token}` }
}

export function TrophyRoadManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<MilestoneRow[]>([])
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newThreshold, setNewThreshold] = useState("")
  const [draft, setDraft] = useState<{
    threshold: number
    rewardKind: TrophyRoadRewardKind
    label: string
    coinsAmount: number
    eloAmount: number
    eloMultiplierMinutes: number
    streakFreezeHours: number
    cosmeticId: string | null
    cosmeticName: string
    cosmeticImageUrl: string
    isActive: boolean
  } | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/trophy-road", { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Eroare la încărcare.")
      const rows = (json.milestones ?? []) as MilestoneRow[]
      setMilestones(rows)
      setCosmetics(json.cosmetics ?? [])
      setSelectedId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev
        return rows[0]?.id ?? null
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

  const current = useMemo(
    () => milestones.find((m) => m.id === selectedId) ?? null,
    [milestones, selectedId],
  )

  useEffect(() => {
    if (!current) {
      setDraft(null)
      return
    }
    const cos = cosmeticOf(current)
    setDraft({
      threshold: current.threshold,
      rewardKind: current.reward_kind,
      label: current.label,
      coinsAmount: current.coins_amount ?? 100,
      eloAmount: current.elo_amount ?? 25,
      eloMultiplierMinutes: current.elo_multiplier_minutes ?? 15,
      streakFreezeHours: current.streak_freeze_hours ?? 24,
      cosmeticId: current.cosmetic_id,
      cosmeticName: cos?.name ?? "",
      cosmeticImageUrl: cos?.image_url ?? "",
      isActive: current.is_active,
    })
  }, [current])

  const createMilestone = async () => {
    const threshold = Number(newThreshold)
    if (!Number.isFinite(threshold) || threshold < 1) {
      setError("Introdu un nr. valid de trofee.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/trophy-road", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_milestone", threshold }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut crea.")
      setNewThreshold("")
      await load()
      if (json.milestone?.id) setSelectedId(json.milestone.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setSaving(false)
    }
  }

  const deleteMilestone = async () => {
    if (!selectedId) return
    if (!window.confirm("Ștergi acest milestone? Claims-urile asociate dispar.")) return
    setSaving(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/trophy-road", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_milestone", milestoneId: selectedId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Ștergere eșuată.")
      setSelectedId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const form = new FormData()
      form.append("file", file)
      // Reuse Pass cosmetics bucket/upload
      const res = await fetch("/api/admin/planckpass/upload", {
        method: "POST",
        headers,
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload eșuat.")
      setDraft((d) => (d ? { ...d, cosmeticImageUrl: json.url } : d))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare upload")
    } finally {
      setUploading(false)
    }
  }

  const saveMilestone = async () => {
    if (!draft || !selectedId) return
    setSaving(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/trophy-road", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_milestone",
          milestoneId: selectedId,
          threshold: draft.threshold,
          rewardKind: draft.rewardKind,
          label: draft.label,
          coinsAmount: draft.coinsAmount,
          eloAmount: draft.eloAmount,
          eloMultiplierMinutes: draft.eloMultiplierMinutes,
          streakFreezeHours: draft.streakFreezeHours,
          cosmeticId: draft.cosmeticId,
          cosmeticName: draft.cosmeticName || draft.label,
          cosmeticImageUrl:
            draft.rewardKind === "border" || draft.rewardKind === "badge"
              ? null
              : draft.cosmeticImageUrl || null,
          isActive: draft.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Salvare eșuată.")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        Se încarcă Trophy Road…
      </div>
    )
  }

  return (
    <div className="space-y-6 text-white">
      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-semibold">Adaugă prag</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            type="number"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
            className="max-w-[160px] bg-black/40 text-white"
            placeholder="Nr. trofee"
          />
          <Button onClick={() => void createMilestone()} disabled={saving}>
            <Plus className="mr-1 h-4 w-4" />
            Adaugă milestone
          </Button>
        </div>
        <p className="text-xs text-white/50">
          Cele 45 de praguri existente sunt deja create — aici doar le completezi cu reward-uri
          (sau modifici nr. de trofee).
        </p>
      </section>

      {milestones.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
            {milestones.map((m) => {
              const configured = isMilestoneConfigured(m)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                    selectedId === m.id ? "bg-amber-600/40" : "hover:bg-white/10"
                  }`}
                >
                  <span className="font-medium tabular-nums">
                    {m.threshold.toLocaleString("ro-RO")}
                    {!m.is_active ? (
                      <span className="ml-1 text-[10px] uppercase text-red-300">off</span>
                    ) : null}
                    {!configured ? (
                      <span className="ml-1 text-[10px] uppercase text-white/40">gol</span>
                    ) : (
                      <span className="ml-1 text-[10px] uppercase text-emerald-300">ok</span>
                    )}
                  </span>
                  <span className="truncate text-xs text-white/50">{m.label || m.reward_kind}</span>
                </button>
              )
            })}
          </div>

          {draft ? (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">
                  Editează · {draft.threshold.toLocaleString("ro-RO")} trofee
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => void deleteMilestone()}
                    disabled={saving}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Șterge
                  </Button>
                  <Button onClick={() => void saveMilestone()} disabled={saving || uploading}>
                    {saving ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-4 w-4" />
                    )}
                    Salvează
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.isActive}
                  onCheckedChange={(v) => setDraft({ ...draft, isActive: Boolean(v) })}
                />
                Activ pe Trophy Road
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-white/70">Nr. trofee (prag)</span>
                  <Input
                    type="number"
                    value={draft.threshold}
                    onChange={(e) =>
                      setDraft({ ...draft, threshold: Number(e.target.value) || 1 })
                    }
                    className="bg-black/40"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-white/70">Tip reward</span>
                  <select
                    className="w-full rounded-md border border-white/20 bg-black/50 px-2 py-2"
                    value={draft.rewardKind}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        rewardKind: e.target.value as TrophyRoadRewardKind,
                      })
                    }
                  >
                    {REWARD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-white/70">Label afișat</span>
                  <Input
                    value={draft.label}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    className="bg-black/40"
                    placeholder="ex. Monede / Badge Rookie"
                  />
                </label>

                {draft.rewardKind === "coins" ? (
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Coins</span>
                    <Input
                      type="number"
                      value={draft.coinsAmount}
                      onChange={(e) =>
                        setDraft({ ...draft, coinsAmount: Number(e.target.value) || 0 })
                      }
                      className="bg-black/40"
                    />
                  </label>
                ) : null}

                {draft.rewardKind === "elo" ? (
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">+ELO</span>
                    <Input
                      type="number"
                      value={draft.eloAmount}
                      onChange={(e) =>
                        setDraft({ ...draft, eloAmount: Number(e.target.value) || 0 })
                      }
                      className="bg-black/40"
                    />
                  </label>
                ) : null}

                {draft.rewardKind === "elo_2x" ? (
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Minute 2x ELO</span>
                    <Input
                      type="number"
                      value={draft.eloMultiplierMinutes}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          eloMultiplierMinutes: Number(e.target.value) || 15,
                        })
                      }
                      className="bg-black/40"
                    />
                  </label>
                ) : null}

                {draft.rewardKind === "streak_freeze" ? (
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Ore freeze</span>
                    <Input
                      type="number"
                      value={draft.streakFreezeHours}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          streakFreezeHours: Number(e.target.value) || 24,
                        })
                      }
                      className="bg-black/40"
                    />
                  </label>
                ) : null}
              </div>

              {draft.rewardKind === "border" ? (
                <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-sm text-white/70">Border preset</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {BORDER_PRESETS.map((preset) => {
                      const selected = draft.cosmeticId === preset.cosmeticId
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              cosmeticId: preset.cosmeticId,
                              cosmeticName: preset.name,
                              cosmeticImageUrl: preset.imageUrl,
                              label: draft.label || preset.name,
                            })
                          }
                          className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition ${
                            selected
                              ? "border-yellow-400 bg-yellow-400/10"
                              : "border-white/15 bg-black/30 hover:border-white/40"
                          }`}
                        >
                          <BorderPresetPreview presetId={preset.id} size={56} />
                          <span className="text-center text-[10px] font-medium leading-tight text-white/80">
                            {preset.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {draft.cosmeticId ? (
                    <p className="text-xs text-white/50">
                      Selectat:{" "}
                      {getBorderPresetByCosmeticId(draft.cosmeticId)?.name ?? draft.cosmeticName}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {draft.rewardKind === "badge" ? (
                <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-sm text-white/70">Badge preset</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {BADGE_PRESETS.map((preset) => {
                      const selected = draft.cosmeticId === preset.cosmeticId
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              cosmeticId: preset.cosmeticId,
                              cosmeticName: preset.name,
                              cosmeticImageUrl: preset.imageUrl,
                              label: draft.label || preset.name,
                            })
                          }
                          className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition ${
                            selected
                              ? "border-yellow-400 bg-yellow-400/10"
                              : "border-white/15 bg-black/30 hover:border-white/40"
                          }`}
                        >
                          <BadgePresetPreview presetId={preset.id} size={48} />
                          <span className="text-center text-[10px] font-medium leading-tight text-white/80">
                            {preset.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {draft.cosmeticId ? (
                    <p className="text-xs text-white/50">
                      Selectat:{" "}
                      {getBadgePresetByCosmeticId(draft.cosmeticId)?.name ?? draft.cosmeticName}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {["icon", "skin"].includes(draft.rewardKind) ? (
                <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-sm text-white/70">Cosmetic ({draft.rewardKind})</p>
                  <label className="block space-y-1 text-sm">
                    <span className="text-white/70">Nume</span>
                    <Input
                      value={draft.cosmeticName}
                      onChange={(e) => setDraft({ ...draft, cosmeticName: e.target.value })}
                      className="bg-black/40"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-white/70">Alege din catalog</span>
                    <select
                      className="w-full rounded-md border border-white/20 bg-black/50 px-2 py-2"
                      value={draft.cosmeticId ?? ""}
                      onChange={(e) => {
                        const id = e.target.value || null
                        const found = cosmetics.find((c) => c.id === id)
                        setDraft({
                          ...draft,
                          cosmeticId: id,
                          cosmeticName: found?.name ?? draft.cosmeticName,
                          cosmeticImageUrl: found?.image_url ?? draft.cosmeticImageUrl,
                        })
                      }}
                    >
                      <option value="">— nou / upload —</option>
                      {cosmetics
                        .filter((c) => c.kind === draft.rewardKind)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadImage(f)
                      }}
                      className="max-w-xs bg-black/40"
                    />
                    {draft.cosmeticImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={draft.cosmeticImageUrl}
                        alt=""
                        className="h-16 w-16 rounded-md border border-white/20 object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-white/60">
          Niciun milestone. Rulează migrarea SQL, apoi reîncarcă pagina.
        </p>
      )}
    </div>
  )
}

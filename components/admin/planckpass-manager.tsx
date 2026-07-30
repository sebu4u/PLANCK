"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Save, Star } from "lucide-react"
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
import type { PlanckPassRewardKind } from "@/lib/planckpass/types"

type Season = {
  id: string
  title: string
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at?: string
}

type Cosmetic = {
  id: string
  kind: string
  name: string
  image_url: string
  meta?: Record<string, unknown> | null
}

type TierRow = {
  id: string
  season_id: string
  tier_number: number
  is_free: boolean
  reward_kind: PlanckPassRewardKind
  label: string
  xp_required: number
  coins_amount: number | null
  elo_amount: number | null
  elo_multiplier_minutes: number | null
  streak_freeze_hours: number | null
  cosmetic_id: string | null
  planckpass_cosmetics?: Cosmetic | Cosmetic[] | null
}

const REWARD_OPTIONS: { value: PlanckPassRewardKind; label: string }[] = [
  { value: "coins", label: "Coins" },
  { value: "elo", label: "+ELO" },
  { value: "elo_2x", label: "2x ELO" },
  { value: "streak_freeze", label: "Streak freeze" },
  { value: "icon", label: "Icon" },
  { value: "badge", label: "Badge" },
  { value: "border", label: "Border" },
  { value: "skin", label: "Skin IDE" },
]

function cosmeticOf(tier: TierRow): Cosmetic | null {
  const c = tier.planckpass_cosmetics
  if (!c) return null
  return Array.isArray(c) ? c[0] ?? null : c
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Sesiune expirată.")
  return { Authorization: `Bearer ${token}` }
}

export function PlanckPassManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const [tiers, setTiers] = useState<TierRow[]>([])
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([])
  const [selectedTier, setSelectedTier] = useState<number>(1)
  const [newSeasonTitle, setNewSeasonTitle] = useState("PLANCKPASS SEASON 1")
  const [draft, setDraft] = useState<{
    isFree: boolean
    rewardKind: PlanckPassRewardKind
    label: string
    xpRequired: number
    coinsAmount: number
    eloAmount: number
    eloMultiplierMinutes: number
    streakFreezeHours: number
    cosmeticId: string | null
    cosmeticName: string
    cosmeticImageUrl: string
  } | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async (seasonId?: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const qs = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : ""
      const res = await fetch(`/api/admin/planckpass${qs}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Eroare la încărcare.")
      setSeasons(json.seasons ?? [])
      setSelectedSeasonId(json.selectedSeasonId)
      setTiers(json.tiers ?? [])
      setCosmetics(json.cosmetics ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const currentTier = useMemo(
    () => tiers.find((t) => t.tier_number === selectedTier) ?? null,
    [tiers, selectedTier],
  )

  useEffect(() => {
    if (!currentTier) {
      setDraft(null)
      return
    }
    const cos = cosmeticOf(currentTier)
    setDraft({
      isFree: currentTier.is_free,
      rewardKind: currentTier.reward_kind,
      label: currentTier.label,
      xpRequired: currentTier.xp_required,
      coinsAmount: currentTier.coins_amount ?? 100,
      eloAmount: currentTier.elo_amount ?? 25,
      eloMultiplierMinutes: currentTier.elo_multiplier_minutes ?? 15,
      streakFreezeHours: currentTier.streak_freeze_hours ?? 24,
      cosmeticId: currentTier.cosmetic_id,
      cosmeticName: cos?.name ?? "",
      cosmeticImageUrl: cos?.image_url ?? "",
    })
  }, [currentTier])

  const createSeason = async () => {
    setSaving(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/planckpass", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_season",
          title: newSeasonTitle.trim() || "PLANCKPASS SEASON",
          activate: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut crea sezonul.")
      await load(json.season?.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare")
    } finally {
      setSaving(false)
    }
  }

  const activateSeason = async (seasonId: string) => {
    setSaving(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/planckpass", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate_season", seasonId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Nu am putut activa.")
      await load(seasonId)
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

  const saveTier = async () => {
    if (!draft || !selectedSeasonId) return
    setSaving(true)
    setError(null)
    try {
      const headers = await authHeaders()
      const res = await fetch("/api/admin/planckpass", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_tier",
          seasonId: selectedSeasonId,
          tierNumber: selectedTier,
          isFree: draft.isFree,
          rewardKind: draft.rewardKind,
          label: draft.label,
          xpRequired: draft.xpRequired,
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
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Salvare eșuată.")
      await load(selectedSeasonId)
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
        Se încarcă PLANCKPASS…
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
        <h2 className="text-lg font-semibold">Sezoane</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            value={newSeasonTitle}
            onChange={(e) => setNewSeasonTitle(e.target.value)}
            className="max-w-xs bg-black/40 text-white"
            placeholder="Titlu sezon"
          />
          <Button onClick={() => void createSeason()} disabled={saving}>
            <Plus className="mr-1 h-4 w-4" />
            Creează sezon
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {seasons.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedSeasonId(s.id)
                void load(s.id)
              }}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                selectedSeasonId === s.id
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/15 bg-black/30 hover:border-white/40"
              }`}
            >
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-white/60">
                {s.is_active ? "Activ" : "Inactiv"}
              </div>
              {!s.is_active ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    void activateSeason(s.id)
                  }}
                >
                  <Star className="mr-1 h-3 w-3" />
                  Activează
                </Button>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {selectedSeasonId && tiers.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
            {tiers.map((t) => (
              <button
                key={t.tier_number}
                type="button"
                onClick={() => setSelectedTier(t.tier_number)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                  selectedTier === t.tier_number
                    ? "bg-violet-600/40"
                    : "hover:bg-white/10"
                }`}
              >
                <span>
                  Tier {t.tier_number}
                  {t.is_free ? (
                    <span className="ml-1 text-[10px] uppercase text-emerald-300">free</span>
                  ) : null}
                </span>
                <span className="truncate text-xs text-white/50">{t.label}</span>
              </button>
            ))}
          </div>

          {draft ? (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Editează tier {selectedTier}</h3>
                <Button onClick={() => void saveTier()} disabled={saving || uploading}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Salvează
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.isFree}
                  onCheckedChange={(v) => setDraft({ ...draft, isFree: Boolean(v) })}
                />
                Tier free (disponibil și pe plan free)
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-white/70">Tip reward</span>
                  <select
                    className="w-full rounded-md border border-white/20 bg-black/50 px-2 py-2"
                    value={draft.rewardKind}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        rewardKind: e.target.value as PlanckPassRewardKind,
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

                <label className="space-y-1 text-sm">
                  <span className="text-white/70">Label afișat</span>
                  <Input
                    value={draft.label}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    className="bg-black/40"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-white/70">XP necesar (incremental)</span>
                  <Input
                    type="number"
                    value={draft.xpRequired}
                    onChange={(e) =>
                      setDraft({ ...draft, xpRequired: Number(e.target.value) || 1 })
                    }
                    className="bg-black/40"
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
                  <p className="text-sm text-white/70">Border preset (10 fixe, animate)</p>
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
                  {!draft.cosmeticId ? (
                    <p className="text-xs text-amber-200/80">Selectează un border pentru acest tier.</p>
                  ) : (
                    <p className="text-xs text-white/50">
                      Selectat:{" "}
                      {getBorderPresetByCosmeticId(draft.cosmeticId)?.name ?? draft.cosmeticName}
                    </p>
                  )}
                </div>
              ) : null}

              {draft.rewardKind === "badge" ? (
                <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-sm text-white/70">Badge preset (5 fixe, animate)</p>
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
                  {!draft.cosmeticId ? (
                    <p className="text-xs text-amber-200/80">Selectează un badge pentru acest tier.</p>
                  ) : (
                    <p className="text-xs text-white/50">
                      Selectat:{" "}
                      {getBadgePresetByCosmeticId(draft.cosmeticId)?.name ?? draft.cosmeticName}
                    </p>
                  )}
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
        <p className="text-white/60">Creează un sezon ca să editezi cele 30 de tiers.</p>
      )}
    </div>
  )
}

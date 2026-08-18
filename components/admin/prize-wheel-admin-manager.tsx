"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"

import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPrizeWheelPrizeLabel, isPrizeWheelPrizeType } from "@/lib/prize-wheel/types"

type AdminCampaign = {
  id: string
  startsAt: string | null
  endsAt: string | null
  isLive: boolean
  guaranteedLimit: number
  guaranteedAwarded: number
}

type AdminWinner = {
  id: string
  userId: string
  email: string | null
  displayName: string | null
  prizeType: string
  label: string
  code: string
  redeemedAt: string | null
  createdAt: string
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function formatRoDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("ro-RO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  })
}

export function PrizeWheelAdminManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<AdminCampaign | null>(null)
  const [winners, setWinners] = useState<AdminWinner[]>([])
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Sesiune expirată.")
      setLoading(false)
      return
    }
    const response = await fetch("/api/admin/prize-wheel", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || "Nu am putut încărca campania.")
      setLoading(false)
      return
    }
    setCampaign(payload.campaign)
    setWinners(payload.winners ?? [])
    setStartsAt(toDatetimeLocalValue(payload.campaign?.startsAt ?? null))
    setEndsAt(toDatetimeLocalValue(payload.campaign?.endsAt ?? null))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Sesiune expirată.")
      setSaving(false)
      return
    }

    const response = await fetch("/api/admin/prize-wheel", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startsAt: fromDatetimeLocalValue(startsAt),
        endsAt: fromDatetimeLocalValue(endsAt),
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload.error || "Nu am putut salva intervalul.")
      setSaving(false)
      return
    }
    setCampaign(payload.campaign)
    setSuccess("Intervalul a fost salvat.")
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Fereastră campanie</h2>
            <p className="mt-1 text-sm text-gray-400">
              Ora e cea locală a browserului (recomandat Europe/Bucharest). Roata e vizibilă doar între aceste momente.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              campaign?.isLive ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-gray-300"
            }`}
          >
            {campaign?.isLive ? "Activă" : "Inactivă"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-gray-300">
            De la
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-2 border-white/15 bg-black/40 text-white"
            />
          </label>
          <label className="block text-sm text-gray-300">
            Până la
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-2 border-white/15 bg-black/40 text-white"
            />
          </label>
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Premiul „anual la 1 leu”: {campaign?.guaranteedAwarded ?? 0} / {campaign?.guaranteedLimit ?? 25}
        </p>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}

        <Button className="mt-5" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvează intervalul
        </Button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">Câștigători</h2>
        <p className="mt-1 text-sm text-gray-400">{winners.length} elevi au luat un premiu real.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Premiu</th>
                <th className="px-3 py-2 font-medium">Cod</th>
                <th className="px-3 py-2 font-medium">Folosit</th>
                <th className="px-3 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-gray-500" colSpan={5}>
                    Nimeni nu a câștigat încă.
                  </td>
                </tr>
              ) : (
                winners.map((winner) => (
                  <tr key={winner.id} className="border-t border-white/10">
                    <td className="px-3 py-3">
                      <div className="font-medium text-white">{winner.displayName || "Fără nume"}</div>
                      <div className="text-xs text-gray-400">{winner.email || winner.userId}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-200">
                      {isPrizeWheelPrizeType(winner.prizeType)
                        ? getPrizeWheelPrizeLabel(winner.prizeType)
                        : winner.label}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-200">{winner.code}</td>
                    <td className="px-3 py-3 text-gray-300">
                      {winner.redeemedAt ? formatRoDate(winner.redeemedAt) : "Nu"}
                    </td>
                    <td className="px-3 py-3 text-gray-300">{formatRoDate(winner.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

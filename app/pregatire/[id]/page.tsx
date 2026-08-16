"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/components/auth-provider"
import { EnergyBadge } from "@/components/pregatire/energy-badge"
import { WorkshopDetailPanel } from "@/components/pregatire/workshop-detail-panel"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { supabase } from "@/lib/supabaseClient"
import type { WorkshopDetail } from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

export default function PregatireDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [energy, setEnergy] = useState<number | null>(null)
  const [carryoverEnergy, setCarryoverEnergy] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        const response = await fetch(`/api/pregatire/${params.id}`, { headers })
        if (!response.ok) {
          if (!cancelled) {
            setError(response.status === 404 ? "Pregătirea nu a fost găsită." : "Eroare la încărcare.")
            setWorkshop(null)
          }
          return
        }
        const payload = await response.json()
        if (!cancelled) setWorkshop(payload.workshop)

        if (token) {
          const energyRes = await fetch("/api/pregatire/energy", { headers })
          if (energyRes.ok) {
            const energyData = await energyRes.json()
            if (!cancelled) {
              setEnergy(energyData.balance ?? 0)
              setCarryoverEnergy(energyData.carryoverBalance ?? 0)
            }
          }
        }
      } catch {
        if (!cancelled) setError("Eroare la încărcare.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (params.id) void load()
    return () => {
      cancelled = true
    }
  }, [params.id])

  return (
    <>
      <Navigation />
      <main
        className={cn(
          "min-h-[100dvh] bg-[#fafafa] pt-14 burger:pt-16",
          MOBILE_BOTTOM_NAV_PADDING_CLASS,
        )}
      >
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {user ? (
            <div className="mb-4 flex justify-end">
              <EnergyBadge balance={energy} carryoverBalance={carryoverEnergy} />
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#9ca3af]" />
            </div>
          ) : error || !workshop ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-16 text-center">
              <p className="text-sm text-[#6b7280]">{error ?? "Pregătirea nu a fost găsită."}</p>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-[#2563eb]"
                onClick={() => router.push("/pregatire")}
              >
                Înapoi la pregătiri
              </button>
            </div>
          ) : (
            <WorkshopDetailPanel
              workshop={workshop}
              isLoggedIn={Boolean(user)}
              onBalanceChange={(next) => {
                setEnergy(next.balance)
                setCarryoverEnergy(next.carryoverBalance)
              }}
              onUnlocked={setWorkshop}
            />
          )}
        </div>
      </main>
    </>
  )
}

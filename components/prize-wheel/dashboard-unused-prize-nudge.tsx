"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Gift } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import type { PrizeWheelPrizeView } from "@/lib/prize-wheel/types"
import { cn } from "@/lib/utils"

type DashboardUnusedPrizeNudgeProps = {
  hidden?: boolean
}

export function DashboardUnusedPrizeNudge({ hidden = false }: DashboardUnusedPrizeNudgeProps) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const isHidden = hidden === true
  const [prize, setPrize] = useState<PrizeWheelPrizeView | null>(null)

  useEffect(() => {
    if (!userId || isHidden) {
      if (!userId) setPrize(null)
      return
    }

    let cancelled = false
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return
      const response = await fetch("/api/prize-wheel", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const payload = await response.json()
      const next = payload?.user?.prize as PrizeWheelPrizeView | null
      if (!cancelled) {
        setPrize(next && !next.redeemedAt ? next : null)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId, isHidden])

  if (hidden || !prize) return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[280] flex justify-center px-3",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.75rem)]",
        "md:justify-end md:px-6 burger:bottom-6",
      )}
    >
      <Link
        href="/pricing"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-[#d9f2e0] bg-white px-3.5 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.14)] ring-1 ring-[#16a34a]/10 md:max-w-sm"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/15 text-[#16a34a]">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#16a34a]">
            Premiu nefolosit
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-gray-900">
            Folosește premiul câștigat
          </span>
        </span>
        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#16a34a] px-3.5 text-sm font-bold text-white">
          Folosește
        </span>
      </Link>
    </div>
  )
}

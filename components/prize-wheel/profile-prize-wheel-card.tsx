"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, Gift } from "lucide-react"

import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import type { PrizeWheelPrizeView } from "@/lib/prize-wheel/types"

export function ProfilePrizeWheelCard() {
  const { toast } = useToast()
  const [prize, setPrize] = useState<PrizeWheelPrizeView | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
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
      if (!cancelled) setPrize(payload?.user?.prize ?? null)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!prize) return null

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(prize.code)
      setCopied(true)
      toast({ title: "Cod copiat" })
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast({ title: "Nu am putut copia codul", variant: "destructive" })
    }
  }

  return (
    <div className="w-full rounded-2xl border border-[#d9f2e0] bg-[#f2fbf5] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/15 text-[#16a34a]">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">Premiu roată</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{prize.label}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="truncate rounded-lg bg-white px-2 py-1 font-mono text-sm font-semibold text-gray-800">
              {prize.code}
            </code>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-800"
              aria-label="Copiază codul"
            >
              {copied ? <Check className="h-4 w-4 text-[#16a34a]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {prize.redeemedAt ? "Premiul a fost folosit." : "Se aplică automat pe pagina de prețuri."}
          </p>
          {prize.redeemedAt ? null : (
            <Link
              href="/pricing"
              className="mt-3 inline-flex text-sm font-semibold text-[#16a34a] hover:underline"
            >
              Folosește-l pe /pricing →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

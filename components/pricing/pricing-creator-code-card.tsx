"use client"

import { useState } from "react"
import { ChevronDown, Loader2, Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"

export type AppliedPromo = {
  promotionCodeId: string
  code: string
  percentOff: number | null
  amountOff: number | null
  currency: string | null
}

type PricingCreatorCodeCardProps = {
  appliedPromo: AppliedPromo | null
  onApply: (promo: AppliedPromo) => void
  onClear: () => void
}

export function PricingCreatorCodeCard({
  appliedPromo,
  onApply,
  onClear,
}: PricingCreatorCodeCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyCode = async () => {
    const trimmed = code.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        setError("Trebuie să fii autentificat ca să aplici un cod.")
        return
      }

      const response = await fetch("/api/stripe/promo-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: trimmed }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload?.error || "Codul nu este valid sau a expirat.")
        return
      }

      onApply({
        promotionCodeId: payload.promotion_code_id,
        code: payload.code,
        percentOff: typeof payload.percent_off === "number" ? payload.percent_off : null,
        amountOff: typeof payload.amount_off === "number" ? payload.amount_off : null,
        currency: payload.currency ?? null,
      })
      setIsOpen(false)
      setCode("")
    } catch {
      setError("Nu am putut valida codul. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  if (appliedPromo) {
    const discountLabel =
      appliedPromo.percentOff != null
        ? `-${appliedPromo.percentOff}%`
        : appliedPromo.amountOff != null
          ? `-${(appliedPromo.amountOff / 100).toLocaleString("ro-RO")} ${appliedPromo.currency?.toUpperCase() ?? "RON"}`
          : "Reducere"

    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#d9f2e0] bg-[#f2fbf5] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/10">
            <Tag className="h-4 w-4 text-[#16a34a]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{appliedPromo.code}</p>
            <p className="text-xs font-medium text-[#16a34a]">{discountLabel} reducere aplicată</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onClear()
            setError(null)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Elimină codul"
          title="Elimină codul"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/60">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Tag className="h-4 w-4 text-gray-400" aria-hidden />
          Ai un cod de creator?
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                if (error) setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void applyCode()
                }
              }}
              placeholder="COD CREATOR"
              disabled={loading}
              className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold uppercase tracking-wide text-gray-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/20"
            />
            <button
              type="button"
              onClick={() => void applyCode()}
              disabled={loading || !code.trim()}
              className={cn(
                "inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
                loading || !code.trim()
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-[#7C5CFC] text-white hover:brightness-110"
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplică"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

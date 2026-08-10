"use client"

import { Zap } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function EnergyInfoPopover({
  label,
  title,
  description,
  className,
  children,
}: {
  label: string
  title: string
  description: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full shadow-sm transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            className,
          )}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">{description}</p>
      </PopoverContent>
    </Popover>
  )
}

export function EnergyBadge({
  balance,
  carryoverBalance = 0,
  loading,
  className,
}: {
  balance: number | null
  carryoverBalance?: number | null
  loading?: boolean
  className?: string
}) {
  const carryover = carryoverBalance ?? 0
  const showCarryover = !loading && carryover > 0

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      {loading ? (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-semibold text-amber-800 shadow-sm">
          <Zap className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
          <span className="tabular-nums">…</span>
          <span className="font-medium text-amber-700/80">energie</span>
        </div>
      ) : (
        <EnergyInfoPopover
          label="Deschide explicația pentru energia curentă"
          title="Energie"
          description="Folosești energia pentru a debloca pregătirile live. Cu Premium, primești 100 energie în fiecare luni."
          className="border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-semibold text-amber-800 focus-visible:ring-amber-400/60"
        >
          <Zap className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
          <span className="tabular-nums">{balance ?? "—"}</span>
          <span className="font-medium text-amber-700/80">energie</span>
        </EnergyInfoPopover>
      )}

      {showCarryover ? (
        <EnergyInfoPopover
          label="Deschide explicația pentru energia rămasă"
          title="Energie rămasă"
          description="Necheltuită din săptămâna anterioară. Se consumă înaintea energiei curente și expiră luni."
          className="border border-stone-300/90 bg-gradient-to-r from-stone-100 to-stone-200/80 px-3 py-1.5 text-sm font-semibold text-stone-600 focus-visible:ring-stone-400/60"
        >
          <Zap className="h-4 w-4 fill-stone-400 text-stone-500" aria-hidden />
          <span className="tabular-nums">{carryover}</span>
        </EnergyInfoPopover>
      ) : null}
    </div>
  )
}

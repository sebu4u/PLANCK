"use client"

import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function EnergyBadge({
  balance,
  loading,
  className,
}: {
  balance: number | null
  loading?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-semibold text-amber-800 shadow-sm",
        className,
      )}
      title="Energie pentru pregătiri"
    >
      <Zap className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
      <span className="tabular-nums">{loading ? "…" : (balance ?? "—")}</span>
      <span className="font-medium text-amber-700/80">energie</span>
    </div>
  )
}

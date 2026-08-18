"use client"

import { ExternalLink, Lock, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WorkshopWhiteboardCard({
  url,
  compact = false,
  locked = false,
  onUnlock,
  unlocking = false,
  unlockDisabled = false,
  unlockLabel = "Deblochează pentru a vedea",
}: {
  url?: string | null
  compact?: boolean
  locked?: boolean
  onUnlock?: () => void
  unlocking?: boolean
  unlockDisabled?: boolean
  unlockLabel?: string
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className={compact ? "p-4" : "p-5 sm:p-6"}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            {locked ? <Lock className="h-5 w-5" /> : <Presentation className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#111827]">Tabla din pregătire</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              {locked
                ? "Tabla folosită în această sesiune. Devine disponibilă după deblocare."
                : "Tabla folosită în această sesiune. Se deschide într-un tab nou."}
            </p>
            {locked ? (
              onUnlock ? (
                <Button
                  type="button"
                  className="mt-3 bg-[#111827] text-white hover:bg-[#1f2937]"
                  size="sm"
                  disabled={unlocking || unlockDisabled}
                  onClick={onUnlock}
                >
                  {unlockLabel}
                </Button>
              ) : null
            ) : url ? (
              <Button asChild className="mt-3 bg-[#111827] text-white hover:bg-[#1f2937]" size="sm">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Deschide tabla
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

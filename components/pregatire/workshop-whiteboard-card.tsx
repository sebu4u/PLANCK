"use client"

import { ExternalLink, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WorkshopWhiteboardCard({
  url,
  compact = false,
}: {
  url: string
  compact?: boolean
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className={compact ? "p-4" : "p-5 sm:p-6"}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Presentation className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#111827]">Tabla din pregătire</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Tabla folosită în această sesiune. Se deschide într-un tab nou.
            </p>
            <Button asChild className="mt-3 bg-[#111827] text-white hover:bg-[#1f2937]" size="sm">
              <a href={url} target="_blank" rel="noopener noreferrer">
                Deschide tabla
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

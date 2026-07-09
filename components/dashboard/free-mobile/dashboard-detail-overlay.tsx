"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"

interface DashboardDetailOverlayProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Full-viewport overlay used by the free-plan mobile dashboard to show the
 * "detailed" view of the traseu / leaderboard cards. The dashboard behind it
 * stays visible but blurred/dimmed to keep the opened card in focus.
 */
export function DashboardDetailOverlay({ open, onClose, title, children }: DashboardDetailOverlayProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#f0f0f0] px-5 py-4">
          <h2 className="text-base font-bold text-[#111111]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        <div className="border-t border-[#f0f0f0] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Am înțeles
          </button>
        </div>
      </div>
    </div>
  )
}

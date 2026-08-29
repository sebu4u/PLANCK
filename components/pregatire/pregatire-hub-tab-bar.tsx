"use client"

import { CalendarDays, NotebookPen, StickyNote, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PregatireHubTab } from "@/lib/pregatire-hub-tab"

const TABS: { id: PregatireHubTab; label: string; icon: LucideIcon }[] = [
  { id: "pregatiri", label: "Pregătiri", icon: CalendarDays },
  { id: "teme", label: "Teme", icon: NotebookPen },
  { id: "notite", label: "Notițe", icon: StickyNote },
]

export function PregatireHubTabBar({
  value,
  onChange,
  className,
}: {
  value: PregatireHubTab
  onChange: (tab: PregatireHubTab) => void
  className?: string
}) {
  return (
    <div className={cn("border-b border-[#ececec]", className)}>
      <div
        role="tablist"
        aria-label="Secțiuni Pregătire"
        className="grid w-full grid-cols-3 items-end"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === value
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`pregatire-hub-tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "-mb-px inline-flex w-full items-center justify-center gap-1.5 border-b-2 pb-2 text-[15px] transition-colors",
                isActive
                  ? "border-[#111111] font-semibold text-[#111111]"
                  : "border-transparent font-medium text-[#8a8a8a] hover:text-[#111111]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import type { InvataHubTab } from "@/lib/invata-hub-tab"

const TAB_LABELS: Record<InvataHubTab, string> = {
  trasee: "Trasee",
  lectii: "Lecții",
}

interface InvataHubTabBarProps {
  value: InvataHubTab
  onChange: (tab: InvataHubTab) => void
  className?: string
}

export function InvataHubTabBar({ value, onChange, className }: InvataHubTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Secțiuni Învață"
      className={cn("flex items-end gap-5 border-b border-[#ececec]", className)}
    >
      {(Object.keys(TAB_LABELS) as InvataHubTab[]).map((tab) => {
        const isActive = tab === value
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={`invata-hub-tab-${tab}`}
            onClick={() => onChange(tab)}
            className={cn(
              "-mb-px border-b-2 pb-2 text-[15px] transition-colors sm:text-base",
              isActive
                ? "border-[#111111] font-semibold text-[#111111]"
                : "border-transparent font-medium text-[#8a8a8a] hover:text-[#111111]",
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        )
      })}
    </div>
  )
}

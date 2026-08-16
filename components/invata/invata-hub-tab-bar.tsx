"use client"

import { cn } from "@/lib/utils"
import type { InvataHubTab } from "@/lib/invata-hub-tab"
import type { InvataSubjectFilter } from "@/lib/invata-config"
import { InvataHubSubjectFilter } from "@/components/invata/invata-hub-subject-filter"

const TAB_LABELS: Record<InvataHubTab, string> = {
  trasee: "Trasee",
  lectii: "Lecții",
}

interface InvataHubTabBarProps {
  value: InvataHubTab
  onChange: (tab: InvataHubTab) => void
  subjectFilter: InvataSubjectFilter
  onSubjectFilterChange: (filter: InvataSubjectFilter) => void
  className?: string
}

export function InvataHubTabBar({
  value,
  onChange,
  subjectFilter,
  onSubjectFilterChange,
  className,
}: InvataHubTabBarProps) {
  return (
    <div
      className={cn("flex items-end justify-between gap-4 border-b border-[#ececec]", className)}
    >
      <div role="tablist" aria-label="Secțiuni Învață" className="flex items-end gap-5">
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

      <div className="relative pb-1.5">
        <InvataHubSubjectFilter value={subjectFilter} onChange={onSubjectFilterChange} />
      </div>
    </div>
  )
}

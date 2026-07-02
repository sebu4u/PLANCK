"use client"

import type { LucideIcon } from "lucide-react"

type GuardianRoleCardProps = {
  label: string
  description: string
  icon: LucideIcon
  selected: boolean
  onSelect: () => void
  animationDelay?: string
}

export function GuardianRoleCard({
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
  animationDelay = "0ms",
}: GuardianRoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors opacity-0 ${
        selected
          ? "border-[#ddd6fe] bg-[#f5f3ff]"
          : "border-[#eceff3] bg-[#fafafa] hover:bg-[#f4f4f6]"
      }`}
      style={{ animation: "registerStepButtonEnter 400ms ease-out forwards", animationDelay }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`rounded-full p-2.5 ${
            selected ? "bg-[#ede9fe] text-[#7c3aed]" : "bg-[#f3f3f3] text-[#9e9e9e]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#111827]">{label}</span>
          <span className="mt-0.5 block text-xs text-[#6b7280]">{description}</span>
        </span>
      </div>
    </button>
  )
}

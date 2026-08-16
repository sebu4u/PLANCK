"use client"

import { useState } from "react"
import { Check, ListFilter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  INVATA_SUBJECTS,
  type InvataSubjectFilter,
} from "@/lib/invata-config"

interface InvataHubSubjectFilterProps {
  value: InvataSubjectFilter
  onChange: (value: InvataSubjectFilter) => void
}

export function InvataHubSubjectFilter({ value, onChange }: InvataHubSubjectFilterProps) {
  const [open, setOpen] = useState(false)
  const isActive = value !== "all"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]",
            isActive && "text-[#111111]",
          )}
          aria-label="Filtrează traseele după materie"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <ListFilter className="h-4 w-4" aria-hidden />
          {isActive ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#111111]" aria-hidden />
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-2xl border-[#0b0c0f]/10 bg-white p-2 shadow-[0_16px_40px_-20px_rgba(11,12,15,0.35)]"
        role="listbox"
        aria-label="Filtrează după materie"
      >
        <p className="px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
          Materie
        </p>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === "all"}
              onClick={() => {
                onChange("all")
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                value === "all"
                  ? "bg-[#f5f4f2] text-[#0b0c0f]"
                  : "text-[#2c2f33] hover:bg-[#faf9f7]",
              )}
            >
              <span className="flex-1 text-sm font-semibold">Toate materiile</span>
              {value === "all" ? (
                <Check className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
              ) : null}
            </button>
          </li>
          {INVATA_SUBJECTS.map((subject) => {
            const Icon = subject.icon
            const isSelected = value === subject.id

            return (
              <li key={subject.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(subject.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-[#f5f4f2] text-[#0b0c0f]"
                      : "text-[#2c2f33] hover:bg-[#faf9f7]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-white shadow-sm" : "bg-[#f5f4f2]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-semibold">{subject.label}</span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

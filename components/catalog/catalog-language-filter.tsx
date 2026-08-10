"use client"

import { cn } from "@/lib/utils"
import type { CatalogLanguageFilter } from "@/components/problems/problems-catalog-sidebar"

export const CATALOG_LANGUAGE_FILTER_OPTIONS: Array<{ value: CatalogLanguageFilter; label: string }> = [
  { value: "Toate", label: "Toate" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
]

interface CatalogLanguageFilterProps {
  value: CatalogLanguageFilter
  onChange: (value: CatalogLanguageFilter) => void
  className?: string
  compact?: boolean
  /** Full-width layout for mobile filters sheet (matches difficulty/progress pills). */
  variant?: "inline" | "sidebar"
}

export function CatalogLanguageFilter({
  value,
  onChange,
  className,
  compact = false,
  variant = compact ? "inline" : "sidebar",
}: CatalogLanguageFilterProps) {
  if (variant === "sidebar") {
    return (
      <div className={cn("w-full space-y-2", className)}>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/70">Limbaj</label>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Filtru limbaj">
          {CATALOG_LANGUAGE_FILTER_OPTIONS.map((option) => {
            const active = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-[#0b0c0f] bg-[#0b0c0f] text-white"
                    : "border-[#0b0c0f]/15 bg-white text-[#2c2f33] hover:border-[#0b0c0f]/35",
                )}
                aria-pressed={active}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!compact ? (
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2c2f33]/70">Limbaj</label>
      ) : null}
      <div
        className={cn(
          "inline-flex rounded-full border border-[#0b0c0f]/15 bg-white p-1 shadow-sm",
          compact && "shadow-none",
        )}
        role="group"
        aria-label="Filtru limbaj"
      >
        {CATALOG_LANGUAGE_FILTER_OPTIONS.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                compact ? "h-8 px-3" : "py-1.5",
                active
                  ? "bg-[#0b0c0f] text-white"
                  : "text-[#2c2f33] hover:bg-[#f5f4f2]",
              )}
              aria-pressed={active}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  EXERSEAZA_SUBJECTS,
  type ExerseazaSubjectId,
} from "@/lib/exerseaza-config"

interface ExerseazaSubjectSelectorProps {
  selectedId: ExerseazaSubjectId
  onSelect: (id: ExerseazaSubjectId) => void
  /** Hides the trailing “Schimbă materia” hint — for compact mobile nav. */
  compact?: boolean
  size?: "default" | "navbar" | "navbar-lg"
}

export function ExerseazaSubjectSelector({
  selectedId,
  onSelect,
  compact = false,
  size = "default",
}: ExerseazaSubjectSelectorProps) {
  const isNavbarLg = size === "navbar-lg"
  const isNavbar = size === "navbar" || compact
  const isCompactNav = isNavbar || isNavbarLg
  const [open, setOpen] = useState(false)
  const selected =
    EXERSEAZA_SUBJECTS.find((subject) => subject.id === selectedId) ?? EXERSEAZA_SUBJECTS[0]
  const SelectedIcon = selected.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("inline-flex items-center text-left", isCompactNav ? "gap-0" : "gap-3")}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Materia selectată: ${selected.label}. Schimbă materia.`}
        >
          <span
            className={cn(
              "inline-flex items-center rounded-xl border border-[#0b0c0f]/10 bg-white shadow-[0_4px_16px_-10px_rgba(11,12,15,0.2)] transition-colors hover:border-[#0b0c0f]/16 active:scale-[0.99]",
              isNavbarLg
                ? "gap-2 rounded-lg px-2.5 py-1.5"
                : isNavbar
                  ? "gap-1.5 rounded-lg px-2 py-1"
                  : "gap-2 px-2.5 py-2",
            )}
          >
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-lg bg-[#f5f4f2] text-[#2c2f33]",
                isNavbarLg ? "h-7 w-7" : isNavbar ? "h-6 w-6" : "h-8 w-8",
              )}
            >
              <SelectedIcon
                className={cn(isNavbarLg ? "h-3.5 w-3.5" : isNavbar ? "h-3 w-3" : "h-4 w-4")}
                aria-hidden
              />
            </span>
            <span
              className={cn(
                "font-bold text-[#0b0c0f]",
                isNavbarLg ? "text-sm" : isNavbar ? "text-xs" : "text-sm",
              )}
            >
              {selected.label}
            </span>
            <ChevronDown
              className={cn(
                "shrink-0 text-[#2c2f33]/45 transition-transform duration-200",
                isNavbarLg ? "h-3.5 w-3.5" : isNavbar ? "h-3 w-3" : "h-4 w-4",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </span>
          {!isCompactNav ? (
            <span className="text-sm font-medium text-[#2c2f33]/55">Schimbă materia</span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-56 rounded-2xl border-[#0b0c0f]/10 bg-white p-2 shadow-[0_16px_40px_-20px_rgba(11,12,15,0.35)]"
        role="listbox"
        aria-label="Materii disponibile"
      >
        <ul className="space-y-1">
          {EXERSEAZA_SUBJECTS.map((subject) => {
            const Icon = subject.icon
            const isSelected = subject.id === selectedId

            return (
              <li key={subject.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(subject.id)
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
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isSelected ? "bg-white shadow-sm" : "bg-[#f5f4f2]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-semibold">{subject.label}</span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-violet-700" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

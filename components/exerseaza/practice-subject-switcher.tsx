"use client"

import { ExerseazaSubjectSelector } from "@/components/exerseaza/exerseaza-subject-selector"
import { usePracticeSubjectSwitcher } from "@/hooks/use-practice-subject-switcher"
import type { PracticeSubjectId } from "@/lib/practice-subject"
import { cn } from "@/lib/utils"

interface PracticeSubjectSwitcherProps {
  currentSubject: PracticeSubjectId
  className?: string
  compact?: boolean
  size?: "default" | "navbar"
  /** When false, only persists preferred_materie — no route change. */
  navigateOnChange?: boolean
}

export function PracticeSubjectSwitcher({
  currentSubject,
  className,
  compact = false,
  size = "default",
  navigateOnChange = true,
}: PracticeSubjectSwitcherProps) {
  const { selectSubject, isSaving } = usePracticeSubjectSwitcher(currentSubject, { navigateOnChange })

  return (
    <div className={cn(isSaving && "pointer-events-none opacity-60", className)}>
      <ExerseazaSubjectSelector
        selectedId={currentSubject}
        onSelect={selectSubject}
        compact={compact}
        size={size}
      />
    </div>
  )
}

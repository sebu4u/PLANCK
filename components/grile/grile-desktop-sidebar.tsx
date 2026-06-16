"use client"

import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { gradeLabels, type GradeLevel } from "@/lib/types/quiz-questions"
import { useGrileSubject } from "./grile-subject-context"

const GRADE_LEVELS: GradeLevel[] = [9, 10, 11, 12]

interface GrileDesktopSidebarProps {
  selectedClass: GradeLevel | null
  isLoading: boolean
  onSelectClass: (level: GradeLevel) => void
}

export function GrileDesktopSidebar({
  selectedClass,
  isLoading,
  onSelectClass,
}: GrileDesktopSidebarProps) {
  const { backHref, backLabel, classDescriptions, classIcons } = useGrileSubject()

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[300px] bg-white lg:block">
      <div className="catalog-sidebar-scroll flex h-full flex-col overflow-y-auto px-5 py-5">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2c2f33]/70 transition-colors hover:text-[#0b0c0f]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/55">
          Alege clasa
        </p>

        <nav className="space-y-1" aria-label="Clase disponibile">
          {GRADE_LEVELS.map((grade) => {
            const isActive = selectedClass === grade
            const GradeIcon = classIcons[grade]

            return (
              <button
                key={grade}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectClass(grade)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors disabled:cursor-wait disabled:opacity-60",
                  isActive
                    ? "bg-[#f5f4f2] text-[#0b0c0f]"
                    : "text-[#2c2f33]/80 hover:bg-[#faf9f7] hover:text-[#0b0c0f]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-white shadow-sm" : "bg-[#f5f4f2]",
                  )}
                >
                  <GradeIcon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{gradeLabels[grade]}</span>
                  <span className="block truncate text-xs text-[#2c2f33]/60">
                    {classDescriptions[grade]}
                  </span>
                </span>
                {isLoading && isActive ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" aria-hidden />
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

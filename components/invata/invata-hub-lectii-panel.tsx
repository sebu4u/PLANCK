"use client"

import Link from "next/link"
import { ChevronRight, Lock } from "lucide-react"
import { CURSURI_LOCKED_UNLOCK_LABEL, CURSURI_SUBJECTS } from "@/lib/cursuri-subjects"
import { cn } from "@/lib/utils"

interface InvataHubLectiiPanelProps {
  className?: string
  /** Hide the large page title (useful on mobile where the tab label already says „Lecții”). */
  compact?: boolean
}

export function InvataHubLectiiPanel({ className, compact = false }: InvataHubLectiiPanelProps) {
  return (
    <div className={cn(className)}>
      {!compact ? (
        <div className="mb-5">
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
            Lecții
          </h1>
          <p className="mt-1.5 text-sm text-[#6d6d6d] sm:text-base">
            Alege materia. Fiecare curs e organizat pe clasă, capitol și lecție.
          </p>
        </div>
      ) : null}

      <ul className="divide-y divide-[#ececec] border-t border-[#ececec]">
        {CURSURI_SUBJECTS.map((subject) => {
          const Icon = subject.icon
          const locked = subject.locked === true
          const rowClassName =
            "flex items-center gap-3 py-3.5 sm:gap-3.5 sm:py-4"

          return (
            <li key={subject.id}>
              {locked ? (
                <div
                  className={cn(rowClassName, "cursor-not-allowed opacity-55")}
                  aria-disabled="true"
                  title={`Se deblochează pe ${CURSURI_LOCKED_UNLOCK_LABEL}`}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#111111]">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-[#111111] sm:text-base">
                      {subject.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-[#8a8a8a]">
                      {CURSURI_LOCKED_UNLOCK_LABEL}
                    </span>
                  </span>
                  <Lock className="h-4 w-4 shrink-0 text-[#c0c0c0]" aria-hidden />
                </div>
              ) : (
                <Link
                  href={subject.href}
                  className={cn(
                    rowClassName,
                    "transition-colors hover:bg-[#fafafa] active:bg-[#f5f5f5]",
                  )}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#111111]">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-[#111111] sm:text-base">
                      {subject.label}
                    </span>
                    {!compact ? (
                      <span className="mt-0.5 block text-sm text-[#8a8a8a]">
                        {subject.description}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[#c0c0c0]"
                    aria-hidden
                  />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

"use client"

import { useCallback, useState, type ComponentType } from "react"
import { Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PersonalizedCourseGeneratorProps } from "@/components/invata/personalized-course-generator"

const INITIAL_PLACEHOLDER = "Ce vrei să înveți?"
const PILL_BORDER_CLASS = "border-[1.5px] border-[#d8d8d8]"
const PILL_HEIGHT_CLASS = "h-14"

type PersonalizedCourseGeneratorComponent = ComponentType<PersonalizedCourseGeneratorProps>
export type PersonalizedCourseGeneratorEntryProps = PersonalizedCourseGeneratorProps

function LightweightSearchPill({
  className,
  isLoading,
  onOpen,
}: {
  className?: string
  isLoading: boolean
  onOpen: () => void
}) {
  return (
    <div className={cn("relative w-full", PILL_HEIGHT_CLASS, className)}>
      <button
        type="button"
        onClick={onOpen}
        disabled={isLoading}
        aria-expanded={false}
        aria-haspopup="dialog"
        className={cn(
          "flex h-full w-full items-center gap-2.5 rounded-full bg-white px-4 text-left transition-colors hover:border-[#bdbdbd] disabled:cursor-wait disabled:opacity-80",
          PILL_BORDER_CLASS,
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[#9a9a9a]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm text-[#9a9a9a]">
          {INITIAL_PLACEHOLDER}
        </span>
        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] px-3.5 py-1.5 text-sm font-medium text-[#5f5f5f]">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            "Întreabă"
          )}
        </span>
      </button>
    </div>
  )
}

export function PersonalizedCourseGeneratorEntry(props: PersonalizedCourseGeneratorProps) {
  const [Generator, setGenerator] = useState<PersonalizedCourseGeneratorComponent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadFullGenerator = useCallback(() => {
    if (Generator || isLoading) return
    setIsLoading(true)
    void import("@/components/invata/personalized-course-generator")
      .then((mod) => {
        setGenerator(() => mod.PersonalizedCourseGenerator)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [Generator, isLoading])

  if (Generator) {
    return <Generator {...props} initialOpen />
  }

  return (
    <LightweightSearchPill
      className={props.className}
      isLoading={isLoading}
      onOpen={loadFullGenerator}
    />
  )
}

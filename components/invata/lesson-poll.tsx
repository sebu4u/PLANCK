"use client"

import { cn } from "@/lib/utils"
import { usePollState } from "@/components/invata/poll-section"

export interface LessonPollOption {
  id: string
  label: string
  feedback: string
}

interface LessonPollProps {
  imageSrc: string
  imageAlt: string
  options: LessonPollOption[]
  correctAnswerId: string
}

export function LessonPoll({ imageSrc, imageAlt, options, correctAnswerId }: LessonPollProps) {
  const pollState = usePollState()
  if (!pollState) return null

  const { selectedId, setSelectedId, verified } = pollState

  return (
    <div className="flex flex-col">
      <div className="aspect-video w-full overflow-hidden bg-white">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col items-start gap-2 p-4 sm:p-5">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !verified && setSelectedId(opt.id)}
              disabled={verified}
              className={cn(
                "inline-flex items-center justify-center rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors",
                verified && "cursor-default",
                !verified && "hover:opacity-90",
                isSelected
                  ? "border-[#8b5cf6] text-[#7c3aed]"
                  : "border-gray-300 bg-transparent text-[#4d4d4d]"
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

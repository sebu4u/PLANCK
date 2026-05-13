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

  const showImage = imageSrc.trim().length > 0

  return (
    <div className="flex flex-col">
      {showImage ? (
        <div className="aspect-video w-full overflow-hidden bg-white">
          <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="flex w-full justify-start p-4 sm:p-5">
        <div className="inline-flex max-w-full min-w-0 flex-col items-stretch gap-2">
          {options.map((opt) => {
            const isSelected = selectedId === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => !verified && setSelectedId(opt.id)}
                disabled={verified}
                className={cn(
                  "flex min-h-[2.75rem] items-center justify-start rounded-full border-2 px-4 py-2.5 text-left text-sm font-semibold leading-snug transition-colors",
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
    </div>
  )
}

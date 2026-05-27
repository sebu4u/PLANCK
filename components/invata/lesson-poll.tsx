"use client"

import { cn } from "@/lib/utils"
import { usePollState } from "@/components/invata/poll-section"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"

const POLL_OPTION_CARD_BASE =
  "w-full rounded-xl border-[3px] bg-white px-3 py-2.5 text-center transition-[border-color,box-shadow]"

export interface LessonPollOption {
  id: string
  label: string
  feedback: string
}

interface LessonPollProps {
  imageSrc: string
  imageAlt: string
  options: LessonPollOption[]
}

export function LessonPoll({ imageSrc, imageAlt, options }: LessonPollProps) {
  const pollState = usePollState()
  if (!pollState) return null

  const { selectedId, setSelectedId, verified, correctAnswerId } = pollState

  const showImage = imageSrc.trim().length > 0

  return (
    <div className="space-y-6">
      {showImage ? (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white">
          <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id
          const isCorrectOpt = opt.id === correctAnswerId
          const isChosenWrong = verified && isSelected && !isCorrectOpt
          const showFeedback = verified

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !verified && setSelectedId(opt.id)}
              disabled={verified}
              className={cn(
                POLL_OPTION_CARD_BASE,
                !showFeedback && !isSelected && "border-[#cfc3dc] shadow-[0_4px_0_#9d8ab3]",
                !showFeedback && isSelected && "border-violet-500 shadow-[0_4px_0_#5b21b6]",
                showFeedback && isCorrectOpt && "border-emerald-500 shadow-[0_4px_0_#047857]",
                isChosenWrong && "border-red-500 shadow-[0_4px_0_#b91c1c]",
                verified && "cursor-default"
              )}
            >
              <LatexRichText
                content={opt.label}
                className="break-words text-[#222] [&_.katex]:text-[#222] [&_p]:mx-auto [&_p]:my-0"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

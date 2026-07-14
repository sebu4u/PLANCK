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

  const {
    selectedId,
    setSelectedId,
    verified,
    isCorrect,
    disabledWrongIds,
    correctAnswerId,
  } = pollState

  const showImage = imageSrc.trim().length > 0

  return (
    <div className="space-y-6">
      {showImage ? (
        <div className="w-full overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white">
          <img src={imageSrc} alt={imageAlt} className="mx-auto w-full object-contain" />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id
          const isCorrectOpt = opt.id === correctAnswerId
          const isExcludedWrong = disabledWrongIds.has(opt.id)
          const isChosenWrong = verified && isSelected && !isCorrectOpt
          const showAsCorrect = verified && isCorrect === true && isCorrectOpt
          const canSelect = !verified && !isExcludedWrong

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => canSelect && setSelectedId(opt.id)}
              disabled={verified || isExcludedWrong}
              className={cn(
                POLL_OPTION_CARD_BASE,
                canSelect && !isSelected && "border-[#cfc3dc] shadow-[0_4px_0_#9d8ab3]",
                canSelect && isSelected && "border-violet-500 shadow-[0_4px_0_#5b21b6]",
                showAsCorrect && "border-emerald-500 shadow-[0_4px_0_#047857]",
                isChosenWrong && "border-red-500 shadow-[0_4px_0_#b91c1c]",
                isExcludedWrong &&
                  "cursor-not-allowed border-[#e0e0e0] bg-[#f3f3f3] text-[#999999] shadow-none",
                verified && !isExcludedWrong && "cursor-default"
              )}
            >
              <LatexRichText
                content={opt.label}
                className={cn(
                  "break-words [&_.katex]:text-[#222] [&_p]:mx-auto [&_p]:my-0",
                  isExcludedWrong && "text-[#999999] [&_.katex]:text-[#999999]",
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import type { FlashcardSessionCard } from "@/lib/learning-path-flashcard-types"
import { cn } from "@/lib/utils"
import {
  playFlashcardActionSound,
  playFlashcardAdvanceSound,
  playFlashcardDidntKnowSound,
  playFlashcardFlipSound,
  playFlashcardKnewSound,
  playFlashcardSessionCompleteSound,
} from "@/lib/flashcard-sounds"

interface FlashcardSessionProps {
  cards: FlashcardSessionCard[]
  onSelfAssess: (cardId: string, knew: boolean) => Promise<void>
  onComplete: () => void
  completeLabel?: string
  title?: string
  /** When true, renders as an inline learning-path item screen instead of a modal overlay. */
  embedded?: boolean
}

export function FlashcardSession({
  cards,
  onSelfAssess,
  onComplete,
  completeLabel = "Revenire la lecție",
  title = "Flashcard-uri",
  embedded = false,
}: FlashcardSessionProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [assessing, setAssessing] = useState(false)
  const [finished, setFinished] = useState(false)

  const card = cards[index]
  const isLast = index >= cards.length - 1

  if (!card) return null

  const handleFlip = () => {
    playFlashcardFlipSound()
    setFlipped(true)
  }

  const handleAssess = async (knew: boolean) => {
    if (assessing) return
    if (knew) {
      playFlashcardKnewSound()
    } else {
      playFlashcardDidntKnowSound()
    }
    setAssessing(true)
    try {
      await onSelfAssess(card.id, knew)
      if (isLast) {
        playFlashcardSessionCompleteSound()
        setFinished(true)
      } else {
        playFlashcardAdvanceSound()
        setIndex((prev) => prev + 1)
        setFlipped(false)
      }
    } finally {
      setAssessing(false)
    }
  }

  const handleComplete = () => {
    playFlashcardActionSound()
    onComplete()
  }

  const content = (
    <div className={cn("flex w-full flex-col", embedded ? "max-w-lg mx-auto" : "max-w-lg")}>
      <div className={cn("text-center", embedded ? "mb-6" : "mb-4")}>
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.18em]",
            embedded ? "text-violet-600" : "text-violet-200",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-1 text-sm font-semibold",
            embedded ? "text-[#6f657b]" : "text-white/90",
          )}
        >
          {finished ? "Gata!" : `${index + 1} / ${cards.length}`}
        </p>
      </div>

      {!finished ? (
        <>
          <div className="[perspective:1200px]" key={card.id}>
            <div
              className={cn(
                "relative min-h-[280px] transition-transform duration-500 ease-in-out",
                "[transform-style:preserve-3d]",
                flipped && "[transform:rotateY(180deg)]",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 flex min-h-[280px] flex-col rounded-[28px] border border-violet-100 bg-white p-6",
                  "[backface-visibility:hidden]",
                  embedded
                    ? "shadow-[0_18px_50px_rgba(76,44,114,0.08)]"
                    : "shadow-[0_24px_70px_rgba(0,0,0,0.25)]",
                )}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-600">
                  Întrebare
                </p>
                <div className="flex flex-1 items-center text-lg font-semibold leading-relaxed text-[#111111]">
                  <LatexRichText
                    content={card.front_text}
                    className="break-words [&_.katex]:text-[#111111]"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "absolute inset-0 flex min-h-[280px] flex-col rounded-[28px] border border-violet-100 bg-violet-50 p-6",
                  "[backface-visibility:hidden] [transform:rotateY(180deg)]",
                  embedded
                    ? "shadow-[0_18px_50px_rgba(76,44,114,0.08)]"
                    : "shadow-[0_24px_70px_rgba(0,0,0,0.25)]",
                )}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-600">
                  Răspuns
                </p>
                <div className="flex flex-1 items-center text-lg font-semibold leading-relaxed text-[#111111]">
                  <LatexRichText
                    content={card.back_text}
                    className="break-words [&_.katex]:text-[#111111]"
                  />
                </div>
              </div>
            </div>
          </div>

          {!flipped ? (
            <button
              type="button"
              onClick={handleFlip}
              className={cn(
                "mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-base font-bold transition-[transform,box-shadow] hover:translate-y-0.5",
                embedded
                  ? "bg-violet-600 text-white shadow-[0_4px_0_#5b21b6] hover:bg-violet-700"
                  : "bg-white text-violet-700 shadow-[0_4px_0_#c4b5fd]",
              )}
            >
              Arată răspunsul
            </button>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={assessing}
                onClick={() => void handleAssess(true)}
                className="rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 disabled:opacity-60"
              >
                Știam
              </button>
              <button
                type="button"
                disabled={assessing}
                onClick={() => void handleAssess(false)}
                className="rounded-full bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#be123c] transition-[transform,box-shadow] hover:translate-y-0.5 disabled:opacity-60"
              >
                Nu știam
              </button>
            </div>
          )}
        </>
      ) : (
        <div
          className={cn(
            "rounded-[28px] border border-emerald-200 bg-white p-8 text-center",
            embedded ? "shadow-[0_18px_50px_rgba(76,44,114,0.08)]" : "shadow-[0_24px_70px_rgba(0,0,0,0.25)]",
          )}
        >
          <p className="text-3xl" aria-hidden>
            ✨
          </p>
          <h2 className="mt-3 text-2xl font-black text-[#111111]">Ai parcurs flashcard-urile</h2>
          <p className="mt-2 text-sm text-[#5f657b]">
            Cardurile au fost salvate în deck-ul tău personal.
          </p>
          <button
            type="button"
            onClick={handleComplete}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5"
          >
            {completeLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem-4rem)] w-full flex-col items-center justify-center px-4 py-10 sm:min-h-[calc(100dvh-3.5rem-3rem)]">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[470] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      {content}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface LearningPathUpNextSectionProps {
  title: string
  description: string
  isCurrentLessonComplete: boolean
  isOpening: boolean
  onJumpAhead: () => void
  className?: string
}

export function LearningPathUpNextSection({
  title,
  description,
  isCurrentLessonComplete,
  isOpening,
  onJumpAhead,
  className,
}: LearningPathUpNextSectionProps) {
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false)
  const canJump = isCurrentLessonComplete

  const handleButtonClick = () => {
    if (isOpening) return
    if (canJump) {
      onJumpAhead()
      return
    }
    setShowIncompleteDialog(true)
  }

  return (
    <>
      <section
        className={cn(
          "mx-auto w-full max-w-md px-2 pt-16 pb-8 text-center sm:max-w-lg sm:px-4 sm:pb-12",
          className,
        )}
        aria-label="Următoarea lecție"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a9aa2] sm:text-sm">
          Următorul
        </p>
        <div className="mx-auto mt-3 h-px w-full max-w-[min(100%,20rem)] bg-[#e5e5e5]" />

        <h2 className="mt-10 text-2xl font-bold leading-tight text-[#111111] sm:mt-12 sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#6f657b] sm:text-base">
          {description}
        </p>

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isOpening}
          aria-busy={isOpening}
          className={cn(
            "mt-10 inline-flex w-full max-w-sm items-center justify-center rounded-full px-6 py-4 text-base font-bold transition-[transform,box-shadow,opacity] sm:mt-12",
            canJump
              ? "bg-[#e8e8ec] text-[#111111] shadow-[0_4px_0_#d0d0d4] hover:translate-y-0.5 hover:shadow-[0_2px_0_#d0d0d4] disabled:cursor-not-allowed disabled:opacity-70"
              : "cursor-pointer bg-[#ececef] text-[#b7b0be] shadow-[0_4px_0_#dedee2]",
          )}
        >
          {isOpening ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            "Sari către"
          )}
        </button>
      </section>

      <Dialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <DialogContent
          hideClose
          className="!z-[401] max-w-sm border-[#e5e5e5] bg-white p-6 shadow-xl"
          style={{ borderRadius: "24px" }}
          overlayClassName="!z-[400] !bg-black/45 backdrop-blur-none"
        >
          <div className="flex w-full flex-col items-center">
            <DialogHeader className="text-center">
              <DialogTitle className="text-center text-xl font-bold text-[#111111]">
                Ups..
              </DialogTitle>
            </DialogHeader>
            <p className="mt-4 text-center text-sm leading-relaxed text-[#4d4d4d]">
              Îți recomandăm să termini toată lecția curentă înainte să treci la următoarea.
            </p>
            <button
              type="button"
              onClick={() => setShowIncompleteDialog(false)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-4 text-base font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#050505]"
            >
              Am înțeles
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

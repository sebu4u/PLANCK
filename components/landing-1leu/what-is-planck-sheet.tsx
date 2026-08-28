"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { BookOpen, BrainCircuit, GraduationCap, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  LEARNING_PATHS_GRADES,
  LEARNING_PATHS_SUBJECTS_LABEL,
  QUIZ_COUNT,
  VIDEO_SOLUTIONS_COUNT,
} from "@/lib/platform-marketing"

const HIGHLIGHTS = [
  {
    icon: BookOpen,
    text: `Trasee pentru clasele ${LEARNING_PATHS_GRADES}: ${LEARNING_PATHS_SUBJECTS_LABEL}.`,
  },
  {
    icon: GraduationCap,
    text: `${QUIZ_COUNT} grile și ${VIDEO_SOLUTIONS_COUNT} probleme explicate video.`,
  },
  {
    icon: BrainCircuit,
    text: "Tutor AI Insight și pregătiri live — pentru notă, BAC și admitere.",
  },
] as const

type Landing1LeuWhatIsSheetProps = {
  open: boolean
  onClose: () => void
}

export function Landing1LeuWhatIsSheet({ open, onClose }: Landing1LeuWhatIsSheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Închide"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[490] bg-black/40 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="what-is-planck-title"
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[500] mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-gray-200 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex h-7 shrink-0 items-center justify-center" role="presentation">
          <div className="h-1 w-12 rounded-full bg-[#d4d4d4]" />
        </div>

        <div className="relative max-h-[min(78dvh,32rem)] overflow-y-auto px-5 pb-4 pt-1 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-0 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Închide"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7C5CFC]">
            PLANCK
          </p>
          <h2
            id="what-is-planck-title"
            className="mt-1 pr-10 text-[1.35rem] font-black leading-tight tracking-tight text-gray-900"
          >
            Ce este PLANCK?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
            Platforma de invatare pentru BAC. Trasee clare, probleme rezolvate video si sesiuni
            live cu elevii 1 la 1 sau in grupe mici
          </p>

          <ul className="mt-4 flex flex-col gap-2.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-2xl bg-[#F8F7FF] px-3.5 py-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7C5CFC] shadow-sm ring-1 ring-[#EBE8FF]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm font-medium leading-snug text-gray-700">{text}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#7C5CFC] text-[15px] font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] hover:brightness-110 active:brightness-[0.98]"
          >
            Am înțeles
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

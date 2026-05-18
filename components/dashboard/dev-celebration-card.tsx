"use client"

import { useEffect } from "react"
import { ChevronRight } from "lucide-react"
import type { DevCelebrationMessage } from "@/lib/dev-celebration-messages"
import { fireDevCelebrationConfetti } from "@/lib/learning-path-confetti"

interface DevCelebrationCardProps {
  message: DevCelebrationMessage
  onContinue: () => void
}

export function DevCelebrationCard({ message, onContinue }: DevCelebrationCardProps) {
  useEffect(() => {
    fireDevCelebrationConfetti()
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-[450] bg-black/35 backdrop-blur-sm" aria-hidden />
      <div className="fixed inset-0 z-[452] flex items-center justify-center px-5 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm animate-in rounded-[28px] border border-emerald-200 bg-white p-6 text-center shadow-[0_24px_70px_rgba(20,83,45,0.22)] fade-in zoom-in-95 duration-300">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{message.label}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#111111]">{message.headline}</h2>
          <div className="mt-5 rounded-2xl bg-[linear-gradient(180deg,#ecfdf5_0%,#f8fffb_100%)] px-5 py-6">
            <p className="text-sm font-semibold leading-relaxed text-[#5f6f67]">{message.body}</p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_#047857] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_2px_0_#047857]"
          >
            Continuă
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

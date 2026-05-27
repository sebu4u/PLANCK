"use client"

import { ChevronRight, Layers, Loader2 } from "lucide-react"
import { FlashcardSession } from "@/components/invata/flashcard-session"
import { useLearningPathFlashcardFlow } from "@/components/invata/learning-path-flashcard-flow-context"
import { playFlashcardActionSound } from "@/lib/flashcard-sounds"

export function LearningPathFlashcardOfferScreen() {
  const { acceptOffer, skipOffer, generating, generateError } = useLearningPathFlashcardFlow()

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-4rem)] w-full flex-col items-center justify-center px-4 py-10 sm:min-h-[calc(100dvh-3.5rem-3rem)]">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_8px_16px_rgba(124,58,237,0.24)]">
          <Layers className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
          Revizuire rapidă
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#111111] sm:text-3xl">
          Ai avut dificultăți la acest concept
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#5f657b] sm:text-base">
          Putem genera 3 flashcard-uri personalizate din această lecție ca să fixezi conceptul înainte
          să continui.
        </p>
        {generateError ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {generateError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            playFlashcardActionSound()
            void acceptOffer()
          }}
          disabled={generating}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_2px_0_#5b21b6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Se generează...
            </>
          ) : (
            <>
              Generează flashcard-uri
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            playFlashcardActionSound()
            void skipOffer()
          }}
          disabled={generating}
          className="mt-3 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-[#6f657b] transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          Continuă fără flashcard-uri
        </button>
      </div>
    </div>
  )
}

export function LearningPathFlashcardSessionScreen() {
  const { session, assessCard, completeSession } = useLearningPathFlashcardFlow()
  if (!session) return null

  return (
    <FlashcardSession
      embedded
      cards={session.cards}
      onSelfAssess={assessCard}
      onComplete={() => void completeSession()}
      completeLabel="Continuă lecția"
      title="Flashcard-uri"
    />
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Layers, Shuffle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { FlashcardSession } from "@/components/invata/flashcard-session"
import { assessDeckFlashcard, fetchFlashcardDeck } from "@/lib/learning-path-flashcard-client"
import type { DeckFlashcard } from "@/lib/learning-path-flashcard-types"
import { cn } from "@/lib/utils"

function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function FlashcardDeckView() {
  const { user, loading } = useAuth()
  const [cards, setCards] = useState<DeckFlashcard[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loadingDeck, setLoadingDeck] = useState(true)
  const [reviewCards, setReviewCards] = useState<DeckFlashcard[] | null>(null)
  const [weakOnly, setWeakOnly] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user?.id) {
      setLoadingDeck(false)
      return
    }
    void (async () => {
      try {
        const data = await fetchFlashcardDeck()
        setCards(Array.isArray(data.cards) ? data.cards : [])
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : "Nu s-a putut încărca deck-ul")
      } finally {
        setLoadingDeck(false)
      }
    })()
  }, [loading, user?.id])

  const filteredCards = useMemo(() => {
    if (!weakOnly) return cards
    return cards.filter((card) => card.dont_know_count > card.know_count)
  }, [cards, weakOnly])

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        chapterTitle: string
        chapterSlug: string | null
        lessons: Map<
          string,
          { lessonTitle: string; lessonSlug: string | null; cards: DeckFlashcard[] }
        >
      }
    >()

    for (const card of filteredCards) {
      const chapterKey = card.chapter_id ?? card.chapter_slug ?? "unknown"
      const lessonKey = card.lesson_id
      if (!map.has(chapterKey)) {
        map.set(chapterKey, {
          chapterTitle: card.chapter_title ?? "Capitol",
          chapterSlug: card.chapter_slug ?? null,
          lessons: new Map(),
        })
      }
      const chapterGroup = map.get(chapterKey)!
      if (!chapterGroup.lessons.has(lessonKey)) {
        chapterGroup.lessons.set(lessonKey, {
          lessonTitle: card.lesson_title ?? "Lecție",
          lessonSlug: card.lesson_slug ?? null,
          cards: [],
        })
      }
      chapterGroup.lessons.get(lessonKey)!.cards.push(card)
    }

    return [...map.values()]
  }, [filteredCards])

  const startReview = useCallback(
    (subset?: DeckFlashcard[]) => {
      const source = subset?.length ? subset : filteredCards
      if (!source.length) return
      setReviewCards(shuffleCards(source))
    },
    [filteredCards]
  )

  const handleDeckSelfAssess = useCallback(async (cardId: string, knew: boolean) => {
    await assessDeckFlashcard(cardId, knew)
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              know_count: card.know_count + (knew ? 1 : 0),
              dont_know_count: card.dont_know_count + (knew ? 0 : 1),
              last_reviewed_at: new Date().toISOString(),
            }
          : card
      )
    )
  }, [])

  if (loading || loadingDeck) {
    return (
      <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-8 text-center text-sm text-[#6f657b]">
        Se încarcă flashcard-urile...
      </div>
    )
  }

  if (!user?.id) {
    return (
      <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-8 text-center">
        <p className="text-sm text-[#6f657b]">Autentifică-te pentru a vedea flashcard-urile tale.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Autentificare
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/invata"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6f657b] hover:text-[#111111]"
        >
          <ChevronLeft className="h-4 w-4" />
          Înapoi la trasee
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeakOnly((prev) => !prev)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
              weakOnly
                ? "border-violet-300 bg-violet-50 text-violet-700"
                : "border-gray-200 bg-white text-[#555555] hover:bg-gray-50",
            )}
          >
            Doar pe care nu le știu
          </button>
          <button
            type="button"
            disabled={filteredCards.length === 0}
            onClick={() => startReview()}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4" />
            Revizuiește tot
          </button>
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {fetchError}
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-10 text-center">
          <Layers className="mx-auto h-10 w-10 text-violet-400" />
          <h2 className="mt-4 text-xl font-bold text-[#111111]">Niciun flashcard încă</h2>
          <p className="mt-2 text-sm text-[#6f657b]">
            Flashcard-urile apar aici după ce le generezi din traseele de învățare, când ai dificultăți
            la un concept.
          </p>
          <Link
            href="/invata"
            className="mt-5 inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Mergi la învățare
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((chapterGroup) => (
            <section key={chapterGroup.chapterTitle}>
              <h2 className="text-lg font-bold text-[#111111]">{chapterGroup.chapterTitle}</h2>
              <div className="mt-4 space-y-6">
                {[...chapterGroup.lessons.values()].map((lessonGroup) => (
                  <div
                    key={lessonGroup.lessonTitle}
                    className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#111111]">{lessonGroup.lessonTitle}</h3>
                        <p className="mt-1 text-sm text-[#6f657b]">
                          {lessonGroup.cards.length} carduri
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startReview(lessonGroup.cards)}
                        className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        Revizuiește lecția
                      </button>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {lessonGroup.cards.map((card) => (
                        <li
                          key={card.id}
                          className="rounded-xl border border-[#f0f0f0] bg-[#fafafa] px-4 py-3 text-sm text-[#333333]"
                        >
                          {card.front_text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {reviewCards ? (
        <FlashcardSession
          title="Deck personal"
          completeLabel="Închide revizuirea"
          cards={reviewCards.map((card, index) => ({
            id: card.id,
            front_text: card.front_text,
            back_text: card.back_text,
            order_index: index,
          }))}
          onSelfAssess={handleDeckSelfAssess}
          onComplete={() => setReviewCards(null)}
        />
      ) : null}
    </>
  )
}

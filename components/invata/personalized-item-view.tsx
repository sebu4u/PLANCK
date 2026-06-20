"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, X, AlertCircle, BookOpen } from "lucide-react"
import type { PersonalizedCourseItemPayload } from "@/lib/personalized-courses/types"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"
import { ITEM_TYPE_LABEL, getItemIcon } from "@/components/invata/learning-path-item-body"
import { PersonalizedItemContent } from "@/components/invata/personalized-item-content"
import { cn } from "@/lib/utils"

interface PersonalizedItemViewProps {
  payload: PersonalizedCourseItemPayload
}

export function PersonalizedItemView({ payload }: PersonalizedItemViewProps) {
  const router = useRouter()
  const {
    course,
    lesson,
    item,
    items,
    itemIndex,
    lessonBaseHref,
    nextItemHref,
    prevItemHref,
    completedItemIdsForLesson,
    initialCurrentItemCompleted,
    isLastItem,
  } = payload

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(completedItemIdsForLesson))
  const [currentCompleted, setCurrentCompleted] = useState(initialCurrentItemCompleted)
  const [isMarking, setIsMarking] = useState(false)
  const [markError, setMarkError] = useState<string | null>(null)

  const completedCount = useMemo(
    () => items.filter((entry) => completedIds.has(entry.id)).length,
    [completedIds, items],
  )
  const progress = items.length > 0 ? completedCount / items.length : 0
  const itemType = item.item_type as LearningPathLessonType
  const ItemIcon = getItemIcon(itemType)
  const typeLabel = ITEM_TYPE_LABEL[itemType] ?? "Item"
  const displayTitle = item.title?.trim() || typeLabel

  const markComplete = useCallback(async () => {
    if (currentCompleted) return true
    setIsMarking(true)
    setMarkError(null)
    try {
      const response = await fetch("/api/personalized-courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
        credentials: "same-origin",
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        setMarkError(data?.error?.trim() || "Nu am putut salva progresul. Încearcă din nou.")
        return false
      }
      setCompletedIds((prev) => {
        if (prev.has(item.id)) return prev
        const next = new Set(prev)
        next.add(item.id)
        return next
      })
      setCurrentCompleted(true)
      return true
    } catch {
      setMarkError("Conexiunea a eșuat. Verifică internetul și încearcă din nou.")
      return false
    } finally {
      setIsMarking(false)
    }
  }, [currentCompleted, item.id])

  const handleContinue = useCallback(async () => {
    const ok = await markComplete()
    if (ok) {
      router.push(nextItemHref)
    }
  }, [markComplete, nextItemHref, router])

  const continueLabel = isLastItem ? "Finalizează lecția" : "Continuă"

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-[300] flex h-14 items-center justify-between gap-3 border-b border-[#e5e5e5] bg-white px-4 shadow-sm sm:px-6">
        <Link
          href={lessonBaseHref}
          aria-label="Înapoi la lecție"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4d4d4d] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]"
        >
          <X className="h-5 w-5" />
        </Link>

        <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
          <div className="w-full max-w-[260px] sm:max-w-[360px]">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e5e5e5]">
              <div
                className="h-full rounded-full bg-[#1f1f1f] transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 text-sm font-medium text-[#4d4d4d]">
          <span className="tabular-nums">{itemIndex}/{items.length}</span>
        </div>
      </nav>

      {prevItemHref ? (
        <Link
          href={prevItemHref}
          aria-label="Pasul anterior"
          scroll
          className="fixed left-2 top-1/2 z-[250] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#4d4d4d] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-transform hover:scale-110 md:flex"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </Link>
      ) : null}

      {currentCompleted ? (
        <Link
          href={nextItemHref}
          aria-label={isLastItem ? "Înapoi la lecție" : "Pasul următor"}
          scroll
          className="fixed right-2 top-1/2 z-[250] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#4d4d4d] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-transform hover:scale-110 md:flex"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2.25} />
        </Link>
      ) : null}

      <main
        className="relative z-10 min-h-screen bg-[#ffffff] pt-14"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12">
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#e6e6e6] bg-white shadow-sm">
            <header className="border-b border-[#ececec] bg-[#f7f7f7] px-5 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-[#e6e6e6] text-[#5f5f5f]">
                  <ItemIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#8a8a8a]">
                    Pasul {itemIndex} din {items.length} · {typeLabel}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight text-[#111111] sm:text-3xl">
                    {displayTitle}
                  </h1>
                  <p className="mt-2 text-sm text-[#707070]">
                    {lesson.title} · {course.title}
                  </p>
                </div>
              </div>
            </header>

            <div className="px-5 py-6 sm:px-7 sm:py-8">
              <PersonalizedItemContent payload={payload} />
            </div>
          </div>

          {currentCompleted ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-[#f7f7f7] px-4 py-2.5 text-sm font-medium text-[#059669]">
              <CheckCircle2 className="h-4 w-4" />
              Pas marcat ca finalizat.
            </div>
          ) : null}
        </div>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-[300] border-t border-[#ececec] bg-white/95 px-4 pt-4 backdrop-blur-sm sm:px-6"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
      >
        {markError ? (
          <div className="mx-auto mb-3 flex max-w-5xl items-start gap-2 rounded-xl border border-[#e6e6e6] bg-[#f7f7f7] px-3.5 py-2.5 text-sm text-[#1f1f1f]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9a9a9a]" />
            <span>{markError}</span>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          {prevItemHref ? (
            <Link
              href={prevItemHref}
              scroll
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e6e6e6] bg-white text-[#4d4d4d] transition-colors hover:border-[#cfcfcf] hover:text-[#111111]"
              aria-label="Pasul anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={isMarking}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:px-8",
            )}
          >
            {isMarking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvez progresul…
              </>
            ) : (
              <>
                {currentCompleted ? "Continuă" : continueLabel}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

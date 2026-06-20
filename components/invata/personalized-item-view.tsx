"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react"
import type { PersonalizedCourseItemPayload } from "@/lib/personalized-courses/types"
import type { LearningPathLessonType } from "@/lib/supabase-learning-paths"
import {
  ITEM_TYPE_LABEL,
  getItemIcon,
} from "@/components/invata/learning-path-item-body"
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

  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(completedItemIdsForLesson),
  )
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
        setMarkError(
          data?.error?.trim() || "Nu am putut salva progresul. Încearcă din nou.",
        )
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
                className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 text-sm font-medium text-[#4d4d4d]">
          <span className="tabular-nums">
            {itemIndex}/{items.length}
          </span>
        </div>
      </nav>

      {prevItemHref ? (
        <Link
          href={prevItemHref}
          aria-label="Pasul anterior"
          scroll
          className="fixed left-2 top-1/2 z-[250] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e2ee] bg-white text-[#7c3aed] shadow-[0_8px_24px_rgba(82,44,111,0.12)] transition-transform hover:scale-110 md:flex"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.25} />
        </Link>
      ) : null}

      {currentCompleted ? (
        <Link
          href={nextItemHref}
          aria-label={isLastItem ? "Înapoi la lecție" : "Pasul următor"}
          scroll
          className="fixed right-2 top-1/2 z-[250] hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8e2ee] bg-white text-[#7c3aed] shadow-[0_8px_24px_rgba(82,44,111,0.12)] transition-transform hover:scale-110 md:flex"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2.25} />
        </Link>
      ) : null}

      <main
        className="relative z-10 min-h-screen bg-[#ffffff] pt-14"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12">
          <div className="mt-5 overflow-hidden rounded-[30px] border border-[#ebe4f1] bg-white shadow-[0_18px_50px_rgba(76,44,114,0.08)]">
            <header className="border-b border-[#eee7f3] bg-[linear-gradient(180deg,#fcfbfe_0%,#f7f4fb_100%)] px-5 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_8px_16px_rgba(124,58,237,0.24)]">
                  <ItemIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6fac]">
                    Pasul {itemIndex} din {items.length} · {typeLabel}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight text-[#111111] sm:text-3xl">
                    {displayTitle}
                  </h1>
                  <p className="mt-2 text-sm text-[#6f657b]">
                    Lecția {lesson.title} · {course.title}
                  </p>
                </div>
              </div>
            </header>

            <div className="px-5 py-6 sm:px-7 sm:py-8">
              <PersonalizedItemContent payload={payload} />
            </div>
          </div>

          {currentCompleted ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Pas marcat ca finalizat.
            </div>
          ) : null}
        </div>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-[300] border-t-2 border-[#eee7f3] bg-white/95 px-4 pt-4 backdrop-blur-sm sm:px-6"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
      >
        {markError ? (
          <div className="mx-auto mb-3 flex max-w-5xl items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{markError}</span>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          {prevItemHref ? (
            <Link
              href={prevItemHref}
              scroll
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ececec] bg-white text-[#4d4d4d] transition-colors hover:border-violet-200 hover:text-[#7c3aed]"
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
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:px-8",
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

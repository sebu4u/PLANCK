"use client"

import { useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react"
import type { LearningPathChapter, LearningPathLesson, LearningPathLessonItem } from "@/lib/supabase-learning-paths"
import { ITEM_TYPE_LABEL, getItemIcon } from "@/components/invata/learning-path-item-body"

interface LearningPathLessonPageProps {
  chapter: LearningPathChapter
  lesson: LearningPathLesson
  items: LearningPathLessonItem[]
}

const NODE_ROW_OFFSETS = ["ml-[6%]", "ml-[26%]", "ml-[12%]", "ml-[32%]", "ml-[18%]"]
const CTA_GLOW_TINT = "rgba(221, 211, 255, 0.84)"

export function LearningPathLessonPage({
  chapter,
  lesson,
  items,
}: LearningPathLessonPageProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id ?? null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0] ?? null,
    [items, selectedItemId]
  )
  const lessonBaseHref = `/invata/${chapter.slug ?? chapter.id}/${lesson.slug ?? lesson.id}`
  const selectedItemHref = selectedItem ? `${lessonBaseHref}/${selectedItem.order_index + 1}` : null

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-28 sm:px-8 lg:px-12">
      <Link
        href="/invata"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#4d4d4d] transition-colors hover:text-[#111111]"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la capitole
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="lg:self-start lg:max-h-[calc(100vh-8rem)] rounded-[24px] border border-[#e8e2ee] bg-white p-3 shadow-[0_12px_32px_rgba(82,44,111,0.08)] overflow-hidden sm:p-5">
          <div className="flex items-start justify-start bg-white">
            {lesson.image_url ? (
              <img
                src={lesson.image_url}
                alt={lesson.title}
                className="h-20 w-auto object-contain object-left sm:h-32 lg:h-36"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center bg-white text-[#8a8a95] sm:h-32 sm:w-32 lg:h-36 lg:w-36">
                <BookOpen className="h-6 w-6 sm:h-10 sm:w-10" />
              </div>
            )}
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b6fac] sm:text-xs">Level 1</p>
            <h1 className="mt-1 text-base font-bold leading-tight text-[#111111] sm:mt-2 sm:text-xl">{lesson.title}</h1>
            <p className="mt-2 text-xs leading-snug text-[#6f657b] sm:mt-3 sm:text-sm">
              {lesson.description || "Construiește pas cu pas această lecție."}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#22192d] sm:mt-4 sm:text-sm">
              {items.length} {items.length === 1 ? "lecție" : "lecții"}
            </p>
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-col items-center">
          {items.length ? (
            <>
              <div className="relative flex w-full flex-col items-center pt-2">
                {items.map((item, index) => {
                  const isSelected = item.id === selectedItem?.id
                  const ItemIcon = getItemIcon(item.item_type)
                  const offsetClass = NODE_ROW_OFFSETS[index % NODE_ROW_OFFSETS.length]

                  return (
                    <div key={item.id} className={`relative mb-10 w-fit max-w-full ${offsetClass}`}>
                      {index < items.length - 1 ? (
                        <div className="pointer-events-none absolute left-10 top-20 h-24 w-[3px] rounded-full bg-gradient-to-b from-[#ddd3ea] via-[#ece8f5] to-transparent" />
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className="group flex max-w-full items-center gap-4 text-left"
                      >
                        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                          {isSelected ? (
                            <>
                              <span className="absolute inset-0 rounded-full border-[5px] border-[#8b5cf6]/25" />
                              <span className="absolute inset-[3px] rounded-full border-[5px] border-l-transparent border-r-[#7c3aed] border-t-[#8b5cf6] border-b-[#7c3aed] animate-spin [animation-duration:2.6s]" />
                              <span className="absolute inset-[12px] rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] shadow-[0_8px_18px_rgba(124,58,237,0.35)]" />
                            </>
                          ) : (
                            <>
                              <span className="absolute inset-[1px] rounded-full bg-[#d9d9de]" />
                              <span className="absolute inset-[9px] rounded-full border border-white/70 bg-[#f4f4f7]" />
                            </>
                          )}
                          <span className={`relative z-[1] flex items-center justify-center ${isSelected ? "text-white" : "text-[#9a9aa2]"}`}>
                            <ItemIcon className="h-8 w-8" />
                          </span>
                        </span>

                        <span className="min-w-0">
                          <span
                            className={`block text-sm font-semibold sm:text-base ${
                              isSelected ? "text-[#18101f]" : "text-[#b7b0be]"
                            }`}
                          >
                            {item.title || ITEM_TYPE_LABEL[item.item_type]}
                          </span>
                          <span className={`mt-1 block text-xs ${isSelected ? "text-[#7d6a92]" : "text-[#d0c9d7]"}`}>
                            {ITEM_TYPE_LABEL[item.item_type]}
                          </span>
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>

              {selectedItem ? (
                <>
                  {/* Spacer păstrează layout-ul; cardul real e fixed mai jos */}
                  <div className="mt-6 h-[140px] w-full shrink-0 lg:w-1/2 lg:min-w-[200px] lg:max-w-sm" aria-hidden="true" />
                  <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 lg:left-[calc(360px+2rem)] lg:right-8 lg:justify-center xl:left-[calc(400px+2rem)]">
                    <div className="w-full rounded-[20px] border border-[#e9e0f0] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(82,44,111,0.08)] lg:w-[min(100%,320px)]">
                      <p className="text-center text-xl font-bold text-[#111111]">
                        {selectedItem.title || ITEM_TYPE_LABEL[selectedItem.item_type]}
                      </p>
                      <Link
                        href={selectedItemHref || lessonBaseHref}
                        className="dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]"
                        style={{ "--start-glow-tint": CTA_GLOW_TINT } as CSSProperties}
                      >
                        <span className="relative z-[1] inline-flex items-center gap-2">
                          Continuă
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <section className="w-full rounded-3xl border border-[#e7e7e7] bg-white p-6">
              <p className="text-sm text-[#666666]">Această lecție nu are încă itemi configurați.</p>
            </section>
          )}
        </section>
      </div>
    </div>
  )
}

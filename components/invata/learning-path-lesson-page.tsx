"use client"

import { useLayoutEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { BookOpen, ChevronRight } from "lucide-react"
import type { LearningPathChapter, LearningPathLesson, LearningPathLessonItem } from "@/lib/supabase-learning-paths"
import { ITEM_TYPE_LABEL, getItemIcon } from "@/components/invata/learning-path-item-body"
import { LockedLevelStickyCard } from "@/components/invata/locked-level-sticky-card"

interface LearningPathLessonPageProps {
  chapter: LearningPathChapter
  lesson: LearningPathLesson
  items: LearningPathLessonItem[]
  initialSelectedItemId?: string | null
}

const NODE_ROW_OFFSETS = ["ml-[6%]", "ml-[26%]", "ml-[12%]", "ml-[32%]", "ml-[18%]"]
const ITEMS_PER_LEVEL = 4

const LEVEL_CARD_THEMES = [
  {
    outline: "#7c3aed",
    label: "text-[#7c3aed]",
    from: "#8b5cf6",
    to: "#7c3aed",
    ring: "rgba(139, 92, 246, 0.25)",
    shadow: "rgba(124, 58, 237, 0.35)",
    buttonShadow: "#5b21b6",
    glow: "rgba(221, 211, 255, 0.84)",
  },
  {
    outline: "#2563eb",
    label: "text-[#2563eb]",
    from: "#3b82f6",
    to: "#2563eb",
    ring: "rgba(59, 130, 246, 0.25)",
    shadow: "rgba(37, 99, 235, 0.35)",
    buttonShadow: "#1d4ed8",
    glow: "rgba(191, 219, 254, 0.84)",
  },
  {
    outline: "#059669",
    label: "text-[#059669]",
    from: "#10b981",
    to: "#059669",
    ring: "rgba(16, 185, 129, 0.25)",
    shadow: "rgba(5, 150, 105, 0.35)",
    buttonShadow: "#047857",
    glow: "rgba(187, 247, 208, 0.84)",
  },
  {
    outline: "#ea580c",
    label: "text-[#ea580c]",
    from: "#f97316",
    to: "#ea580c",
    ring: "rgba(249, 115, 22, 0.25)",
    shadow: "rgba(234, 88, 12, 0.35)",
    buttonShadow: "#c2410c",
    glow: "rgba(254, 215, 170, 0.84)",
  },
  {
    outline: "#db2777",
    label: "text-[#db2777]",
    from: "#ec4899",
    to: "#db2777",
    ring: "rgba(236, 72, 153, 0.25)",
    shadow: "rgba(219, 39, 119, 0.35)",
    buttonShadow: "#be185d",
    glow: "rgba(251, 207, 232, 0.84)",
  },
] as const

export function LearningPathLessonPage({
  chapter,
  lesson,
  items,
  initialSelectedItemId = null,
}: LearningPathLessonPageProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialSelectedItemId ?? items[0]?.id ?? null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0] ?? null,
    [items, selectedItemId]
  )
  const lessonBaseHref = `/invata/${chapter.slug ?? chapter.id}/${lesson.slug ?? lesson.id}`
  const selectedItemHref = selectedItem ? `${lessonBaseHref}/${selectedItem.order_index + 1}` : null
  const levelCount = Math.ceil(items.length / ITEMS_PER_LEVEL)
  const selectedItemIndex = selectedItem ? Math.max(items.findIndex((item) => item.id === selectedItem.id), 0) : 0
  const selectedTheme = LEVEL_CARD_THEMES[Math.floor(selectedItemIndex / ITEMS_PER_LEVEL) % LEVEL_CARD_THEMES.length]

  useLayoutEffect(() => {
    if (!initialSelectedItemId || items.length < 2) return

    const resumeIndex = items.findIndex((item) => item.id === initialSelectedItemId)
    if (resumeIndex <= 0) return

    const runScroll = () => {
      document
        .getElementById(`learning-path-item-node-${initialSelectedItemId}`)
        ?.scrollIntoView({ block: "center", behavior: "instant" })
    }

    runScroll()
    const raf = window.requestAnimationFrame(runScroll)
    return () => window.cancelAnimationFrame(raf)
  }, [initialSelectedItemId, items])

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-28 sm:px-8 lg:px-12">
      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="border-0 bg-transparent p-0 shadow-none lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden lg:self-start lg:sticky lg:top-28 lg:rounded-[24px] lg:border lg:border-[#e8e2ee] lg:bg-white lg:p-5 lg:shadow-[0_12px_32px_rgba(82,44,111,0.08)]">
          <div className="flex w-full justify-center bg-transparent lg:justify-start">
            {lesson.image_url ? (
              <img
                src={lesson.image_url}
                alt={lesson.title}
                className="mx-auto h-36 w-auto max-w-full object-contain sm:h-40 lg:mx-0 lg:h-36 lg:object-left"
                loading="lazy"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center text-[#8a8a95] sm:h-40 sm:w-40 lg:h-36 lg:w-36">
                <BookOpen className="h-9 w-9 sm:h-10 sm:w-10 lg:h-10 lg:w-10" />
              </div>
            )}
          </div>
          <div className="mt-5 w-full text-center lg:mt-4 lg:text-left">
            <p className="mb-0 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b6fac] sm:text-xs lg:mb-2 lg:block">Level 1</p>
            <h1 className="text-xl font-bold leading-tight text-[#111111] sm:text-2xl lg:mt-1">{lesson.title}</h1>
            <p className="mt-3 text-sm leading-snug text-[#6f657b] lg:mt-3 lg:text-sm">
              {lesson.description || "Construiește pas cu pas această lecție."}
            </p>
            <p className="mt-3 text-sm font-semibold text-[#22192d] lg:mt-4">
              {items.length} {items.length === 1 ? "lecție" : "lecții"}
            </p>
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-col items-center">
          {items.length ? (
            <>
              {Array.from({ length: levelCount }, (_, levelIndex) => {
                const start = levelIndex * ITEMS_PER_LEVEL
                const levelItems = items.slice(start, start + ITEMS_PER_LEVEL)
                const levelNumber = levelIndex + 1
                const theme = LEVEL_CARD_THEMES[levelIndex % LEVEL_CARD_THEMES.length]
                const levelStartLabel = start + 1
                const levelEndLabel = start + levelItems.length

                return (
                  <div key={levelNumber} className="w-full">
                    <LockedLevelStickyCard
                      levelNumber={levelNumber}
                      blurredTitle={`Itemii ${levelStartLabel}-${levelEndLabel}`}
                      outlineColor={theme.outline}
                      labelColorClass={theme.label}
                    />

                    <div className="relative flex w-full flex-col items-center">
                      {levelItems.map((item, localIndex) => {
                        const index = start + localIndex
                        const isSelected = item.id === selectedItem?.id
                        const ItemIcon = getItemIcon(item.item_type)
                        const offsetClass = NODE_ROW_OFFSETS[index % NODE_ROW_OFFSETS.length]

                        return (
                          <div
                            key={item.id}
                            id={`learning-path-item-node-${item.id}`}
                            className={`relative mb-10 w-fit max-w-full ${offsetClass}`}
                          >
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
                                    <span
                                      className="absolute inset-0 rounded-full border-[5px]"
                                      style={{ borderColor: theme.ring }}
                                    />
                                    <span
                                      className="absolute inset-[3px] rounded-full border-[5px] border-l-transparent animate-spin [animation-duration:2.6s]"
                                      style={{
                                        borderTopColor: theme.from,
                                        borderRightColor: theme.to,
                                        borderBottomColor: theme.to,
                                      }}
                                    />
                                    <span
                                      className="absolute inset-[12px] rounded-full"
                                      style={{
                                        backgroundImage: `linear-gradient(to right, ${theme.from}, ${theme.to})`,
                                        boxShadow: `0 8px 18px ${theme.shadow}`,
                                      }}
                                    />
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
                  </div>
                )
              })}

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
                        className="dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold text-white transition-[transform,box-shadow] hover:translate-y-0.5"
                        style={
                          {
                            "--start-glow-tint": selectedTheme.glow,
                            backgroundImage: `linear-gradient(to right, ${selectedTheme.from}, ${selectedTheme.to})`,
                            boxShadow: `0 3px 0 ${selectedTheme.buttonShadow}`,
                          } as CSSProperties
                        }
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

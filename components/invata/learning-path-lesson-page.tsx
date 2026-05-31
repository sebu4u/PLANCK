"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, Lock } from "lucide-react"
import {
  getLearningPathLessonHref,
  getLearningPathRouteSegments,
  type LearningPathChapter,
  type LearningPathLesson,
  type LearningPathLessonItem,
} from "@/lib/supabase-learning-paths"
import { FREE_PLAN_LEARNING_PATH_ITEM_LIMIT } from "@/lib/learning-path-free-plan"
import { ITEM_TYPE_LABEL, getLessonItemDisplayIcon } from "@/components/invata/learning-path-item-body"
import { LockedLevelStickyCard } from "@/components/invata/locked-level-sticky-card"
import { LearningPathTrail } from "@/components/invata/learning-path-trail"
import { FreePlanComparisonOverlay } from "@/components/invata/free-plan-comparison-overlay"
import { prefetchLearningPathItem } from "@/lib/learning-path-item-client-cache"
import { cn } from "@/lib/utils"

function scrollLearningPathItemIntoView(itemId: string, behavior: ScrollBehavior = "smooth") {
  document.getElementById(`learning-path-item-node-${itemId}`)?.scrollIntoView({ block: "center", behavior })
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getLevelContinueGlow(from: string, to: string): string {
  return `radial-gradient(ellipse 85% 75% at 50% 100%, ${hexToRgba(to, 0.72)} 0%, ${hexToRgba(from, 0.42)} 34%, ${hexToRgba(from, 0.22)} 52%, ${hexToRgba(from, 0.1)} 68%, transparent 88%)`
}

interface FreeAccessState {
  itemsSolved: number
  itemsRemaining: number
}

interface LearningPathLessonPageProps {
  chapter: LearningPathChapter
  lesson: LearningPathLesson
  items: LearningPathLessonItem[]
  initialSelectedItemId?: string | null
  completedItemIds?: string[]
  freeAccess?: FreeAccessState | null
}

const NODE_ROW_OFFSETS = ["ml-[6%]", "ml-[26%]", "ml-[12%]", "ml-[32%]", "ml-[18%]"]
const ITEMS_PER_LEVEL = 6
const CONTINUE_CARD_EXIT_MS = 300
const PROGRESS_SCROLL_BUTTON_ANIM_MS = 280

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
  completedItemIds = [],
  freeAccess = null,
}: LearningPathLessonPageProps) {
  const router = useRouter()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialSelectedItemId ?? items[0]?.id ?? null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [isOpeningItem, setIsOpeningItem] = useState(false)
  const [isSelectedItemInViewport, setIsSelectedItemInViewport] = useState(false)
  const [progressScrollDirection, setProgressScrollDirection] = useState<"up" | "down" | null>(null)
  const [progressButtonMounted, setProgressButtonMounted] = useState(false)
  const [progressButtonExiting, setProgressButtonExiting] = useState(false)
  const progressButtonMountedRef = useRef(false)
  const completedItemIdSet = useMemo(() => new Set(completedItemIds), [completedItemIds])
  const showContinueCard = isSelectedItemInViewport

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0] ?? null,
    [items, selectedItemId]
  )
  const lessonBaseHref = getLearningPathLessonHref(chapter, lesson)
  const levelCount = Math.ceil(items.length / ITEMS_PER_LEVEL)
  const selectedItemIndex = selectedItem ? Math.max(items.findIndex((item) => item.id === selectedItem.id), 0) : 0
  const selectedItemHref = selectedItem ? `${lessonBaseHref}/${selectedItemIndex + 1}` : null
  const selectedTheme = LEVEL_CARD_THEMES[Math.floor(selectedItemIndex / ITEMS_PER_LEVEL) % LEVEL_CARD_THEMES.length]
  const nextItemId = useMemo(() => {
    const firstUncompleted = items.find((item) => !completedItemIdSet.has(item.id))
    return firstUncompleted?.id ?? items[0]?.id ?? null
  }, [items, completedItemIdSet])
  const isSelectedNextItem = selectedItem ? selectedItem.id === nextItemId : true

  const handleOpenItem = () => {
    if (!selectedItemHref || isOpeningItem) return

    setIsOpeningItem(true)
    router.prefetch(selectedItemHref)
    router.push(selectedItemHref)
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId)
    requestAnimationFrame(() => scrollLearningPathItemIntoView(itemId))
  }

  const updateProgressScrollDirection = useCallback(() => {
    if (!nextItemId) {
      setProgressScrollDirection(null)
      return
    }

    const node = document.getElementById(`learning-path-item-node-${nextItemId}`)
    if (!node) {
      setProgressScrollDirection(null)
      return
    }

    const rect = node.getBoundingClientRect()
    const nodeCenterY = rect.top + rect.height / 2
    const viewportCenterY = window.innerHeight / 2
    const centerThreshold = 72

    if (Math.abs(nodeCenterY - viewportCenterY) < centerThreshold) {
      setProgressScrollDirection(null)
      return
    }

    setProgressScrollDirection(nodeCenterY < viewportCenterY ? "up" : "down")
  }, [nextItemId])

  const handleScrollToProgress = () => {
    if (!nextItemId) return
    setSelectedItemId(nextItemId)
    scrollLearningPathItemIntoView(nextItemId)
  }

  useEffect(() => {
    if (!selectedItemId) {
      setIsSelectedItemInViewport(false)
      return
    }

    const node = document.getElementById(`learning-path-item-node-${selectedItemId}`)
    if (!node) {
      setIsSelectedItemInViewport(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSelectedItemInViewport(entry.isIntersecting)
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [selectedItemId])

  useEffect(() => {
    updateProgressScrollDirection()
    window.addEventListener("scroll", updateProgressScrollDirection, { passive: true })
    window.addEventListener("resize", updateProgressScrollDirection)
    return () => {
      window.removeEventListener("scroll", updateProgressScrollDirection)
      window.removeEventListener("resize", updateProgressScrollDirection)
    }
  }, [updateProgressScrollDirection, items.length, completedItemIds.join(",")])

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | undefined
    let exitTimer: ReturnType<typeof setTimeout> | undefined

    const hideProgressButton = () => {
      if (!progressButtonMountedRef.current) return

      setProgressButtonExiting(true)
      exitTimer = window.setTimeout(() => {
        progressButtonMountedRef.current = false
        setProgressButtonMounted(false)
        setProgressButtonExiting(false)
      }, PROGRESS_SCROLL_BUTTON_ANIM_MS)
    }

    if (showContinueCard || !progressScrollDirection) {
      hideProgressButton()
      return () => {
        if (exitTimer) window.clearTimeout(exitTimer)
      }
    }

    delayTimer = window.setTimeout(() => {
      if (!showContinueCard && progressScrollDirection) {
        progressButtonMountedRef.current = true
        setProgressButtonExiting(false)
        setProgressButtonMounted(true)
      }
    }, CONTINUE_CARD_EXIT_MS)

    return () => {
      if (delayTimer) window.clearTimeout(delayTimer)
      if (exitTimer) window.clearTimeout(exitTimer)
    }
  }, [showContinueCard, progressScrollDirection])

  useEffect(() => {
    if (!selectedItem) return
    const { chapterSegment, lessonSegment } = getLearningPathRouteSegments(chapter, lesson)
    prefetchLearningPathItem(chapterSegment, lessonSegment, selectedItemIndex + 1)
  }, [chapter, lesson, selectedItem, selectedItemIndex])

  useLayoutEffect(() => {
    if (!initialSelectedItemId || items.length < 2) return

    const resumeIndex = items.findIndex((item) => item.id === initialSelectedItemId)
    if (resumeIndex <= 0) return

    const runScroll = () => scrollLearningPathItemIntoView(initialSelectedItemId, "instant")

    runScroll()
    const raf = window.requestAnimationFrame(runScroll)
    return () => window.cancelAnimationFrame(raf)
  }, [initialSelectedItemId, items])

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-16 pb-6 sm:px-8 lg:px-12 lg:pt-28 lg:pb-10">
      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
          <aside className="border-0 bg-transparent p-0 shadow-none lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-[#e8e2ee] lg:bg-white lg:p-5 lg:shadow-[0_12px_32px_rgba(82,44,111,0.08)]">
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
          <Link
            href="/invata"
            className="hidden lg:inline-flex items-center gap-1.5 px-1 text-sm font-semibold text-[#6f657b] transition-colors hover:text-[#111111]"
          >
            <ChevronLeft className="h-4 w-4" />
            Înapoi la trasee
          </Link>
        </div>

        <section className="relative flex min-w-0 flex-col items-center">
          {items.length ? (
            <>
              <LearningPathTrail
                className="w-full"
                layoutKey={`${items.length}-${completedItemIds.join(",")}-${selectedItemId ?? ""}`}
              >
              {Array.from({ length: levelCount }, (_, levelIndex) => {
                const start = levelIndex * ITEMS_PER_LEVEL
                const levelItems = items.slice(start, start + ITEMS_PER_LEVEL)
                const levelNumber = levelIndex + 1
                const theme = LEVEL_CARD_THEMES[levelIndex % LEVEL_CARD_THEMES.length]
                const levelStartLabel = start + 1
                const levelEndLabel = start + levelItems.length
                const hasCompletedItemInLevel = levelItems.some((item) => completedItemIdSet.has(item.id))
                const isLevelColored = levelNumber === 1 || hasCompletedItemInLevel

                return (
                  <div key={levelNumber} className="w-full">
                    <LockedLevelStickyCard
                      levelNumber={levelNumber}
                      blurredTitle={`Itemii ${levelStartLabel}-${levelEndLabel}`}
                      outlineColor={theme.outline}
                      labelColorClass={theme.label}
                      isLocked={false}
                      isColored={isLevelColored}
                    />

                    <div className="relative flex w-full flex-col items-center">
                      {levelItems.map((item, localIndex) => {
                        const index = start + localIndex
                        const isSelected = item.id === selectedItem?.id
                        const isCompleted = completedItemIdSet.has(item.id)
                        const ItemIcon = getLessonItemDisplayIcon(item)
                        const isTest = item.item_type === "test"
                        const offsetClass = isTest
                          ? ""
                          : NODE_ROW_OFFSETS[index % NODE_ROW_OFFSETS.length]

                        return (
                          <div
                            key={item.id}
                            id={`learning-path-item-node-${item.id}`}
                            className={`relative mb-20 w-fit max-w-full sm:mb-10 ${offsetClass} ${isTest ? "mx-auto" : ""}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectItem(item.id)}
                              className={`group flex max-w-full items-center gap-4 text-left ${
                                isTest
                                  ? "rounded-[26px] border p-3 pr-4 shadow-[0_14px_34px_rgba(82,44,111,0.08)] transition-[transform,box-shadow,border-color] hover:-translate-y-0.5"
                                  : ""
                              }`}
                              style={
                                isTest
                                  ? ({
                                      borderColor: isSelected ? theme.from : "#e8ddf2",
                                      background: isSelected
                                        ? `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`
                                        : "linear-gradient(135deg, #ffffff 0%, #fbf8ff 100%)",
                                      boxShadow: isSelected
                                        ? `0 18px 40px ${theme.shadow}`
                                        : "0 14px 34px rgba(82,44,111,0.08)",
                                    } as CSSProperties)
                                  : undefined
                              }
                            >
                              {isTest ? (
                                <>
                                  <span
                                    data-learning-path-anchor="circle"
                                    data-trail-completed={isCompleted ? "true" : "false"}
                                    data-trail-stroke-from={theme.from}
                                    data-trail-stroke-to={theme.to}
                                    className={`relative flex h-16 w-16 shrink-0 rotate-3 items-center justify-center rounded-[22px] border-2 transition-transform group-hover:rotate-0 ${
                                      isSelected
                                        ? "border-white/40 bg-white/18 text-white"
                                        : isCompleted
                                          ? "border-transparent text-white"
                                          : "border-[#ded2eb] bg-[#f4efff] text-[#7c3aed]"
                                    }`}
                                    style={
                                      isCompleted && !isSelected
                                        ? ({
                                            backgroundImage: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
                                            boxShadow: `0 8px 18px ${theme.shadow}`,
                                          } as CSSProperties)
                                        : undefined
                                    }
                                  >
                                    <ItemIcon className="h-8 w-8" />
                                    <span
                                      className={`absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 ${
                                        isSelected ? "border-white bg-emerald-300" : "border-white bg-[#f59e0b]"
                                      }`}
                                    />
                                  </span>

                                  <span className="min-w-0">
                                    <span
                                      className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ${
                                        isSelected ? "bg-white/20 text-white" : "bg-[#fff7ed] text-[#c2410c]"
                                      }`}
                                    >
                                      Test
                                    </span>
                                    <span
                                      className={`flex items-center gap-1.5 text-sm font-bold leading-tight sm:text-base ${
                                        isSelected ? "text-white" : "text-[#18101f]"
                                      }`}
                                    >
                                      <span>{item.title || ITEM_TYPE_LABEL[item.item_type]}</span>
                                      {isCompleted ? (
                                        <span
                                          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                            isSelected ? "bg-white text-emerald-600" : "bg-emerald-500 text-white"
                                          }`}
                                          aria-label="Completat"
                                        >
                                          <Check className="h-3 w-3" strokeWidth={3} />
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className={`mt-1 block text-xs ${isSelected ? "text-white/78" : "text-[#8b6fac]"}`}>
                                      Provocare cu timp și scor minim
                                    </span>
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span
                                    data-learning-path-anchor="circle"
                                    data-trail-completed={isCompleted ? "true" : "false"}
                                    data-trail-stroke-from={theme.from}
                                    data-trail-stroke-to={theme.to}
                                    className="relative flex h-20 w-20 shrink-0 items-center justify-center"
                                  >
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
                                    ) : isCompleted ? (
                                      <>
                                        <span
                                          className="absolute inset-0 rounded-full border-[5px]"
                                          style={{ borderColor: theme.ring }}
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
                                    <span
                                      className={`relative z-[1] flex items-center justify-center ${
                                        isSelected || isCompleted ? "text-white" : "text-[#9a9aa2]"
                                      }`}
                                    >
                                      <ItemIcon className="h-8 w-8" />
                                    </span>
                                  </span>

                                  <span className="min-w-0">
                                    <span
                                      className={`flex items-center gap-1.5 text-sm font-semibold sm:text-base ${
                                        isSelected ? "text-[#18101f]" : "text-[#b7b0be]"
                                      }`}
                                    >
                                      <span>{item.title || ITEM_TYPE_LABEL[item.item_type]}</span>
                                      {isCompleted ? (
                                        <span
                                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                                          aria-label="Completat"
                                        >
                                          <Check className="h-3 w-3" strokeWidth={3} />
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className={`mt-1 block text-xs ${isSelected ? "text-[#7d6a92]" : "text-[#d0c9d7]"}`}>
                                      {ITEM_TYPE_LABEL[item.item_type]}
                                    </span>
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              </LearningPathTrail>

              {items.length > 0 ? (
                <>
                  <div
                    className={cn(
                      "mt-6 w-full shrink-0 transition-[height,margin] duration-300 lg:w-1/2 lg:min-w-[200px] lg:max-w-sm",
                      showContinueCard && selectedItem ? "h-[140px]" : "h-0 mt-0",
                    )}
                    aria-hidden="true"
                  />
                  <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-2 lg:bottom-6 lg:left-[calc(360px+2rem)] lg:right-8 xl:left-[calc(400px+2rem)]">
                    <div
                      className={cn(
                        "relative w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,28rem)] lg:w-[min(100%,320px)]",
                        progressButtonMounted && "min-h-9",
                      )}
                    >
                      {progressButtonMounted ? (
                        <button
                          type="button"
                          onClick={handleScrollToProgress}
                          className={cn(
                            "absolute bottom-0 left-0 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e9e0f0] bg-white text-[#4b5563] shadow-[0_8px_20px_rgba(82,44,111,0.12)] hover:-translate-y-0.5 hover:text-[#111111] hover:shadow-[0_10px_24px_rgba(82,44,111,0.16)]",
                            progressButtonExiting
                              ? "animate-learning-path-scroll-button-pop-out"
                              : "animate-learning-path-scroll-button-pop-in",
                          )}
                          aria-label="Mergi la progresul tău"
                        >
                          {progressScrollDirection === "up" ? (
                            <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                          ) : (
                            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                          )}
                        </button>
                      ) : null}

                      {selectedItem ? (
                        <div
                          className={cn(
                            "transition-[transform,opacity] duration-300",
                            showContinueCard
                              ? "relative translate-y-0 opacity-100"
                              : "pointer-events-none absolute inset-x-0 bottom-0 translate-y-8 opacity-0",
                          )}
                        >
                          <div
                            aria-hidden
                            className="pointer-events-none flex w-full shrink-0 justify-center overflow-x-visible overflow-y-visible"
                          >
                            <div
                              key={selectedTheme.outline}
                              className="h-[min(340px,56vh)] w-[min(94vw,44rem)] shrink-0 translate-y-[10%] blur-[28px] sm:w-[min(88vw,52rem)]"
                              style={{ backgroundImage: getLevelContinueGlow(selectedTheme.from, selectedTheme.to) }}
                            />
                          </div>

                          <div className="relative z-10 -mt-[min(200px,35vh)] w-full">
                            <div
                              key={selectedItem.id}
                              className="animate-learning-path-card-pop w-full rounded-[20px] border border-[#e9e0f0] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(82,44,111,0.08)]"
                            >
                      {freeAccess ? (
                        <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c3aed]">
                          {Math.min(freeAccess.itemsSolved, FREE_PLAN_LEARNING_PATH_ITEM_LIMIT)} / {FREE_PLAN_LEARNING_PATH_ITEM_LIMIT} itemi gratuiți
                        </p>
                      ) : null}
                      <p className="text-center text-xl font-bold text-[#111111]">
                        {selectedItem.title || ITEM_TYPE_LABEL[selectedItem.item_type]}
                      </p>
                      {(() => {
                        const isSelectedCompleted = completedItemIdSet.has(selectedItem.id)
                        const showSkipPaywall =
                          !!freeAccess && !isSelectedNextItem && !isSelectedCompleted
                        const showLimitPaywall =
                          !!freeAccess &&
                          !isSelectedCompleted &&
                          freeAccess.itemsRemaining <= 0 &&
                          isSelectedNextItem
                        const requiresPaywall = showSkipPaywall || showLimitPaywall
                        const buttonLabel = requiresPaywall
                          ? "Deblochează cu Plus+"
                          : isSelectedNextItem
                            ? "Continuă"
                            : "Sari către"

                        const commonClassName =
                          "dashboard-start-glow mt-3 inline-flex w-full items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold text-white transition-[transform,box-shadow] hover:translate-y-0.5"
                        const commonStyle = {
                          "--start-glow-tint": selectedTheme.glow,
                          backgroundImage: `linear-gradient(to right, ${selectedTheme.from}, ${selectedTheme.to})`,
                          boxShadow: `0 3px 0 ${selectedTheme.buttonShadow}`,
                        } as CSSProperties

                        if (requiresPaywall) {
                          return (
                            <button
                              type="button"
                              onClick={() => setPaywallOpen(true)}
                              className={commonClassName}
                              style={commonStyle}
                            >
                              <span className="relative z-[1] inline-flex items-center gap-2">
                                <Lock className="h-3.5 w-3.5" />
                                {buttonLabel}
                              </span>
                            </button>
                          )
                        }

                        return (
                          <button
                            type="button"
                            onClick={handleOpenItem}
                            disabled={isOpeningItem}
                            aria-busy={isOpeningItem}
                            className={`${commonClassName} disabled:cursor-not-allowed disabled:opacity-70`}
                            style={commonStyle}
                          >
                            <span className="relative z-[1] inline-flex items-center gap-2">
                              {buttonLabel}
                              {isOpeningItem ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </span>
                          </button>
                        )
                      })()}
                            </div>
                          </div>
                        </div>
                      ) : null}
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
      {paywallOpen ? <FreePlanComparisonOverlay onClose={() => setPaywallOpen(false)} /> : null}
    </div>
  )
}

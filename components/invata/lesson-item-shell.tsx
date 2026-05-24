"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import type { LearningPathLessonItem } from "@/lib/supabase-learning-paths"
import type { QuizQuestion } from "@/lib/types/quiz-questions"
import {
  GrilaLessonProvider,
  useGrilaLesson,
} from "@/components/invata/grila-lesson-context"
import { ProblemFeedbackBar } from "@/components/invata/problem-feedback-bar"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import { useLearningPathItemCompletion } from "@/hooks/use-learning-path-item-completion"
import { useLearningPathCorrectAnswerElo } from "@/hooks/use-learning-path-correct-answer-elo"
import { useMomentumTrigger } from "@/hooks/engagement/use-momentum-trigger"
import { useStreakTrigger } from "@/hooks/engagement/use-streak-trigger"
import { useStuckTrigger } from "@/hooks/engagement/use-stuck-trigger"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"
import {
  formatGrilaLearningPathContext,
  LEARNING_PATH_EXPLAIN_INITIAL_PROMPT,
} from "@/lib/learning-path-insight-context"
import {
  LearningPathExplainChatProvider,
  useLearningPathExplainChat,
} from "@/components/invata/learning-path-explain-chat-context"
import {
  useNavigateToNextLearningPathItem,
  useNavigateToPrevLearningPathItem,
  useOptionalLearningPathItemNavigation,
} from "@/components/invata/learning-path-item-navigation-context"
import { LearningPathItemChromeProvider, useLearningPathItemChrome } from "@/components/invata/learning-path-item-chrome-context"
import { LearningPathItemSlideContainer } from "@/components/invata/learning-path-item-slide-container"

const CTA_GLOW_TINT = "rgba(221, 211, 255, 0.84)"

import { playButtonClickSound } from "@/lib/platform-sounds"

function playClickSound() {
  playButtonClickSound()
}

interface LessonItemShellProps {
  chapterSlug: string
  lessonSlug: string
  itemIndex: number
  items: LearningPathLessonItem[]
  lessonId: string
  currentItemId: string
  /** Din DB la SSR; shell-ul confirmă din nou la client după login. */
  initialCurrentItemCompleted?: boolean
  /** Itemii deja marcați ca finalizați în lecția curentă (SSR + API la navigare). */
  completedItemIdsForLesson?: string[]
  lessonBaseHref: string
  isTextLesson: boolean
  hideBottomCta?: boolean
  overflowHidden?: boolean
  fullWidth?: boolean
  /** When set, bottom „Continuă” controls grila verify + navigation (learning-path grila items). */
  grilaQuestion?: QuizQuestion | null
  children: React.ReactNode
}

function LessonItemShellInner({
  chapterSlug,
  lessonSlug,
  itemIndex,
  items,
  lessonId,
  currentItemId,
  initialCurrentItemCompleted = false,
  completedItemIdsForLesson = [],
  lessonBaseHref,
  isTextLesson,
  hideBottomCta = false,
  overflowHidden = false,
  fullWidth = false,
  grilaQuestion = null,
  children,
}: LessonItemShellProps) {
  const explainChat = useLearningPathExplainChat()
  const insightDesktopOpen = Boolean(
    explainChat?.insightOpen && explainChat?.isDesktopViewport
  )
  const { user } = useAuth()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const [streak, setStreak] = useState<number | null>(null)
  const [showQuitDialog, setShowQuitDialog] = useState(false)
  const [showPrevItemCue, setShowPrevItemCue] = useState(false)
  const [showNextItemCue, setShowNextItemCue] = useState(false)
  const [currentItemCompleted, setCurrentItemCompleted] = useState(initialCurrentItemCompleted)
  const [completedItemIds, setCompletedItemIds] = useState(
    () => new Set(completedItemIdsForLesson),
  )
  const [mobileSwipeOffset, setMobileSwipeOffset] = useState(0)
  const [isMobileSwipeSettling, setIsMobileSwipeSettling] = useState(false)
  const prevArrowHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextArrowHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchAxisRef = useRef<"pending" | "horizontal" | "vertical" | null>(null)
  const swipeSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushMomentum = useMomentumTrigger()
  useStreakTrigger({ enabled: Boolean(user?.id) })

  const nextItemHref =
    itemIndex < items.length
      ? `${lessonBaseHref}/${itemIndex + 1}`
      : lessonBaseHref

  const prevItemHref = itemIndex > 1 ? `${lessonBaseHref}/${itemIndex - 1}` : null
  const itemNavigation = useOptionalLearningPathItemNavigation()
  const chrome = useLearningPathItemChrome()
  const slideDirection = itemNavigation?.slideDirection ?? "forward"
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const navigateToPrevItem = useNavigateToPrevLearningPathItem(prevItemHref)
  const prevItemTitle = itemIndex > 1 ? items[itemIndex - 2]?.title || "Pasul anterior" : null
  const nextItemTitle = itemIndex < items.length ? items[itemIndex]?.title || "Pasul următor" : "Înapoi la lecție"

  const completedItemIdsKey = completedItemIdsForLesson.join(",")
  const lessonProgress = useMemo(() => {
    if (items.length === 0) return 0
    const lessonItemIds = new Set(items.map((lessonItem) => lessonItem.id))
    let completedCount = 0
    for (const itemId of completedItemIds) {
      if (lessonItemIds.has(itemId)) completedCount++
    }
    return completedCount / items.length
  }, [completedItemIds, items])

  const markCurrentItemCompleted = useLearningPathItemCompletion({
    itemId: currentItemId,
    lessonId,
    isLastItem: itemIndex >= items.length,
  })

  const continueToNextItem = useCallback(async () => {
    await markCurrentItemCompleted()
    setCompletedItemIds((previous) => {
      if (previous.has(currentItemId)) return previous
      const next = new Set(previous)
      next.add(currentItemId)
      return next
    })
    pushMomentum({
      nextHref: nextItemHref,
      isLastItem: itemIndex >= items.length,
      itemIndex,
      totalItems: items.length,
    })
    await navigateToNextItem()
  }, [currentItemId, itemIndex, items.length, markCurrentItemCompleted, navigateToNextItem, nextItemHref, pushMomentum])

  useEffect(() => {
    setCurrentItemCompleted(initialCurrentItemCompleted)
  }, [initialCurrentItemCompleted])

  useEffect(() => {
    setCompletedItemIds(new Set(completedItemIdsForLesson))
  }, [completedItemIdsKey, lessonId])

  useEffect(() => {
    if (!currentItemCompleted) return
    setCompletedItemIds((previous) => {
      if (previous.has(currentItemId)) return previous
      const next = new Set(previous)
      next.add(currentItemId)
      return next
    })
  }, [currentItemCompleted, currentItemId])

  useEffect(() => {
    setMobileSwipeOffset(0)
    setIsMobileSwipeSettling(false)
  }, [currentItemId])

  useEffect(() => {
    if (!user?.id || !currentItemId) return

    let cancelled = false
    void supabase
      .from("user_learning_path_item_progress")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_id", currentItemId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setCurrentItemCompleted(initialCurrentItemCompleted)
          return
        }
        setCurrentItemCompleted(!!data)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, currentItemId, initialCurrentItemCompleted])

  useEffect(() => {
    if (!user) {
      setStreak(null)
      return
    }
    const fetchStreak = async () => {
      const { error: streakRpcError } = await supabase.rpc("check_and_reset_streak_if_needed", {
        user_uuid: user.id,
      })
      if (streakRpcError) {
        console.warn("Streak reset check failed:", streakRpcError.message)
      }
      const { data } = await supabase
        .from("user_stats")
        .select("current_streak")
        .eq("user_id", user.id)
        .single()
      setStreak(data?.current_streak ?? 0)
    }
    fetchStreak()
  }, [user])

  useEffect(() => {
    const canShowNextCue = currentItemCompleted
    if (!prevItemHref && !canShowNextCue) return

    const EDGE_PX = 96
    const HIDE_DELAY_MS = 220

    const clearPrevHideTimer = () => {
      if (prevArrowHideTimerRef.current) {
        clearTimeout(prevArrowHideTimerRef.current)
        prevArrowHideTimerRef.current = null
      }
    }

    const clearNextHideTimer = () => {
      if (nextArrowHideTimerRef.current) {
        clearTimeout(nextArrowHideTimerRef.current)
        nextArrowHideTimerRef.current = null
      }
    }

    const clearAllHideTimers = () => {
      clearPrevHideTimer()
      clearNextHideTimer()
    }

    const onMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return

      const w = window.innerWidth
      clearAllHideTimers()

      if (prevItemHref) {
        if (e.clientX < EDGE_PX) {
          setShowPrevItemCue(true)
        } else {
          prevArrowHideTimerRef.current = setTimeout(() => {
            setShowPrevItemCue(false)
            prevArrowHideTimerRef.current = null
          }, HIDE_DELAY_MS)
        }
      }

      if (canShowNextCue) {
        if (e.clientX > w - EDGE_PX) {
          setShowNextItemCue(true)
        } else {
          nextArrowHideTimerRef.current = setTimeout(() => {
            setShowNextItemCue(false)
            nextArrowHideTimerRef.current = null
          }, HIDE_DELAY_MS)
        }
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      clearAllHideTimers()
      window.removeEventListener("mousemove", onMove)
    }
  }, [prevItemHref, currentItemCompleted])

  useEffect(() => {
    const isMobileViewport = () => window.innerWidth < 768
    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest("a, button, input, textarea, select, iframe, [role='button']"))

    const clearSwipeSettleTimer = () => {
      if (swipeSettleTimerRef.current) {
        clearTimeout(swipeSettleTimerRef.current)
        swipeSettleTimerRef.current = null
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      clearSwipeSettleTimer()
      if (!isMobileViewport() || showQuitDialog || isInteractiveTarget(e.target)) {
        touchStartRef.current = null
        touchAxisRef.current = null
        return
      }

      const touch = e.touches[0]
      if (!touch) return
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      touchAxisRef.current = "pending"
      setIsMobileSwipeSettling(false)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isMobileViewport() || !touchStartRef.current) return

      const touch = e.touches[0]
      if (!touch) return

      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (touchAxisRef.current === "pending" && Math.max(absX, absY) > 8) {
        touchAxisRef.current = absX > absY * 1.2 ? "horizontal" : "vertical"
      }

      if (touchAxisRef.current !== "horizontal") return

      e.preventDefault()

      const canSwipePrev = dx > 0 && !!prevItemHref
      const canSwipeNext = dx < 0 && currentItemCompleted
      if (!canSwipePrev && !canSwipeNext) {
        setMobileSwipeOffset(0)
        return
      }

      const maxOffset = window.innerWidth * 0.82
      const resistedOffset = Math.sign(dx) * Math.min(absX, maxOffset)
      setMobileSwipeOffset(resistedOffset)
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!isMobileViewport() || !touchStartRef.current) {
        touchStartRef.current = null
        touchAxisRef.current = null
        return
      }

      const touch = e.changedTouches[0]
      const start = touchStartRef.current
      touchStartRef.current = null
      const axis = touchAxisRef.current
      touchAxisRef.current = null
      if (!touch) return

      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const isHorizontalSwipe = absX >= 70 && absX > absY * 1.4
      const shouldGoPrev = Boolean(axis === "horizontal" && isHorizontalSwipe && dx > 0 && prevItemHref)
      const shouldGoNext = Boolean(axis === "horizontal" && isHorizontalSwipe && dx < 0 && currentItemCompleted)

      if (shouldGoPrev || shouldGoNext) {
        setIsMobileSwipeSettling(true)
        setMobileSwipeOffset(Math.sign(dx) * window.innerWidth)
        playClickSound()
        swipeSettleTimerRef.current = setTimeout(() => {
          if (shouldGoPrev) {
            void navigateToPrevItem()
          } else {
            void navigateToNextItem()
          }
        }, 140)
        return
      }

      setIsMobileSwipeSettling(true)
      setMobileSwipeOffset(0)
      swipeSettleTimerRef.current = setTimeout(() => {
        setIsMobileSwipeSettling(false)
        swipeSettleTimerRef.current = null
      }, 180)
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("touchcancel", onTouchEnd, { passive: true })
    return () => {
      clearSwipeSettleTimer()
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("touchcancel", onTouchEnd)
    }
  }, [currentItemCompleted, navigateToNextItem, navigateToPrevItem, nextItemHref, prevItemHref, showQuitDialog])

  const progress = lessonProgress
  const mobileSwipeProgress = Math.min(1, Math.abs(mobileSwipeOffset) / 120)
  const isMobileSwipeActive = mobileSwipeOffset !== 0 || isMobileSwipeSettling

  const shell = (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[300] flex h-14 items-center justify-between gap-3 border-b border-[#e5e5e5] bg-white px-4 shadow-sm sm:px-6">
        <button
          type="button"
          onClick={() => setShowQuitDialog(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4d4d4d] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]"
          aria-label="Înapoi la dashboard"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
          <div className="w-full max-w-[240px] sm:max-w-[340px]">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e5e5e5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#4d4d4d]">
          <Flame className="h-4 w-4 text-orange-500 sm:h-4.5 sm:w-4.5" />
          <span className="tabular-nums">
            {streak !== null ? streak : "—"}
          </span>
        </div>
      </nav>

      {prevItemHref ? (
        <div
          className={cn(
            "pointer-events-none fixed left-0 top-14 z-[250] hidden w-[min(100vw,7rem)] items-center justify-start md:flex",
            /* Align cu zona de citire: fără bara „Continuă”, înălțime până la baza viewport; cu bara fixă jos, scădem ~aceeași rezervă ca padding-ul principalului (6rem). */
            hideBottomCta
              ? "h-[calc(100dvh-3.5rem)]"
              : "h-[calc(100dvh-3.5rem-6rem)]",
          )}
          aria-hidden={!showPrevItemCue}
        >
          <Link
            href={prevItemHref}
            onClick={(event) => {
              if (!itemNavigation) return
              event.preventDefault()
              playClickSound()
              void navigateToPrevItem()
            }}
            className={cn(
              "pointer-events-auto ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e8e2ee] bg-white text-[#7c3aed] shadow-[0_8px_24px_rgba(82,44,111,0.12)] transition-[opacity,transform,visibility] duration-200 sm:ml-3 sm:h-14 sm:w-14",
              showPrevItemCue
                ? "visible translate-x-0 opacity-100"
                : "invisible -translate-x-2 opacity-0 pointer-events-none",
            )}
            aria-label="Pasul anterior"
            scroll
          >
            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
          </Link>
        </div>
      ) : null}

      {currentItemCompleted ? (
        <div
          className={cn(
            "pointer-events-none fixed right-0 top-14 z-[250] hidden w-[min(100vw,7rem)] items-center justify-end md:flex",
            hideBottomCta
              ? "h-[calc(100dvh-3.5rem)]"
              : "h-[calc(100dvh-3.5rem-6rem)]",
          )}
          aria-hidden={!showNextItemCue}
        >
          <Link
            href={nextItemHref}
            onClick={(event) => {
              playClickSound()
              if (!itemNavigation) return
              event.preventDefault()
              void navigateToNextItem()
            }}
            className={cn(
              "pointer-events-auto mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e8e2ee] bg-white text-[#7c3aed] shadow-[0_8px_24px_rgba(82,44,111,0.12)] transition-[opacity,transform,visibility] duration-200 sm:mr-3 sm:h-14 sm:w-14",
              showNextItemCue
                ? "visible translate-x-0 opacity-100"
                : "invisible translate-x-2 opacity-0 pointer-events-none",
            )}
            aria-label={itemIndex < items.length ? "Pasul următor" : "Înapoi la lecție"}
            scroll
          >
            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
          </Link>
        </div>
      ) : null}

      <div
        className="pointer-events-none fixed inset-x-0 top-14 z-0 bg-[#f7f4fb] md:hidden"
        style={{
          bottom: hideBottomCta ? "0px" : "6rem",
        }}
        aria-hidden
      >
        {prevItemHref ? (
          <div
            className="absolute inset-y-0 left-0 flex w-1/2 items-center pl-5"
            style={{ opacity: mobileSwipeOffset > 0 ? mobileSwipeProgress : 0 }}
          >
            <div className="flex max-w-[11rem] items-center gap-3 rounded-2xl border border-[#e8e2ee] bg-white/90 px-4 py-3 text-[#7c3aed] shadow-[0_10px_28px_rgba(82,44,111,0.10)]">
              <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b6fac]">Anterior</p>
                <p className="truncate text-sm font-semibold text-[#22192d]">{prevItemTitle}</p>
              </div>
            </div>
          </div>
        ) : null}

        {currentItemCompleted ? (
          <div
            className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end pr-5"
            style={{ opacity: mobileSwipeOffset < 0 ? mobileSwipeProgress : 0 }}
          >
            <div className="flex max-w-[11rem] items-center gap-3 rounded-2xl border border-[#e8e2ee] bg-white/90 px-4 py-3 text-[#7c3aed] shadow-[0_10px_28px_rgba(82,44,111,0.10)]">
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b6fac]">
                  {itemIndex < items.length ? "Următor" : "Final"}
                </p>
                <p className="truncate text-sm font-semibold text-[#22192d]">{nextItemTitle}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.25} />
            </div>
          </div>
        ) : null}
      </div>

      <main
        className={cn(
          "relative z-10 min-h-screen bg-[#ffffff] pt-14",
          overflowHidden && "overflow-hidden",
          insightDesktopOpen && "lg:mr-[25vw]",
        )}
        style={{
          paddingBottom: hideBottomCta
            ? "max(16px, env(safe-area-inset-bottom, 0px))"
            : "calc(6rem + env(safe-area-inset-bottom, 0px))",
          touchAction: "pan-y",
        }}
      >
        <div
          ref={contentRef}
          className={cn(
            "mx-auto w-full px-5 sm:px-8 lg:px-12",
            !fullWidth && "max-w-5xl",
          )}
          style={{
            transform: isMobileSwipeActive ? `translate3d(${mobileSwipeOffset}px, 0, 0)` : undefined,
            transition: isMobileSwipeSettling ? "transform 160ms ease-out" : "none",
            willChange: isMobileSwipeActive ? "transform" : "auto",
            boxShadow:
              isMobileSwipeActive
                ? "0 0 32px rgba(82,44,111,0.10)"
                : "none",
          } as CSSProperties}
        >
          {itemNavigation ? (
            <LearningPathItemSlideContainer itemKey={currentItemId} direction={slideDirection}>
              {children}
            </LearningPathItemSlideContainer>
          ) : (
            children
          )}
        </div>
      </main>

      {!hideBottomCta && grilaQuestion ? (
        <GrilaLessonBottomCta
          grilaQuestion={grilaQuestion}
          nextItemHref={nextItemHref}
          onContinue={continueToNextItem}
          currentItemId={currentItemId}
          lessonId={lessonId}
          isLastItem={itemIndex >= items.length}
        />
      ) : !hideBottomCta ? (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[300] border-t-2 border-[#eee7f3] bg-white/95 px-4 pt-4 backdrop-blur-sm sm:px-6",
            insightDesktopOpen && "lg:right-[25vw]",
          )}
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto flex max-w-5xl justify-center">
            <Link
              href={nextItemHref}
              onClick={(event) => {
                event.preventDefault()
                playClickSound()
                void continueToNextItem()
              }}
              className="dashboard-start-glow inline-flex w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]"
              style={{ "--start-glow-tint": CTA_GLOW_TINT } as CSSProperties}
            >
              <span className="relative z-[1] inline-flex items-center gap-2">
                Continuă
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      ) : hideBottomCta ? (
        chrome?.fixedBottomBar
      ) : null}

      <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <DialogContent
          hideClose
          className="!z-[401] max-w-sm border-[#e5e5e5] bg-white p-6 shadow-xl"
          style={{ borderRadius: "24px" }}
          overlayClassName="!z-[400] !bg-black/45 backdrop-blur-none"
        >
          <div className="flex w-full flex-col items-center">
            <DialogHeader className="text-center">
              <DialogTitle className="text-center text-xl font-bold text-[#111111]">
                Ești sigur?
              </DialogTitle>
            </DialogHeader>
            <p className="mt-4 flex-1 text-center text-sm font-bold text-[#4d4d4d]">
              Dacă ieși, îți vei pierde progresul.
            </p>
            <div className="mt-6 flex w-full flex-col items-stretch gap-3">
            <button
              type="button"
              onClick={() => setShowQuitDialog(false)}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#2a2a2a] px-6 py-4 text-base font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505]"
            >
              Continuă să înveți
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-sm font-medium text-red-500 transition-colors hover:text-red-600"
            >
              Du-mă la dashboard
            </button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )

  return grilaQuestion ? (
    <GrilaLessonProvider question={grilaQuestion}>{shell}</GrilaLessonProvider>
  ) : (
    shell
  )
}

export function LessonItemShell(props: LessonItemShellProps) {
  return (
    <LearningPathExplainChatProvider currentItemId={props.currentItemId}>
      <LearningPathItemChromeProvider>
        <LessonItemShellInner {...props} />
      </LearningPathItemChromeProvider>
    </LearningPathExplainChatProvider>
  )
}

function GrilaLessonBottomCta({
  grilaQuestion,
  nextItemHref,
  onContinue,
  currentItemId,
  lessonId,
  isLastItem,
}: {
  grilaQuestion: QuizQuestion
  nextItemHref: string
  onContinue: () => Promise<void> | void
  currentItemId: string
  lessonId: string
  isLastItem: boolean
}) {
  const explainChat = useLearningPathExplainChat()
  const ctx = useGrilaLesson()
  const { pushHint, registerFailure, resetFailures } = useStuckTrigger({ surface: "invata" })
  const [eloAward, setEloAward] = useState<LearningPathEloAward | null>(null)
  const awardCorrectAnswerElo = useLearningPathCorrectAnswerElo({
    itemId: currentItemId,
    lessonId,
    isLastItem,
  })
  if (!ctx) return null

  const { selectedAnswer, isVerified, isCorrect, verify, reset } = ctx
  const hasAnswer = selectedAnswer !== null
  const barState = !isVerified ? "verify" : isCorrect ? "correct" : "incorrect"

  return (
    <ProblemFeedbackBar
      state={barState}
      hasAnswer={hasAnswer}
      nextItemHref={nextItemHref}
      onVerify={() => {
        void verify().then(async (result) => {
          if (result === false) registerFailure()
          if (result === true) {
            fireLearningPathCorrectConfetti()
            const award = await awardCorrectAnswerElo()
            setEloAward(award?.awarded ? award : null)
            resetFailures()
          }
        })
      }}
      onRetry={() => {
        setEloAward(null)
        reset()
      }}
      onContinue={onContinue}
      onExplain={() => {
        pushHint("manual")
        explainChat?.openExplainChat({
          problemStatement: formatGrilaLearningPathContext(
            grilaQuestion,
            selectedAnswer,
            isCorrect
          ),
          problemContextPreamble: "",
          initialUserMessage: LEARNING_PATH_EXPLAIN_INITIAL_PROMPT,
        })
      }}
      eloAward={eloAward}
      answerSlot={
        <span className="text-sm font-medium text-[#6f657b]">
          Răspunsul se selectează în chenarele de mai sus.
        </span>
      }
    />
  )
}

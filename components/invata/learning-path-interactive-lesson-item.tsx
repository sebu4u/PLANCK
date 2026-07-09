"use client"

import Link from "next/link"
import { createPortal } from "react-dom"
import { useNavigateToNextLearningPathItem } from "@/components/invata/learning-path-item-navigation-context"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type DependencyList } from "react"
import { Parser } from "expr-eval"
import { Reorder } from "framer-motion"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useLearningPathItemCompletion } from "@/hooks/use-learning-path-item-completion"
import { cn } from "@/lib/utils"
import type {
  CardSortContent,
  CodeTraceContent,
  FillSlotContent,
  FlowBuildContent,
  GraphBuildContent,
  MatchContent,
  MemoryFlipContent,
  ParsedInteractiveContent,
  RevealStepBlock,
  RevealStepsContent,
  SliderExploreContent,
  SpeedRoundContent,
  SwipeClassifyContent,
  TableFillContent,
} from "@/lib/learning-path-interactive-items"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useLearningPathExplainChat } from "@/components/invata/learning-path-explain-chat-context"
import { useStuckTrigger } from "@/hooks/engagement/use-stuck-trigger"
import {
  formatCardSortLearningPathContext,
  formatFillSlotLearningPathContext,
  formatRevealStepsQuizLearningPathContext,
  LEARNING_PATH_CARD_SORT_EXPLAIN_INITIAL_PROMPT,
  LEARNING_PATH_FILL_SLOT_EXPLAIN_INITIAL_PROMPT,
  LEARNING_PATH_REVEAL_STEPS_QUIZ_EXPLAIN_INITIAL_PROMPT,
} from "@/lib/learning-path-insight-context"
import { playErrorSound, playSuccessSound } from "@/lib/platform-sounds"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import { useLearningPathCorrectAnswerElo } from "@/hooks/use-learning-path-correct-answer-elo"
import type { LearningPathEloAward } from "@/lib/learning-path-elo"
import { ProblemFeedbackBar } from "@/components/invata/problem-feedback-bar"
import { useRegisterLearningPathFixedBottomBar, useRegisterLearningPathAiContext } from "@/components/invata/learning-path-item-chrome-context"
import { lpAiChatDesktopRightInset } from "@/lib/learning-path-ai-chat-layout"
import { FillSlotFormula, FillSlotLatex } from "@/components/invata/fill-slot-formula"
import {
  buildFillSlotLatex,
  FILL_SLOT_CHIP_DRAG_MIME,
  FILL_SLOT_CHIP_SELECTED,
} from "@/lib/fill-slot-latex"
import type { LearningPathFlashcardBridge } from "@/lib/learning-path-flashcard-bridge"

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function shellClass(extra?: string) {
  return cn(
    "rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 sm:p-6 shadow-sm",
    extra
  )
}

function ContinueRow({
  ready,
  nextItemHref,
  onContinue,
  label = "Continuă",
}: {
  ready: boolean
  nextItemHref: string
  onContinue: () => Promise<void>
  label?: string
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const handle = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onContinue()
    await navigateToNextItem()
  }
  return (
    <div className="mt-6 flex justify-center">
      <Link
        href={nextItemHref}
        onClick={handle}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity",
          ready
            ? "bg-[#111111] text-white hover:opacity-90"
            : "pointer-events-none bg-gray-300 text-gray-500"
        )}
      >
        {label}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function RichMini({ text, className }: { text: string; className?: string }) {
  if (!text.trim()) return null
  return (
    <div className={cn("prose prose-sm max-w-none text-[#222]", className)}>
      <LessonRichContent content={text} theme="light" />
    </div>
  )
}

const LESSON_CONTINUE_GLOW_TINT = "rgba(221, 211, 255, 0.84)"
const CARD_SORT_VERIFY_GLOW_TINT = "rgba(254, 215, 170, 0.84)"

function CardSortView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: CardSortContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const explainChat = useLearningPathExplainChat()
  const { pushHint } = useStuckTrigger({ surface: "invata" })

  const initial = useMemo(() => {
    const ids = data.cards.map((c) => c.id)
    const copy = [...ids]
    shuffleInPlace(copy)
    if (copy.join() === ids.join()) shuffleInPlace(copy)
    return copy
  }, [data.cards])
  const [order, setOrder] = useState(initial)
  /** none = no check yet; wrong = last check failed (user may reorder); correct = locked, may continue */
  const [checkPhase, setCheckPhase] = useState<"none" | "wrong" | "correct">("none")

  const cardById = useMemo(() => new Map(data.cards.map((c) => [c.id, c])), [data.cards])
  const showPerCardMarks = checkPhase !== "none"
  const perCardOk = showPerCardMarks
    ? order.map((id, i) => id === data.correctOrder[i])
    : null

  const onReorder = (next: string[]) => {
    setOrder(next)
    if (checkPhase === "wrong") setCheckPhase("none")
  }

  const handleVerify = () => {
    if (checkPhase === "correct") return
    const ok = order.every((id, i) => id === data.correctOrder[i])
    if (ok) {
      playSuccessSound()
      setCheckPhase("correct")
      onDone()
    } else {
      playErrorSound()
      setCheckPhase("wrong")
    }
  }

  const canContinue = checkPhase === "correct"

  const handleWhy = () => {
    pushHint("manual")
    const wasLastVerifyCorrect =
      checkPhase === "correct" ? true : checkPhase === "wrong" ? false : null
    explainChat?.openExplainChat({
      problemStatement: formatCardSortLearningPathContext({
        instructions: data.instructions,
        cards: data.cards,
        currentOrderIds: order,
        correctOrderIds: data.correctOrder,
        wasLastVerifyCorrect,
      }),
      problemContextPreamble: "",
      initialUserMessage: LEARNING_PATH_CARD_SORT_EXPLAIN_INITIAL_PROMPT,
    })
  }

  useRegisterLearningPathAiContext(
    () => {
      const wasLastVerifyCorrect =
        checkPhase === "correct" ? true : checkPhase === "wrong" ? false : null
      return formatCardSortLearningPathContext({
        instructions: data.instructions,
        cards: data.cards,
        currentOrderIds: order,
        correctOrderIds: data.correctOrder,
        wasLastVerifyCorrect,
      })
    },
    [checkPhase, data.cards, data.correctOrder, data.instructions, order],
  )

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!canContinue) return
    await markComplete()
    await navigateToNextItem()
  }

  return (
    <>
      <div className="flex w-full flex-col items-center">
        {data.instructions ? (
          <div className="mb-5 w-full max-w-md px-1 text-center sm:mb-6 sm:max-w-lg sm:px-2">
            <RichMini
              text={data.instructions}
              className="text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
            />
          </div>
        ) : null}
        <div className="w-full max-w-[220px] sm:max-w-[248px]">
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={checkPhase === "correct" ? () => {} : onReorder}
            className="flex w-full flex-col gap-3"
          >
            {order.map((id) => {
              const c = cardById.get(id)
              if (!c) return null
              const idx = order.indexOf(id)
              const ok = perCardOk ? perCardOk[idx] : null
              const showFeedback = checkPhase !== "none" && ok !== null
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  dragListener={checkPhase !== "correct"}
                  className={cn(
                    "w-full cursor-grab rounded-xl border-[3px] bg-white px-3 py-2.5 transition-[border-color,box-shadow] active:cursor-grabbing",
                    !showFeedback && "border-[#cfc3dc] shadow-[0_4px_0_#9d8ab3]",
                    showFeedback && ok === true && "border-emerald-500 shadow-[0_4px_0_#047857]",
                    showFeedback && ok === false && "border-red-500 shadow-[0_4px_0_#b91c1c]",
                  )}
                >
                  <RichMini text={c.text} className="text-center text-[#222] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none" />
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
          {checkPhase === "wrong" ? (
            <p className="mt-4 text-center text-sm font-medium text-red-600">
              Ordinea nu este corectă. Rearanjează cardurile.
            </p>
          ) : null}
          {checkPhase === "correct" ? (
            <p className="mt-4 text-center text-sm font-medium text-emerald-600">
              Foarte bine — ordinea este corectă!
            </p>
          ) : null}
        </div>
      </div>

      <InteractiveBottomChrome registrationDeps={[canContinue, checkPhase, order]}>
        <button
          type="button"
          onClick={handleWhy}
          className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 sm:px-5 sm:py-3 sm:text-base"
        >
          De ce?
        </button>
        {canContinue ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleVerify}
            className="dashboard-start-glow inline-flex min-h-[3.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#9a3412] sm:min-h-[3.5rem] sm:px-10 sm:py-4 sm:text-lg"
            style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1]">Verifică ordinea</span>
          </button>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

const MATCH_ASSOC_CARD_CLASS =
  "relative z-10 w-full rounded-xl border-[3px] bg-white px-3 py-2.5 text-center shadow-[0_4px_0_#9d8ab3] transition-[border-color,box-shadow,background-color] border-[#cfc3dc] [&_.prose]:my-0 [&_.prose]:text-center [&_.prose]:text-sm [&_p]:mx-auto [&_p]:my-0"

const MATCH_PAIR_MOBILE_COLORS = [
  { border: "border-violet-400", bg: "bg-violet-50", shadow: "shadow-[0_4px_0_#a78bfa]", divider: "border-violet-200", label: "text-violet-700" },
  { border: "border-sky-400", bg: "bg-sky-50", shadow: "shadow-[0_4px_0_#38bdf8]", divider: "border-sky-200", label: "text-sky-700" },
  { border: "border-amber-400", bg: "bg-amber-50", shadow: "shadow-[0_4px_0_#fbbf24]", divider: "border-amber-200", label: "text-amber-800" },
  { border: "border-rose-400", bg: "bg-rose-50", shadow: "shadow-[0_4px_0_#fb7185]", divider: "border-rose-200", label: "text-rose-700" },
  { border: "border-teal-400", bg: "bg-teal-50", shadow: "shadow-[0_4px_0_#2dd4bf]", divider: "border-teal-200", label: "text-teal-700" },
  { border: "border-fuchsia-400", bg: "bg-fuchsia-50", shadow: "shadow-[0_4px_0_#e879f9]", divider: "border-fuchsia-200", label: "text-fuchsia-700" },
  { border: "border-lime-400", bg: "bg-lime-50", shadow: "shadow-[0_4px_0_#a3e635]", divider: "border-lime-200", label: "text-lime-800" },
  { border: "border-orange-400", bg: "bg-orange-50", shadow: "shadow-[0_4px_0_#fb923c]", divider: "border-orange-200", label: "text-orange-800" },
] as const

function mobileMatchPairClasses(
  colorIndex: number | null,
  opts: { submitted: boolean; ok: boolean | null; selected: boolean },
) {
  if (opts.selected && !opts.submitted) {
    return "border-violet-500 bg-violet-50 shadow-[0_4px_0_#5b21b6]"
  }
  if (opts.submitted && opts.ok !== null) {
    return opts.ok
      ? "border-emerald-500 bg-emerald-50 shadow-[0_4px_0_#047857]"
      : "border-red-500 bg-red-50 shadow-[0_4px_0_#b91c1c]"
  }
  if (colorIndex === null) return ""
  const palette = MATCH_PAIR_MOBILE_COLORS[colorIndex % MATCH_PAIR_MOBILE_COLORS.length]!
  return cn(palette.border, palette.bg, palette.shadow)
}

function mobileMatchPairPalette(colorIndex: number | null) {
  if (colorIndex === null) return null
  return MATCH_PAIR_MOBILE_COLORS[colorIndex % MATCH_PAIR_MOBILE_COLORS.length]!
}

const INTERACTIVE_OPTION_CARD =
  "rounded-xl border-[3px] bg-white px-3 py-2.5 text-left shadow-[0_4px_0_#9d8ab3] transition-[border-color,box-shadow] border-[#cfc3dc] [&_.prose]:my-0 [&_.prose]:text-left [&_p]:my-0"

function InteractiveBottomChrome({
  children,
  registrationDeps = [],
}: {
  children: React.ReactNode
  registrationDeps?: DependencyList
}) {
  const explainChat = useLearningPathExplainChat()
  const insightDesktopOpen = Boolean(
    explainChat?.insightOpen && explainChat?.isDesktopViewport,
  )

  useRegisterLearningPathFixedBottomBar(
    () => (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[300] border-t-2 border-[#eee7f3] bg-white/95 px-4 pt-4 backdrop-blur-sm sm:px-6",
          lpAiChatDesktopRightInset(insightDesktopOpen),
        )}
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-3 sm:gap-4">
          {children}
        </div>
      </div>
    ),
    [insightDesktopOpen, ...registrationDeps]
  )
  return null
}

function FillSlotView({
  data,
  nextItemHref,
  markComplete,
  itemId,
  lessonId,
  isLastItem,
  chapterSlug,
  lessonSlug,
  chapterId,
  itemTitle,
  itemType,
}: {
  data: FillSlotContent
  nextItemHref: string
  markComplete: () => Promise<void>
  itemId: string
  lessonId: string
  isLastItem: boolean
  chapterSlug: string
  lessonSlug: string
  chapterId?: string | null
  itemTitle?: string | null
  itemType: string
}) {
  const explainChat = useLearningPathExplainChat()
  const { pushHint, registerFailure, resetFailures, consumeStruggledBeforeSuccess } =
    useStuckTrigger({ surface: "invata" })
  const awardCorrectAnswerElo = useLearningPathCorrectAnswerElo({
    itemId,
    lessonId,
    isLastItem,
  })

  const slotIds = useMemo(() => data.slots.map((s) => s.id), [data.slots])
  const [assign, setAssign] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(slotIds.map((id) => [id, null]))
  )
  const [active, setActive] = useState<string | null>(slotIds[0] ?? null)
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [verifyPhase, setVerifyPhase] = useState<"none" | "correct" | "incorrect">("none")
  const [screenFlash, setScreenFlash] = useState<"correct" | "incorrect" | null>(null)
  const [eloAward, setEloAward] = useState<LearningPathEloAward | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const chipSet = useMemo(() => new Set(data.chips), [data.chips])
  const lockedCorrect = verifyPhase === "correct"
  const verifyResult: "ok" | "bad" | null =
    verifyPhase === "correct" ? "ok" : verifyPhase === "incorrect" ? "bad" : null

  const renderedLatex = useMemo(
    () => buildFillSlotLatex(data.latexTemplate, assign, active, verifyResult, data.slots),
    [data.latexTemplate, assign, active, verifyResult, data.slots],
  )

  const used = new Set(Object.values(assign).filter(Boolean) as string[])
  const allFilled = slotIds.length > 0 && slotIds.every((id) => assign[id])
  const barState = verifyPhase === "none" ? "verify" : verifyPhase === "correct" ? "correct" : "incorrect"

  const selectSlot = (slotId: string) => {
    setActive(slotId)
    setSelectedChip(assign[slotId] ?? null)
  }

  const placeChipInSlot = (chip: string, slotId: string) => {
    const trimmed = chip.trim()
    if (!trimmed || !chipSet.has(trimmed) || lockedCorrect) return
    if (verifyPhase === "incorrect") setVerifyPhase("none")
    setSelectedChip(trimmed)
    setAssign((prev) => {
      const next: Record<string, string | null> = { ...prev }
      for (const id of slotIds) {
        if (next[id] === trimmed) next[id] = null
      }
      next[slotId] = trimmed
      return next
    })
    setActive(slotId)
  }

  const handleChipDragStart = (e: React.DragEvent, chip: string) => {
    setSelectedChip(chip.trim())
    e.dataTransfer.setData(FILL_SLOT_CHIP_DRAG_MIME, chip)
    e.dataTransfer.setData("text/plain", chip)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleChipDragEnd = () => {
    setDragOverSlot(null)
  }

  const handleVerify = async () => {
    if (!allFilled || lockedCorrect) return
    const allOk = data.slots.every((s) => (assign[s.id] || "").trim() === s.answer.trim())
    if (allOk) {
      playSuccessSound()
      fireLearningPathCorrectConfetti()
      const award = await awardCorrectAnswerElo()
      setEloAward(award?.awarded ? award : null)
      resetFailures()
      setVerifyPhase("correct")
      setScreenFlash("correct")
      window.setTimeout(() => setScreenFlash(null), 220)
    } else {
      playErrorSound()
      registerFailure()
      setVerifyPhase("incorrect")
      setScreenFlash("incorrect")
      window.setTimeout(() => setScreenFlash(null), 220)
    }
  }

  const handleRetry = () => {
    setVerifyPhase("none")
    setEloAward(null)
    setSelectedChip(active ? assign[active] ?? null : null)
  }

  const handleWhy = () => {
    pushHint("manual")
    explainChat?.openExplainChat({
      problemStatement: formatFillSlotLearningPathContext({
        instructions: data.instructions,
        latexTemplate: data.latexTemplate,
        slots: data.slots,
        assign,
        chips: data.chips,
        autoResult: verifyResult,
      }),
      problemContextPreamble: "",
      initialUserMessage: LEARNING_PATH_FILL_SLOT_EXPLAIN_INITIAL_PROMPT,
    })
  }

  const flashcardBridge = useMemo<LearningPathFlashcardBridge>(
    () => ({
      meta: {
        itemId,
        lessonId,
        chapterId,
        chapterSlug,
        lessonSlug,
        itemType,
        itemTitle,
      },
      getContext: () =>
        formatFillSlotLearningPathContext({
          instructions: data.instructions,
          latexTemplate: data.latexTemplate,
          slots: data.slots,
          assign,
          chips: data.chips,
          autoResult: verifyResult,
        }),
      consumeStruggledBeforeSuccess,
    }),
    [
      assign,
      chapterId,
      chapterSlug,
      consumeStruggledBeforeSuccess,
      data.chips,
      data.instructions,
      data.latexTemplate,
      data.slots,
      itemId,
      itemTitle,
      itemType,
      lessonId,
      lessonSlug,
      verifyResult,
    ]
  )

  useRegisterLearningPathAiContext(
    () =>
      formatFillSlotLearningPathContext({
        instructions: data.instructions,
        latexTemplate: data.latexTemplate,
        slots: data.slots,
        assign,
        chips: data.chips,
        autoResult: verifyResult,
      }),
    [
      assign,
      data.chips,
      data.instructions,
      data.latexTemplate,
      data.slots,
      verifyResult,
    ],
  )

  useRegisterLearningPathFixedBottomBar(
    () => (
      <ProblemFeedbackBar
        state={barState}
        hasAnswer={allFilled}
        nextItemHref={nextItemHref}
        onVerify={() => {
          void handleVerify()
        }}
        onRetry={handleRetry}
        onContinue={markComplete}
        onExplain={handleWhy}
        eloAward={eloAward}
        retryLabel="Încearcă din nou"
        flashcardBridge={flashcardBridge}
        answerSlot={
          <span className="text-sm font-medium text-[#6f657b]">
            Completează toate sloturile din formulă, apoi apasă Verifică.
          </span>
        }
      />
    ),
    [barState, allFilled, nextItemHref, eloAward, assign, verifyPhase, flashcardBridge],
  )

  const chipCardBase =
    "rounded-lg border-[2.5px] bg-white px-2 py-1.5 text-center transition-[border-color,box-shadow,opacity] shadow-[0_3px_0_#9d8ab3] border-[#cfc3dc] sm:rounded-xl sm:border-[3px] sm:px-2.5 sm:py-2 sm:shadow-[0_3px_0_#9d8ab3]"

  return (
    <>
      <SwipeClassifyScreenFlash feedback={screenFlash} />
      <div
        className={cn(
          "flex min-h-[calc(100dvh-3.5rem-8rem)] w-full flex-col items-center justify-center px-2 pb-2 sm:min-h-[calc(100dvh-3.5rem-7.5rem)]",
          verifyPhase === "incorrect" && "animate-grile-wrong-shake",
        )}
      >
        <div className="flex w-full max-w-full flex-col items-center">
          {data.instructions ? (
            <div className="mb-5 w-full max-w-md px-1 text-center sm:mb-6 sm:max-w-lg sm:px-2">
              <RichMini
                text={data.instructions}
                className="text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
              />
            </div>
          ) : null}
          <div className="mb-8 w-full sm:mb-10">
            <FillSlotFormula
              latex={renderedLatex}
              slotIds={slotIds}
              autoResult={verifyResult}
              dragOverSlot={dragOverSlot}
              onSelectSlot={selectSlot}
              onDropChip={placeChipInSlot}
              setDragOverSlot={setDragOverSlot}
            />
          </div>

        <div className="mx-auto flex w-full max-w-[168px] flex-col gap-2 md:max-w-3xl md:flex-row md:flex-wrap md:justify-center md:gap-x-2.5 md:gap-y-2">
          {data.chips.map((chip) => {
            const taken = used.has(chip)
            return (
              <button
                type="button"
                key={chip}
                draggable={!lockedCorrect}
                onDragStart={(e) => handleChipDragStart(e, chip)}
                onDragEnd={handleChipDragEnd}
                disabled={lockedCorrect}
                onClick={() => {
                  if (lockedCorrect) return
                  setSelectedChip(chip)
                  if (!active) return
                  placeChipInSlot(chip, active)
                }}
                className={cn(
                  chipCardBase,
                  "w-full touch-manipulation select-none hover:border-[#a898bc] md:w-auto md:min-w-[3.75rem] md:max-w-[6rem] md:shrink-0",
                  !lockedCorrect && "cursor-grab active:cursor-grabbing",
                  lockedCorrect && "cursor-not-allowed opacity-60",
                  taken && !selectedChip && "opacity-90",
                  selectedChip === chip && FILL_SLOT_CHIP_SELECTED,
                )}
              >
                <FillSlotLatex
                  content={chip}
                  className="text-[#222] [&_.katex]:text-xs md:[&_.katex]:text-[0.8125rem]"
                />
              </button>
            )
          })}
        </div>
        </div>
      </div>
    </>
  )
}

function MatchView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: MatchContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const explainChat = useLearningPathExplainChat()

  const wrapRef = useRef<HTMLDivElement>(null)
  const mobileRightSectionRef = useRef<HTMLDivElement>(null)
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pickL, setPickL] = useState<string | null>(null)
  const [edges, setEdges] = useState<{ leftId: string; rightId: string }[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; ok: boolean }[]>([])

  const shuffledLeft = useMemo(() => {
    const copy = [...data.left]
    shuffleInPlace(copy)
    return copy
  }, [data.left])

  const shuffledRight = useMemo(() => {
    const copy = [...data.right]
    shuffleInPlace(copy)
    return copy
  }, [data.right])

  const rightById = useMemo(() => new Map(data.right.map((row) => [row.id, row])), [data.right])
  const leftById = useMemo(() => new Map(data.left.map((row) => [row.id, row])), [data.left])

  const pairColorByLeftId = useMemo(() => {
    const map = new Map<string, number>()
    let next = 0
    for (const edge of edges) {
      if (!map.has(edge.leftId)) {
        map.set(edge.leftId, next)
        next += 1
      }
    }
    return map
  }, [edges])

  const getMobilePairColorIndex = (leftId?: string, rightId?: string) => {
    if (leftId && pairColorByLeftId.has(leftId)) return pairColorByLeftId.get(leftId)!
    if (rightId) {
      const edge = edges.find((e) => e.rightId === rightId)
      if (edge) return pairColorByLeftId.get(edge.leftId) ?? null
    }
    return null
  }

  const correctSet = useMemo(
    () => new Set(data.pairs.map((p) => `${p.leftId}:${p.rightId}`)),
    [data.pairs]
  )

  const allMatchCorrect = useMemo(() => {
    if (!submitted || edges.length !== data.left.length) return false
    return edges.every((e) => correctSet.has(`${e.leftId}:${e.rightId}`))
  }, [submitted, edges, data.left.length, correctSet])

  useLayoutEffect(() => {
    if (!wrapRef.current) return
    const root = wrapRef.current.getBoundingClientRect()
    const next: typeof lines = []
    for (const e of edges) {
      const a = leftRefs.current[e.leftId]?.getBoundingClientRect()
      const b = rightRefs.current[e.rightId]?.getBoundingClientRect()
      if (!a || !b) continue
      const ok = submitted ? correctSet.has(`${e.leftId}:${e.rightId}`) : true
      next.push({
        x1: a.left + a.width - root.left,
        y1: a.top + a.height / 2 - root.top,
        x2: b.left - root.left,
        y2: b.top + b.height / 2 - root.top,
        ok,
      })
    }
    setLines(next)
  }, [edges, submitted, correctSet])

  const onPickLeft = (id: string) => {
    if (allMatchCorrect) return
    setSubmitted(false)
    setPickL(id)
    requestAnimationFrame(() => {
      if (window.matchMedia("(min-width: 768px)").matches) return
      mobileRightSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
  }

  const onPickRight = (id: string) => {
    if (allMatchCorrect || !pickL) return
    setSubmitted(false)
    setEdges((prev) => {
      const without = prev.filter((e) => e.leftId !== pickL && e.rightId !== id)
      return [...without, { leftId: pickL, rightId: id }]
    })
    setPickL(null)
  }

  const handleReset = () => {
    setEdges([])
    setPickL(null)
    setSubmitted(false)
  }

  const handleVerify = () => {
    if (edges.length !== data.left.length) return
    setSubmitted(true)
    onDone()
  }

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!allMatchCorrect) return
    await markComplete()
    await navigateToNextItem()
  }

  const canVerify = edges.length === data.left.length && !allMatchCorrect
  const canReset = edges.length > 0 || pickL !== null || submitted

  const leftButtonClass = (rowId: string) => {
    const edge = edges.find((e) => e.leftId === rowId)
    const okEdge = edge && correctSet.has(`${edge.leftId}:${edge.rightId}`)
    return cn(
      MATCH_ASSOC_CARD_CLASS,
      !submitted && pickL === rowId && "border-violet-500 shadow-[0_4px_0_#5b21b6]",
      submitted && okEdge && "border-emerald-500 shadow-[0_4px_0_#047857]",
      submitted && !okEdge && "border-red-500 shadow-[0_4px_0_#b91c1c]",
    )
  }

  const rightButtonClass = (rowId: string) => {
    const edge = edges.find((e) => e.rightId === rowId)
    const okEdge = edge && correctSet.has(`${edge.leftId}:${edge.rightId}`)
    return cn(
      MATCH_ASSOC_CARD_CLASS,
      submitted && okEdge && "border-emerald-500 shadow-[0_4px_0_#047857]",
      submitted && !okEdge && "border-red-500 shadow-[0_4px_0_#b91c1c]",
    )
  }

  const mobileHint = pickL
    ? "Acum alege corespondentul din a doua listă."
    : edges.length === data.left.length
      ? submitted
        ? allMatchCorrect
          ? "Toate asocierile sunt corecte!"
          : "Unele asocieri sunt greșite — corectează și verifică din nou."
        : "Apasă Verifică asocierile când ești gata."
      : "Apasă un card din prima listă, apoi pe corespondentul din a doua."

  return (
    <>
      <div className="flex min-h-[calc(100dvh-3.5rem-9rem)] w-full flex-col items-center px-2 pb-2 pt-1 sm:min-h-[calc(100dvh-3.5rem-8rem)] sm:pt-2">
        <p className="mb-3 max-w-lg text-center text-base font-medium leading-snug text-[#22192d] sm:mb-6 sm:max-w-xl sm:text-lg md:mb-6">
          <span className="md:hidden">{mobileHint}</span>
          <span className="hidden md:inline">Asociază cardurile din stânga cu cardurile din dreapta.</span>
        </p>
        <p className="mb-4 text-sm font-semibold tabular-nums text-[#6f657b] md:hidden">
          {edges.length}/{data.left.length} asocieri
        </p>
        <div className="flex w-full flex-1 flex-col justify-center">
          <div className="relative mx-auto w-full max-w-3xl md:hidden">
            <div className="mx-auto flex w-full max-w-md flex-col gap-5">
              <section aria-label="Prima listă">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#6f657b]">Prima listă</p>
                <div className="flex flex-col gap-2.5">
                  {shuffledLeft.map((row) => {
                    const edge = edges.find((e) => e.leftId === row.id)
                    const matchedRight = edge ? rightById.get(edge.rightId) : null
                    const okEdge = edge ? correctSet.has(`${edge.leftId}:${edge.rightId}`) : null
                    const colorIndex = getMobilePairColorIndex(row.id)
                    const pairPalette = mobileMatchPairPalette(colorIndex)
                    return (
                      <button
                        type="button"
                        key={row.id}
                        onClick={() => onPickLeft(row.id)}
                        disabled={allMatchCorrect}
                        className={cn(
                          MATCH_ASSOC_CARD_CLASS,
                          mobileMatchPairClasses(colorIndex, {
                            submitted,
                            ok: edge ? (submitted ? okEdge : null) : null,
                            selected: pickL === row.id,
                          }),
                          !submitted && "active:scale-[0.99]",
                        )}
                      >
                        <RichMini text={row.text} />
                        {matchedRight ? (
                          <div className={cn("mt-2 border-t pt-2 text-left", pairPalette?.divider ?? "border-[#ece6f3]")}>
                            <p
                              className={cn(
                                "mb-1 text-[10px] font-semibold uppercase tracking-wide",
                                pairPalette?.label ?? "text-[#9a8fb0]",
                              )}
                            >
                              Asociat cu
                            </p>
                            <RichMini
                              text={matchedRight.text}
                              className="text-left [&_.prose]:text-left [&_.prose]:text-xs [&_p]:text-left"
                            />
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </section>

              {pickL ? (
                <div className="flex items-center justify-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-violet-700">
                  <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="text-sm font-medium">Alege corespondentul</span>
                </div>
              ) : null}

              <section
                ref={mobileRightSectionRef}
                aria-label="A doua listă"
                className={cn(
                  "rounded-2xl transition-[box-shadow,background-color]",
                  pickL && "bg-violet-50/60 p-3 ring-2 ring-violet-200 ring-offset-2 ring-offset-[#fafafa]",
                )}
              >
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#6f657b]">A doua listă</p>
                <div className="flex flex-col gap-2.5">
                  {shuffledRight.map((row) => {
                    const edge = edges.find((e) => e.rightId === row.id)
                    const matchedLeft = edge ? leftById.get(edge.leftId) : null
                    const okEdge = edge ? correctSet.has(`${edge.leftId}:${edge.rightId}`) : null
                    const canPick = Boolean(pickL) && !allMatchCorrect
                    const colorIndex = getMobilePairColorIndex(undefined, row.id)
                    const pairPalette = mobileMatchPairPalette(colorIndex)
                    return (
                      <button
                        type="button"
                        key={row.id}
                        onClick={() => onPickRight(row.id)}
                        disabled={allMatchCorrect || !pickL}
                        className={cn(
                          MATCH_ASSOC_CARD_CLASS,
                          mobileMatchPairClasses(colorIndex, {
                            submitted,
                            ok: edge ? (submitted ? okEdge : null) : null,
                            selected: false,
                          }),
                          canPick && colorIndex === null && "border-violet-300 bg-violet-50/80 shadow-[0_4px_0_#c4b5fd] active:scale-[0.99]",
                          canPick && colorIndex !== null && "active:scale-[0.99]",
                          !pickL && colorIndex === null && "opacity-50",
                        )}
                      >
                        <RichMini text={row.text} />
                        {matchedLeft ? (
                          <div className={cn("mt-2 border-t pt-2 text-left", pairPalette?.divider ?? "border-[#ece6f3]")}>
                            <p
                              className={cn(
                                "mb-1 text-[10px] font-semibold uppercase tracking-wide",
                                pairPalette?.label ?? "text-[#9a8fb0]",
                              )}
                            >
                              Asociat cu
                            </p>
                            <RichMini
                              text={matchedLeft.text}
                              className="text-left [&_.prose]:text-left [&_.prose]:text-xs [&_p]:text-left"
                            />
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>

          <div ref={wrapRef} className="relative mx-auto hidden w-full max-w-3xl md:block">
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {lines.map((ln, i) => (
              <line
                key={i}
                x1={ln.x1}
                y1={ln.y1}
                x2={ln.x2}
                y2={ln.y2}
                stroke={submitted ? (ln.ok ? "#22c55e" : "#ef4444") : "#7c3aed"}
                strokeWidth={2}
              />
            ))}
          </svg>
          <div className="relative grid grid-cols-2 items-start justify-items-center gap-x-12 gap-y-6">
            <div className="flex w-full max-w-[248px] flex-col gap-3 justify-self-end">
              {shuffledLeft.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  ref={(el) => {
                    leftRefs.current[row.id] = el
                  }}
                  onClick={() => onPickLeft(row.id)}
                  disabled={allMatchCorrect}
                  className={cn(leftButtonClass(row.id), !submitted && "hover:border-[#a898bc]")}
                >
                  <RichMini text={row.text} />
                </button>
              ))}
            </div>
            <div className="flex w-full max-w-[248px] flex-col gap-3 justify-self-start">
              {shuffledRight.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  ref={(el) => {
                    rightRefs.current[row.id] = el
                  }}
                  onClick={() => onPickRight(row.id)}
                  disabled={allMatchCorrect}
                  className={cn(
                    rightButtonClass(row.id),
                    !submitted && "hover:border-[#a898bc]",
                  )}
                >
                  <RichMini text={row.text} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      <InteractiveBottomChrome registrationDeps={[allMatchCorrect, canVerify, canReset, submitted, pickL]}>
        <button
          type="button"
          onClick={handleReset}
          disabled={!canReset}
          className={cn(
            "shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors sm:px-5 sm:py-3 sm:text-base",
            canReset ? "hover:bg-gray-50" : "cursor-not-allowed opacity-45",
          )}
        >
          Resetează
        </button>
        {allMatchCorrect ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleVerify}
            disabled={!canVerify}
            className={cn(
              "dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg",
              !canVerify && "pointer-events-none opacity-45",
            )}
            style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1]">Verifică asocierile</span>
          </button>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

function GraphBuildView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: GraphBuildContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const [choice, setChoice] = useState<string | null>(null)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const [submitted, setSubmitted] = useState(false)

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    await markComplete()
    await navigateToNextItem()
  }

  if (data.mode === "pick_curve") {
    const ok = submitted && choice === data.correctOptionId
    const locked = submitted && ok

    return (
      <>
        <div className="mx-auto w-full max-w-4xl px-2 text-[#2a2433]">
          <RichMini
            text={data.prompt}
            className="mb-6 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.options.map((opt) => {
              const showFeedback = submitted
              const isCorrectOpt = opt.id === data.correctOptionId
              const isChosenWrong = submitted && choice === opt.id && !isCorrectOpt
              const isSelected = choice === opt.id && !showFeedback
              return (
                <button
                  type="button"
                  key={opt.id}
                  disabled={locked}
                  onClick={() => {
                    setChoice(opt.id)
                    if (submitted) setSubmitted(false)
                  }}
                  className={cn(
                    INTERACTIVE_OPTION_CARD,
                    "flex flex-col",
                    isSelected && "border-violet-500 shadow-[0_4px_0_#5b21b6]",
                    showFeedback && isCorrectOpt && "border-emerald-500 shadow-[0_4px_0_#047857]",
                    showFeedback && isChosenWrong && "border-red-500 shadow-[0_4px_0_#b91c1c]",
                  )}
                >
                  {opt.label ? <p className="mb-2 text-xs font-medium text-[#6f657b]">{opt.label}</p> : null}
                  <svg viewBox="0 0 100 40" className="h-16 w-full shrink-0">
                    <path d={opt.svgPath} fill="none" stroke="#111" strokeWidth={2} />
                  </svg>
                </button>
              )
            })}
          </div>
          {submitted ? (
            <p
              className={cn(
                "mt-5 text-center text-sm font-medium sm:text-base",
                ok ? "text-emerald-600" : "text-red-600",
              )}
            >
              {ok ? "Corect!" : "Incorect. Alege altă curbă și verifică din nou."}
            </p>
          ) : null}
        </div>

        <InteractiveBottomChrome registrationDeps={[ok, submitted, choice]}>
          {ok && submitted ? (
            <Link
              href={nextItemHref}
              onClick={handleContinue}
              className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
              style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
            >
              <span className="relative z-[1] inline-flex items-center gap-2">
                Continuă
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              disabled={!choice || submitted}
              onClick={() => {
                setSubmitted(true)
                onDone()
              }}
              className={cn(
                "dashboard-start-glow inline-flex min-h-[3.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] sm:min-h-[3.5rem] sm:px-10 sm:py-4 sm:text-lg",
                (!choice || submitted) && "pointer-events-none opacity-45",
              )}
              style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
            >
              <span className="relative z-[1]">Verifică răspunsul</span>
            </button>
          )}
        </InteractiveBottomChrome>
      </>
    )
  }

  const grid = data.grid ?? { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }
  const w = 320
  const h = 220
  const sx = (x: number) => ((x - grid.xMin) / (grid.xMax - grid.xMin)) * w
  const sy = (y: number) => h - ((y - grid.yMin) / (grid.yMax - grid.yMin)) * h

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.hypot(dx, dy)
  }

  const checkPlot = () => {
    if (points.length !== data.correctPoints.length) return false
    const used = new Set<number>()
    for (const target of data.correctPoints) {
      let best = -1
      let bestD = Infinity
      points.forEach((p, i) => {
        if (used.has(i)) return
        const d = dist(p, target)
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      if (best < 0 || bestD > data.tolerance) return false
      used.add(best)
    }
    return true
  }

  const plotOk = submitted && checkPlot()
  const canResetPlot = points.length > 0 && !(submitted && plotOk)

  return (
    <>
      <div className="mx-auto w-full max-w-lg px-2 text-[#2a2433]">
        <RichMini
          text={data.prompt}
          className="mb-5 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
        />
        <p className="mb-3 text-center text-xs text-[#6f657b] sm:text-sm">
          Plasează exact {data.correctPoints.length} puncte în zona graficului (click). Toleranță: {data.tolerance}{" "}
          (unități pe axă).
        </p>
        <div
          className="relative mx-auto cursor-crosshair overflow-hidden rounded-xl border-[3px] border-[#cfc3dc] bg-white shadow-[0_4px_0_#9d8ab3]"
          style={{ width: w, height: h, maxWidth: "100%" }}
          onClick={(e) => {
            if (submitted) return
            const rect = e.currentTarget.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top
            const x = grid.xMin + (px / w) * (grid.xMax - grid.xMin)
            const y = grid.yMin + ((h - py) / h) * (grid.yMax - grid.yMin)
            setPoints((prev) =>
              prev.length >= data.correctPoints.length ? [{ x, y }] : [...prev, { x, y }],
            )
          }}
        >
          <svg width={w} height={h} className="absolute left-0 top-0">
            {Array.from({ length: 11 }).map((_, i) => {
              const gx = (i / 10) * w
              const gy = (i / 10) * h
              return (
                <g key={i}>
                  <line x1={gx} y1={0} x2={gx} y2={h} stroke="#eee" strokeWidth={1} />
                  <line x1={0} y1={gy} x2={w} y2={gy} stroke="#eee" strokeWidth={1} />
                </g>
              )
            })}
            {points.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} fill="#7c3aed" />
            ))}
          </svg>
        </div>
        {submitted ? (
          <p
            className={cn(
              "mt-4 text-center text-sm font-medium sm:text-base",
              plotOk ? "text-emerald-600" : "text-red-600",
            )}
          >
            {plotOk
              ? "Foarte bine — punctele sunt în toleranță!"
              : "Pozițiile nu coincid suficient de bine cu soluția."}
          </p>
        ) : null}
      </div>

      <InteractiveBottomChrome registrationDeps={[plotOk, submitted, points.length, canResetPlot]}>
        {plotOk ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setPoints([])
                setSubmitted(false)
              }}
              disabled={!canResetPlot}
              className={cn(
                "shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors sm:px-5 sm:py-3 sm:text-base",
                canResetPlot ? "hover:bg-gray-50" : "cursor-not-allowed opacity-45",
              )}
            >
              Resetează puncte
            </button>
            <button
              type="button"
              disabled={submitted || points.length !== data.correctPoints.length}
              onClick={() => {
                setSubmitted(true)
                onDone()
              }}
              className={cn(
                "dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg",
                (submitted || points.length !== data.correctPoints.length) && "pointer-events-none opacity-45",
              )}
              style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
            >
              <span className="relative z-[1]">Verifică</span>
            </button>
          </>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

function normAns(s: string) {
  return s.trim().toLowerCase()
}

function CodeTraceView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: CodeTraceContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const [step, setStep] = useState(0)
  const [textVal, setTextVal] = useState("")
  const [choice, setChoice] = useState<string | null>(null)
  const [wrong, setWrong] = useState(false)
  const cur = data.steps[step]
  const done = step >= data.steps.length
  const usesChoiceInput = cur?.inputMode === "choice" && !!cur.options?.length

  const tryAdvance = () => {
    if (!cur) return
    let ok = false
    if (usesChoiceInput) {
      ok = choice !== null && normAns(choice) === normAns(cur.answer)
    } else {
      ok = normAns(textVal) === normAns(cur.answer)
    }
    if (!ok) {
      setWrong(true)
      return
    }
    setWrong(false)
    if (step + 1 >= data.steps.length) {
      onDone()
    }
    setStep((s) => s + 1)
    setTextVal("")
    setChoice(null)
  }

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!done) return
    await markComplete()
    await navigateToNextItem()
  }

  const canVerifyStep =
    !!cur && (usesChoiceInput ? choice !== null : textVal.trim().length > 0)

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-2 text-[#2a2433]">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#6f657b]">
          {data.language || "code"}
        </p>
        {data.imageUrl ? (
          <div className="mb-4 flex justify-center">
            <img
              src={data.imageUrl}
              alt=""
              className="max-h-64 w-full max-w-full rounded-xl border-[3px] border-[#cfc3dc] object-contain shadow-[0_4px_0_#9d8ab3]"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
        <div className="mb-5 overflow-hidden rounded-xl border-[3px] border-[#cfc3dc] shadow-[0_4px_0_#9d8ab3]">
          <pre
            className={cn(
              "overflow-x-auto bg-[#1e1e1e] p-4 text-left text-xs leading-relaxed text-[#e4e4e4] font-mono",
            )}
          >
            {data.lines.map((line, i) => (
              <div key={i} className={cn(i === cur?.lineIndex && !done && "rounded bg-violet-500/30")}>
                <span className="mr-3 inline-block w-6 select-none text-[#888]">{i + 1}</span>
                {line}
              </div>
            ))}
          </pre>
        </div>
        {!done && cur ? (
          <div className="space-y-4 rounded-xl border-[3px] border-[#cfc3dc] bg-white px-4 py-4 shadow-[0_4px_0_#9d8ab3] sm:px-5 sm:py-5">
            <RichMini text={cur.prompt} className="[&_.prose]:text-[#2a2433]" />
            {usesChoiceInput && cur.options ? (
              <div className="flex flex-wrap gap-2">
                {cur.options.map((o) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => {
                      setChoice(o)
                      setWrong(false)
                    }}
                    className={cn(
                      "rounded-full border-[2.5px] px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:py-2.5",
                      choice === o
                        ? "border-violet-500 bg-violet-50 text-[#111]"
                        : "border-[#cfc3dc] bg-white text-[#111] shadow-[0_3px_0_#9d8ab3]",
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="w-full rounded-xl border-[2.5px] border-[#cfc3dc] bg-white px-3 py-2.5 text-sm shadow-[0_3px_0_#9d8ab3] outline-none focus:border-violet-400"
                value={textVal}
                onChange={(e) => {
                  setTextVal(e.target.value)
                  setWrong(false)
                }}
                placeholder="Răspuns"
              />
            )}
            {wrong ? (
              <p className="text-center text-sm font-medium text-red-600">Încearcă din nou.</p>
            ) : null}
          </div>
        ) : (
          <p className="text-center text-base font-semibold text-emerald-600 sm:text-lg">
            Bravo — ai parcurs toți pașii!
          </p>
        )}
      </div>

      <InteractiveBottomChrome
        registrationDeps={[done, canVerifyStep, wrong, step, choice, textVal, usesChoiceInput]}
      >
        {done ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={tryAdvance}
            disabled={!canVerifyStep}
            className={cn(
              "dashboard-start-glow inline-flex min-h-[3.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] sm:min-h-[3.5rem] sm:px-10 sm:py-4 sm:text-lg",
              !canVerifyStep && "pointer-events-none opacity-45",
            )}
            style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1]">Verifică și avansează</span>
          </button>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

function SwipeClassifyScreenFlash({
  feedback,
}: {
  feedback: "correct" | "incorrect" | null
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-[310] transition-opacity duration-150",
        feedback === "correct" && "bg-emerald-400/25 opacity-100",
        feedback === "incorrect" && "bg-red-400/25 opacity-100",
        !feedback && "opacity-0",
      )}
    />,
    document.body,
  )
}

function SwipeClassifyView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: SwipeClassifyContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const confettiFiredRef = useRef(false)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-120, 120], [-8, 8])
  const card = data.cards[idx]
  const finished = idx >= data.cards.length
  const passed = finished && score === data.cards.length

  const resolve = (side: "left" | "right") => {
    if (!card || feedback) return
    const ok = card.side === side
    if (ok) {
      setScore((s) => s + 1)
      playSuccessSound()
    } else {
      playErrorSound()
    }
    setFeedback(ok ? "correct" : "incorrect")
    window.setTimeout(() => {
      setFeedback(null)
      setIdx((i) => i + 1)
      x.set(0)
    }, 220)
  }

  useEffect(() => {
    if (finished) onDone()
  }, [finished, onDone])

  useEffect(() => {
    if (!passed) {
      confettiFiredRef.current = false
      return
    }
    if (confettiFiredRef.current) return
    confettiFiredRef.current = true
    fireLearningPathCorrectConfetti()
  }, [passed])

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!passed) return
    await markComplete()
    await navigateToNextItem()
  }

  const handleRetry = () => {
    setIdx(0)
    setScore(0)
    setFeedback(null)
    x.set(0)
  }

  const outlineBtn =
    "shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 sm:px-5 sm:py-3 sm:text-base"

  return (
    <div className={cn("relative", finished && "pb-28 sm:pb-24")}>
      <SwipeClassifyScreenFlash feedback={feedback} />
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center px-2 pb-2 text-[#2a2433]",
          finished
            ? "min-h-[calc(100dvh-3.5rem-9rem)] sm:min-h-[calc(100dvh-3.5rem-8rem)]"
            : "min-h-[calc(100dvh-3.5rem-4rem)] sm:min-h-[calc(100dvh-3.5rem-3.5rem)]",
        )}
      >
        <div className="flex w-full max-w-md flex-col items-center">
          {data.prompt ? (
            <RichMini
              text={data.prompt}
              className="mb-5 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none sm:mb-6"
            />
          ) : null}
          {!finished ? (
            <>
              <p className="mb-4 max-w-sm text-center text-sm font-medium leading-snug text-[#6f657b] md:hidden sm:max-w-md sm:text-base">
                Glisează cardul spre stânga sau dreapta pentru a-l clasifica.
              </p>
              <p className="mb-4 hidden max-w-sm text-center text-sm font-medium leading-snug text-[#6f657b] md:block sm:max-w-md sm:text-base">
                Apasă pe unul dintre butoanele de jos pentru a clasifica cardul.
              </p>
            </>
          ) : null}
          <div className="mb-3 flex w-full justify-between text-xs font-semibold uppercase tracking-wide text-[#6f657b] sm:text-sm">
            <span>{data.leftLabel}</span>
            <span>{data.rightLabel}</span>
          </div>
          {!finished && card ? (
            <>
              <motion.div
                style={{ x, rotate }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 70) resolve("right")
                  else if (info.offset.x < -70) resolve("left")
                  else x.set(0)
                }}
                className="relative w-full touch-pan-y"
              >
                <div
                  className={cn(
                    "min-h-[140px] rounded-xl border-[3px] bg-white p-6 text-center shadow-[0_4px_0_#9d8ab3] transition-[border-color,box-shadow] border-[#cfc3dc]",
                    feedback === "correct" && "border-emerald-500 shadow-[0_4px_0_#047857]",
                    feedback === "incorrect" && "border-red-500 shadow-[0_4px_0_#b91c1c]",
                  )}
                >
                  <RichMini text={card.text} className="[&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none" />
                </div>
              </motion.div>
              <div className="mt-6 hidden w-full flex-wrap items-center justify-center gap-3 md:flex sm:gap-4">
                <button type="button" className={outlineBtn} onClick={() => resolve("left")}>
                  ← {data.leftLabel}
                </button>
                <button type="button" className={outlineBtn} onClick={() => resolve("right")}>
                  {data.rightLabel} →
                </button>
              </div>
            </>
          ) : (
            <div className="w-full rounded-xl border-[3px] border-[#cfc3dc] bg-white px-4 py-8 text-center shadow-[0_4px_0_#9d8ab3] sm:py-10">
              <p className="text-lg font-bold text-[#111] sm:text-xl">
                Scor: {score} / {data.cards.length}
              </p>
            </div>
          )}
        </div>
      </div>

      {finished ? (
        <InteractiveBottomChrome registrationDeps={[passed, score]}>
          {passed ? (
            <Link
              href={nextItemHref}
              onClick={handleContinue}
              className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
              style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
            >
              <span className="relative z-[1] inline-flex items-center gap-2">
                Continuă
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleRetry}
              className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-8 py-3 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#9a3412] sm:min-h-[3.25rem] sm:px-10 sm:py-3.5 sm:text-lg"
              style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
            >
              <span className="relative z-[1]">Încearcă din nou</span>
            </button>
          )}
        </InteractiveBottomChrome>
      ) : null}
    </div>
  )
}

function FlowBuildView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: FlowBuildContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const [sel, setSel] = useState<string | null>(null)
  const [edges, setEdges] = useState<{ from: string; to: string }[]>([])
  const [submitted, setSubmitted] = useState(false)

  const edgeKey = (e: { from: string; to: string }) => `${e.from}->${e.to}`
  const target = useMemo(() => new Set(data.correctEdges.map(edgeKey)), [data.correctEdges])
  const user = useMemo(() => new Set(edges.map(edgeKey)), [edges])
  const flowOk = submitted && target.size === user.size && [...target].every((k) => user.has(k))

  const onNode = (id: string) => {
    if (submitted) return
    if (!sel) {
      setSel(id)
      return
    }
    if (sel === id) {
      setSel(null)
      return
    }
    const next = edges.filter((e) => e.from !== sel)
    next.push({ from: sel, to: id })
    setEdges(next)
    setSel(null)
  }

  return (
    <div className={shellClass()}>
      {data.instructions ? <RichMini text={data.instructions} className="mb-4" /> : null}
      <p className="mb-3 text-xs text-[#666]">
        {sel ? `Alege destinația pentru muchia care pleacă din nodul selectat.` : "Apasă sursa, apoi destinația."}
      </p>
      <div className="flex flex-wrap gap-2">
        {data.nodes.map((n) => (
          <button
            type="button"
            key={n.id}
            onClick={() => onNode(n.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              sel === n.id ? "border-violet-600 bg-violet-50" : "border-[#ddd] bg-white",
              n.kind === "start" && "border-emerald-300",
              n.kind === "end" && "border-rose-300"
            )}
          >
            <span className="text-[10px] uppercase text-[#888]">{n.kind}</span>
            <div className="font-medium text-[#111]">{n.label}</div>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#777]">Muchii: {edges.map((e) => `${e.from}→${e.to}`).join(", ") || "—"}</p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={submitted}
          onClick={() => {
            setEdges([])
            setSel(null)
          }}
        >
          Resetează
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-[#111111] text-white"
          disabled={submitted}
          onClick={() => {
            setSubmitted(true)
            onDone()
          }}
        >
          Verifică flowchart
        </Button>
      </div>
      {submitted ? (
        <p className={cn("mt-2 text-sm font-semibold", flowOk ? "text-emerald-600" : "text-red-600")}>
          {flowOk ? "Structura este corectă!" : "Muchiile nu coincid cu soluția."}
        </p>
      ) : null}
      <ContinueRow ready={submitted} nextItemHref={nextItemHref} onContinue={markComplete} />
    </div>
  )
}

function SliderExploreView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: SliderExploreContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.sliders.map((s) => [s.id, s.default]))
  )
  const [hit, setHit] = useState(false)
  const reported = useRef(false)

  const result = useMemo(() => {
    try {
      const r = Parser.parse(data.formula).evaluate(vals as Record<string, number>)
      return typeof r === "number" && Number.isFinite(r) ? r : NaN
    } catch {
      return NaN
    }
  }, [data.formula, vals])

  useEffect(() => {
    if (!Number.isFinite(result)) {
      setHit(false)
      return
    }
    const inBand = result >= data.targetMin && result <= data.targetMax
    setHit(inBand)
    if (inBand && !reported.current) {
      reported.current = true
      onDone()
    }
  }, [data.targetMax, data.targetMin, onDone, result])

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!hit) return
    await markComplete()
    await navigateToNextItem()
  }

  return (
    <>
      <div className="mx-auto w-full max-w-lg px-2 text-[#2a2433]">
        {data.instructions ? (
          <RichMini
            text={data.instructions}
            className="mb-6 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
          />
        ) : null}
        <div className="mb-6 space-y-5 rounded-xl border-[3px] border-[#cfc3dc] bg-white px-4 py-5 shadow-[0_4px_0_#9d8ab3] sm:px-5 sm:py-6">
          {data.sliders.map((s) => (
            <div key={s.id} className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#555] sm:text-sm">
                <span>{s.label}</span>
                <span className="tabular-nums">{(vals[s.id] ?? s.default).toFixed(3)}</span>
              </div>
              <Slider
                value={[vals[s.id] ?? s.default]}
                min={s.min}
                max={s.max}
                step={s.step}
                onValueChange={([v]) => setVals((prev) => ({ ...prev, [s.id]: v }))}
              />
            </div>
          ))}
        </div>
        <div className="rounded-xl border-[3px] border-[#cfc3dc] bg-white p-5 text-center shadow-[0_4px_0_#9d8ab3] sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6f657b]">Rezultat (formula)</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#111] sm:text-3xl">
            {Number.isFinite(result) ? result.toFixed(3) : "—"}
          </p>
          <p className="mt-2 text-xs text-[#8b7fa3] sm:text-sm">
            Interval țintă: [{data.targetMin}, {data.targetMax}]
          </p>
        </div>
        {hit ? (
          <p className="mt-5 text-center text-sm font-semibold text-emerald-600 sm:text-base">
            Ai găsit intervalul țintă!
          </p>
        ) : null}
      </div>

      <InteractiveBottomChrome registrationDeps={[hit]}>
        {hit ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <p className="w-full px-2 text-center text-sm text-[#6f657b] sm:text-base">
            Ajustează glisoarele până când rezultatul intră în intervalul țintă.
          </p>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

function TableFillView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: TableFillContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const cellKey = (r: number, c: number) => `${r}-${c}`

  return (
    <div className={shellClass()}>
      {data.instructions ? <RichMini text={data.instructions} className="mb-4" /> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr>
              {data.headers.map((h, i) => (
                <th key={i} className="border border-[#ddd] bg-[#f4f4f4] px-2 py-2 text-left font-semibold">
                  <RichMini text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri}>
                {row.cells.map((cell, ci) => {
                  if (cell === null) return <td key={ci} className="border border-[#eee] bg-[#fafafa]" />
                  if (cell.blank) {
                    const k = cellKey(ri, ci)
                    const user = inputs[k] ?? ""
                    const cellOk = submitted && normAns(user) === normAns(cell.answer || "")
                    const bad = submitted && !cellOk
                    return (
                      <td key={ci} className={cn("border border-[#ddd] p-1", cellOk && "bg-emerald-50", bad && "bg-red-50")}>
                        <input
                          className="w-full rounded-md border border-transparent bg-white px-2 py-1 text-sm outline-none focus:border-violet-400"
                          value={user}
                          disabled={submitted}
                          onChange={(e) => setInputs((p) => ({ ...p, [k]: e.target.value }))}
                        />
                      </td>
                    )
                  }
                  return (
                    <td key={ci} className="border border-[#ddd] px-2 py-2">
                      <RichMini text={cell.text || ""} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        className="mt-4 rounded-full bg-[#111111] text-white"
        disabled={submitted}
        onClick={() => {
          setSubmitted(true)
          onDone()
        }}
      >
        Verifică tabelul
      </Button>
      <ContinueRow ready={submitted} nextItemHref={nextItemHref} onContinue={markComplete} />
    </div>
  )
}

function MemoryFlipView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: MemoryFlipContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  type Card = { key: string; face: string; pair: string }
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const deck = useMemo(() => {
    const out: Card[] = []
    data.pairs.forEach((p, i) => {
      const pair = `p${i}`
      out.push({ key: `${pair}a`, face: p.a, pair })
      out.push({ key: `${pair}b`, face: p.b, pair })
    })
    shuffleInPlace(out)
    return out
  }, [data.pairs])
  const [open, setOpen] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (open.length < 2) return
    const [a, b] = open
    const ca = deck.find((c) => c.key === a)
    const cb = deck.find((c) => c.key === b)
    const t = window.setTimeout(() => {
      if (ca && cb && ca.pair === cb.pair) {
        setMatched((m) => new Set([...m, ca.pair]))
      }
      setOpen([])
    }, 650)
    return () => window.clearTimeout(t)
  }, [open, deck])

  const totalPairs = data.pairs.length
  const done = matched.size >= totalPairs
  useEffect(() => {
    if (done) onDone()
  }, [done, onDone])

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!done) return
    await markComplete()
    await navigateToNextItem()
  }

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-2 text-[#2a2433]">
        {data.instructions ? (
          <RichMini
            text={data.instructions}
            className="mb-6 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
          />
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-3.5">
          {deck.map((c) => {
            const isOpen = open.includes(c.key) || matched.has(c.pair)
            const isMatched = matched.has(c.pair)
            return (
              <button
                type="button"
                key={c.key}
                disabled={matched.has(c.pair) || (open.length >= 2 && !open.includes(c.key))}
                onClick={() => {
                  if (open.includes(c.key) || matched.has(c.pair)) return
                  if (open.length >= 2) return
                  setOpen((o) => [...o, c.key])
                }}
                className={cn(
                  "flex min-h-[88px] items-center justify-center rounded-xl border-[3px] p-2 text-center text-sm transition-[border-color,box-shadow]",
                  !isOpen &&
                    "border-[#cfc3dc] bg-white shadow-[0_4px_0_#9d8ab3] hover:border-[#a898bc] active:translate-y-0.5 active:shadow-[0_2px_0_#9d8ab3]",
                  isOpen &&
                    !isMatched &&
                    "border-violet-500 bg-white shadow-[0_4px_0_#5b21b6]",
                  isMatched && "border-emerald-500 bg-white shadow-[0_4px_0_#047857]",
                )}
              >
                {isOpen ? (
                  <RichMini
                    text={c.face}
                    className="[&_.prose]:text-center [&_p]:mx-auto [&_p]:my-0 [&_p]:max-w-none"
                  />
                ) : (
                  <span className="text-xl font-bold text-[#b8a8cf]">?</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <InteractiveBottomChrome registrationDeps={[done, matched.size, open.length]}>
        {done ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <p className="w-full px-2 text-center text-sm text-[#6f657b] sm:text-base">
            Găsește toate perechile — apasă pe două cărți la fel pentru a le potrivi.
          </p>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

function SpeedRoundView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: SpeedRoundContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const [qi, setQi] = useState(0)
  const [left, setLeft] = useState(data.secondsTotal)
  const [score, setScore] = useState(0)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const finished = qi >= data.questions.length || left <= 0

  useEffect(() => {
    if (finished) return
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(t)
  }, [finished])

  useEffect(() => {
    if (finished) onDone()
  }, [finished, onDone])

  const q = data.questions[qi]

  const answer = (i: number) => {
    if (!q || finished) return
    const ok = i === q.correctIndex
    setLastOk(ok)
    if (ok) setScore((s) => s + 1)
    window.setTimeout(() => {
      setLastOk(null)
      setQi((x) => x + 1)
    }, 450)
  }

  return (
    <div className={shellClass()}>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-[#111]">Timp rămas: {left}s</span>
        <span className="text-[#666]">
          Întrebare {Math.min(qi + 1, data.questions.length)} / {data.questions.length}
        </span>
      </div>
      {!finished && q ? (
        <div>
          <RichMini text={q.prompt} className="mb-4" />
          <div className="space-y-2">
            {q.options.map((o, i) => (
              <button
                type="button"
                key={i}
                onClick={() => answer(i)}
                className="block w-full rounded-xl border border-[#e0e0e0] bg-white px-4 py-3 text-left text-sm hover:border-violet-400"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl font-bold text-[#111]">Scor: {score}</p>
        </div>
      )}
      {lastOk === true ? <p className="mt-2 text-sm font-semibold text-emerald-600">Corect!</p> : null}
      {lastOk === false ? <p className="mt-2 text-sm font-semibold text-red-600">Greșit</p> : null}
      <ContinueRow ready={finished} nextItemHref={nextItemHref} onContinue={markComplete} />
    </div>
  )
}

function RevealStepsView({
  data,
  onDone,
  nextItemHref,
  markComplete,
}: {
  data: RevealStepsContent
  onDone: () => void
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const explainChat = useLearningPathExplainChat()
  const { pushHint } = useStuckTrigger({ surface: "invata" })
  const [visible, setVisible] = useState(0)
  const [quizChoice, setQuizChoice] = useState<number | null>(null)
  const [quizErr, setQuizErr] = useState(false)
  const [quizChecked, setQuizChecked] = useState(false)
  const steps = data.steps
  const atEnd = visible >= steps.length
  const block: RevealStepBlock | undefined = atEnd ? undefined : steps[visible]
  const total = steps.length

  useEffect(() => {
    setQuizChoice(null)
    setQuizErr(false)
    setQuizChecked(false)
  }, [visible])

  const advance = () => {
    if (atEnd || !block) return

    if (block.kind === "markdown") {
      setVisible((v) => v + 1)
      return
    }

    if (quizChoice === null) return

    setQuizChecked(true)
    if (quizChoice !== block.correctIndex) {
      setQuizErr(true)
      playErrorSound()
      return
    }

    setQuizErr(false)
    playSuccessSound()
    setQuizChoice(null)
    setQuizChecked(false)
    setVisible((v) => v + 1)
  }

  useEffect(() => {
    if (atEnd) onDone()
  }, [atEnd, onDone])

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!atEnd) return
    await markComplete()
    await navigateToNextItem()
  }

  const canTapAdvance =
    !!block && (block.kind === "markdown" || (block.kind === "quiz" && quizChoice !== null))

  const handleWhy = () => {
    if (block?.kind !== "quiz") return
    pushHint("manual")
    const wasLastVerifyCorrect =
      quizChecked && quizChoice === block.correctIndex
        ? !quizErr
        : quizChecked && quizErr
          ? false
          : null
    explainChat?.openExplainChat({
      problemStatement: formatRevealStepsQuizLearningPathContext({
        instructions: data.instructions,
        stepIndex: visible + 1,
        totalSteps: total,
        priorSteps: steps.slice(0, visible),
        quizContent: block.content,
        options: block.options,
        correctIndex: block.correctIndex,
        selectedIndex: quizChoice,
        wasLastVerifyCorrect,
      }),
      problemContextPreamble: "",
      initialUserMessage: LEARNING_PATH_REVEAL_STEPS_QUIZ_EXPLAIN_INITIAL_PROMPT,
    })
  }

  useRegisterLearningPathAiContext(
    () => {
      if (block?.kind !== "quiz") return null
      const wasLastVerifyCorrect =
        quizChecked && quizChoice === block.correctIndex
          ? !quizErr
          : quizChecked && quizErr
            ? false
            : null
      return formatRevealStepsQuizLearningPathContext({
        instructions: data.instructions,
        stepIndex: visible + 1,
        totalSteps: total,
        priorSteps: steps.slice(0, visible),
        quizContent: block.content,
        options: block.options,
        correctIndex: block.correctIndex,
        selectedIndex: quizChoice,
        wasLastVerifyCorrect,
      })
    },
    [block, data.instructions, quizChecked, quizChoice, quizErr, steps, total, visible],
  )

  const stepCardPast =
    "rounded-xl border-[3px] border-[#cfc3dc] bg-white px-4 py-4 shadow-[0_4px_0_#9d8ab3] sm:px-5 sm:py-5"
  const stepCardActive =
    "rounded-xl border-[3px] border-violet-500 bg-white px-4 py-4 shadow-[0_4px_0_#5b21b6] sm:px-5 sm:py-5"

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-2 text-[#2a2433]">
        {data.instructions ? (
          <RichMini
            text={data.instructions}
            className="mb-5 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
          />
        ) : null}

        <p
          className={cn(
            "mb-4 text-center text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm",
            atEnd ? "text-emerald-700" : "text-[#6f657b]",
          )}
        >
          {atEnd ? "Demonstrație completă" : `Pasul ${visible + 1} din ${total}`}
        </p>

        <div className="space-y-3 sm:space-y-4">
          {steps.slice(0, visible).map((s, i) => (
            <div key={i} className={stepCardPast}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9a8fb0] sm:text-[11px]">
                Pas {i + 1}
              </p>
              {s.kind === "markdown" ? (
                <RichMini text={s.content} className="text-[#2a2433] [&_.prose]:text-[#2a2433]" />
              ) : null}
              {s.kind === "quiz" ? (
                <div>
                  {s.content ? (
                    <RichMini text={s.content} className="mb-2 text-[#2a2433] [&_.prose]:text-[#2a2433]" />
                  ) : null}
                  <p className="text-xs font-medium text-emerald-700 sm:text-sm">Răspuns corect înregistrat.</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {!atEnd && block ? (
          <div className={cn("mt-4", stepCardActive)}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-violet-600 sm:text-[11px]">
              Pas curent
            </p>
            {block.kind === "markdown" ? (
              <RichMini text={block.content} className="text-[#2a2433] [&_.prose]:text-[#2a2433]" />
            ) : null}
            {block.kind === "quiz" ? (
              <div className="space-y-3">
                {block.content ? (
                  <RichMini text={block.content} className="text-[#2a2433] [&_.prose]:text-[#2a2433]" />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {block.options.map((o, i) => {
                    const isSelected = quizChoice === i
                    const isCorrectOption = i === block.correctIndex
                    const showFeedback = quizChecked && quizErr
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          setQuizChoice(i)
                          setQuizErr(false)
                          setQuizChecked(false)
                        }}
                        className={cn(
                          "rounded-full border-[2.5px] px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:py-2.5",
                          showFeedback && isCorrectOption
                            ? "border-emerald-500 bg-emerald-50 text-[#111]"
                            : showFeedback && isSelected
                              ? "border-red-500 bg-red-50 text-[#111]"
                              : isSelected
                                ? "border-violet-500 bg-violet-50 text-[#111]"
                                : "border-[#cfc3dc] bg-white text-[#111] shadow-[0_3px_0_#9d8ab3]",
                        )}
                      >
                        <LatexRichText content={o} className="break-words [&_.katex]:text-inherit" />
                      </button>
                    )
                  })}
                </div>
                {quizErr ? (
                  <p className="text-center text-sm font-medium text-red-600 sm:text-base">
                    Răspuns incorect. Alege varianta corectă pentru a continua.
                  </p>
                ) : null}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleWhy}
                    className="rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 sm:px-4 sm:py-2.5"
                  >
                    De ce?
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {atEnd ? (
          <p className="mt-6 text-center text-base font-semibold text-emerald-600 sm:text-lg">
            Ai parcurs toți pașii.
          </p>
        ) : null}
      </div>

      <InteractiveBottomChrome
        registrationDeps={[atEnd, canTapAdvance, block?.kind, quizChoice, quizErr, quizChecked, visible]}
      >
        {atEnd ? (
          <Link
            href={nextItemHref}
            onClick={handleContinue}
            className="dashboard-start-glow inline-flex min-h-[3rem] shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-base font-semibold text-white shadow-[0_4px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#5b21b6] sm:min-h-[3.25rem] sm:px-9 sm:py-3.5 sm:text-lg"
            style={{ "--start-glow-tint": LESSON_CONTINUE_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1] inline-flex items-center gap-2">
              Continuă
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={advance}
            disabled={!canTapAdvance}
            className={cn(
              "dashboard-start-glow inline-flex min-h-[3.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#fb923c] to-[#ea580c] px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_#9a3412] transition-[transform,box-shadow] sm:min-h-[3.5rem] sm:px-10 sm:py-4 sm:text-lg",
              !canTapAdvance && "pointer-events-none opacity-45",
            )}
            style={{ "--start-glow-tint": CARD_SORT_VERIFY_GLOW_TINT } as CSSProperties}
          >
            <span className="relative z-[1]">
              {block?.kind === "quiz" ? "Verifică și continuă" : "Pasul următor"}
            </span>
          </button>
        )}
      </InteractiveBottomChrome>
    </>
  )
}

export function LearningPathInteractiveLessonItem({
  parsed,
  itemId,
  lessonId,
  nextItemHref,
  isLastItem,
  chapterSlug,
  lessonSlug,
  chapterId,
  itemTitle,
  itemType,
}: {
  parsed: ParsedInteractiveContent
  itemId: string
  lessonId: string
  nextItemHref: string
  isLastItem: boolean
  chapterSlug: string
  lessonSlug: string
  chapterId?: string | null
  itemTitle?: string | null
  itemType: string
}) {
  const markComplete = useLearningPathItemCompletion({ itemId, lessonId, isLastItem })
  const onDone = useCallback(() => {}, [])

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl",
        parsed.itemType === "card_sort" ||
          parsed.itemType === "fill_slot" ||
          parsed.itemType === "match" ||
          parsed.itemType === "graph_build" ||
          parsed.itemType === "code_trace" ||
          parsed.itemType === "slider_explore" ||
          parsed.itemType === "memory_flip" ||
          parsed.itemType === "reveal_steps"
          ? "pb-28 sm:pb-24"
          : "pb-24",
      )}
    >
      {parsed.itemType === "card_sort" ? (
        <CardSortView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "fill_slot" ? (
        <FillSlotView
          data={parsed.data}
          nextItemHref={nextItemHref}
          markComplete={markComplete}
          itemId={itemId}
          lessonId={lessonId}
          isLastItem={isLastItem}
          chapterSlug={chapterSlug}
          lessonSlug={lessonSlug}
          chapterId={chapterId}
          itemTitle={itemTitle}
          itemType={itemType}
        />
      ) : null}
      {parsed.itemType === "match" ? (
        <MatchView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "graph_build" ? (
        <GraphBuildView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "code_trace" ? (
        <CodeTraceView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "swipe_classify" ? (
        <SwipeClassifyView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "flow_build" ? (
        <FlowBuildView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "slider_explore" ? (
        <SliderExploreView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "table_fill" ? (
        <TableFillView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "memory_flip" ? (
        <MemoryFlipView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "speed_round" ? (
        <SpeedRoundView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
      {parsed.itemType === "reveal_steps" ? (
        <RevealStepsView data={parsed.data} onDone={onDone} nextItemHref={nextItemHref} markComplete={markComplete} />
      ) : null}
    </div>
  )
}

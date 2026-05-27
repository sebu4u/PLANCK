"use client"

import Link from "next/link"
import { useNavigateToNextLearningPathItem } from "@/components/invata/learning-path-item-navigation-context"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type DependencyList } from "react"
import { evaluate } from "mathjs"
import { Reorder } from "framer-motion"
import { motion, useMotionValue, useTransform } from "framer-motion"
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
import { ChevronRight } from "lucide-react"
import { useLearningPathExplainChat } from "@/components/invata/learning-path-explain-chat-context"
import { useStuckTrigger } from "@/hooks/engagement/use-stuck-trigger"
import {
  formatCardSortLearningPathContext,
  formatFillSlotLearningPathContext,
  LEARNING_PATH_CARD_SORT_EXPLAIN_INITIAL_PROMPT,
  LEARNING_PATH_FILL_SLOT_EXPLAIN_INITIAL_PROMPT,
} from "@/lib/learning-path-insight-context"
import { playDashboardStartButtonClickSound } from "@/lib/ui-click-sound"
import { useRegisterLearningPathFixedBottomBar } from "@/components/invata/learning-path-item-chrome-context"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { InlineMath } from "react-katex"
import katex from "katex"
import { hasMixedLatexDelimiters } from "@/lib/parse-mixed-latex"

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

function normalizeLatexSegment(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2 && !trimmed.slice(1, -1).includes("$")) {
    return trimmed.slice(1, -1).trim()
  }
  if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

function FillSlotLatex({ content, className }: { content: string; className?: string }) {
  const trimmed = content.trim()
  if (!trimmed) return null

  if (hasMixedLatexDelimiters(trimmed)) {
    return (
      <LatexRichText
        content={trimmed}
        className={cn("text-inherit [&_.katex]:text-inherit", className)}
      />
    )
  }

  return (
    <span className={cn("inline-block text-inherit [&_.katex]:text-inherit", className)}>
      <InlineMath math={normalizeLatexSegment(trimmed)} />
    </span>
  )
}

function chipToLatex(chip: string): string {
  const value = normalizeLatexSegment(chip)
  if (!value) return "\\text{?}"
  if (/\\[a-zA-Z]+|[\^_{}=]/.test(value)) return value
  return `\\text{${value.replace(/([#%&_{}])/g, "\\$1")}}`
}

function buildFillSlotPlaceholder(
  slotId: string,
  value: string | null,
  isActive: boolean,
  autoResult: "ok" | "bad" | null,
  slotCorrect: boolean,
): string {
  const inner = value ? chipToLatex(value) : "\\text{?}"
  let body = `\\boxed{${inner}}`

  if (autoResult === "ok") {
    body = `\\color{#059669}{${body}}`
  } else if (autoResult === "bad" && value) {
    body = slotCorrect ? `\\color{#059669}{${body}}` : `\\color{#dc2626}{${body}}`
  } else if (isActive) {
    body = `\\color{#7c3aed}{${body}}`
  }

  return `\\htmlId{fill-slot-${slotId}}{${body}}`
}

function buildFillSlotLatex(
  template: string,
  assign: Record<string, string | null>,
  active: string | null,
  autoResult: "ok" | "bad" | null,
  slots: FillSlotContent["slots"],
): string {
  const base = normalizeLatexSegment(template)
  const answerById = new Map(slots.map((s) => [s.id, s.answer.trim()]))

  return base.replace(/\{\{(\w+)\}\}/g, (_, slotId: string) => {
    const value = assign[slotId] ?? null
    const slotCorrect = value ? value.trim() === (answerById.get(slotId) ?? "") : false
    return buildFillSlotPlaceholder(slotId, value, active === slotId, autoResult, slotCorrect)
  })
}

const FILL_SLOT_CHIP_DRAG_MIME = "application/x-planck-fill-chip"

function FillSlotFormula({
  latex,
  slotIds,
  autoResult,
  dragOverSlot,
  onSelectSlot,
  onDropChip,
  setDragOverSlot,
}: {
  latex: string
  slotIds: string[]
  autoResult: "ok" | "bad" | null
  dragOverSlot: string | null
  onSelectSlot: (slotId: string) => void
  onDropChip: (chip: string, slotId: string) => void
  setDragOverSlot: (slotId: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        trust: true,
        strict: "ignore",
        throwOnError: false,
        displayMode: true,
      })
    } catch {
      return ""
    }
  }, [latex])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const cleanups: Array<() => void> = []

    for (const slotId of slotIds) {
      const el = root.querySelector(`#fill-slot-${slotId}`) as HTMLElement | null
      if (!el) continue

      el.setAttribute("role", "button")
      el.setAttribute("tabindex", autoResult === "ok" ? "-1" : "0")
      el.classList.add("fill-slot-target", "rounded-sm", "transition-shadow")
      el.style.cursor = autoResult === "ok" ? "default" : "pointer"
      el.classList.toggle("ring-2", dragOverSlot === slotId && autoResult !== "ok")
      el.classList.toggle("ring-violet-400", dragOverSlot === slotId && autoResult !== "ok")
      el.classList.toggle("ring-offset-2", dragOverSlot === slotId && autoResult !== "ok")

      const onClick = () => onSelectSlot(slotId)
      const onDragOver = (e: DragEvent) => {
        if (autoResult === "ok") return
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move"
        setDragOverSlot(slotId)
      }
      const onDragLeave = () => setDragOverSlot(null)
      const onDrop = (e: DragEvent) => {
        e.preventDefault()
        setDragOverSlot(null)
        if (autoResult === "ok") return
        const raw =
          e.dataTransfer?.getData(FILL_SLOT_CHIP_DRAG_MIME) || e.dataTransfer?.getData("text/plain")
        if (raw) onDropChip(raw, slotId)
      }

      el.addEventListener("click", onClick)
      el.addEventListener("dragover", onDragOver)
      el.addEventListener("dragleave", onDragLeave)
      el.addEventListener("drop", onDrop)

      cleanups.push(() => {
        el.removeEventListener("click", onClick)
        el.removeEventListener("dragover", onDragOver)
        el.removeEventListener("dragleave", onDragLeave)
        el.removeEventListener("drop", onDrop)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [html, slotIds, autoResult, dragOverSlot, onSelectSlot, onDropChip, setDragOverSlot])

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full max-w-4xl overflow-x-auto px-2 text-center text-[#1a1423]",
        "[&_.katex-display]:my-0 [&_.katex]:text-[1.35rem] sm:[&_.katex]:text-[1.65rem] md:[&_.katex]:text-[1.95rem]",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
      setCheckPhase("correct")
      onDone()
    } else {
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

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!canContinue) return
    playDashboardStartButtonClickSound()
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
        </div>
      </div>

      <InteractiveBottomChrome registrationDeps={[canContinue, checkPhase]}>
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
  "relative z-10 w-full rounded-xl border-[3px] bg-white px-3 py-2.5 text-center shadow-[0_4px_0_#9d8ab3] transition-[border-color,box-shadow] border-[#cfc3dc] [&_.prose]:my-0 [&_.prose]:text-center [&_.prose]:text-sm [&_p]:mx-auto [&_p]:my-0"

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
          insightDesktopOpen && "lg:right-[25vw]",
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
}: {
  data: FillSlotContent
  nextItemHref: string
  markComplete: () => Promise<void>
}) {
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)
  const explainChat = useLearningPathExplainChat()
  const { pushHint } = useStuckTrigger({ surface: "invata" })

  const slotIds = useMemo(() => data.slots.map((s) => s.id), [data.slots])
  const [assign, setAssign] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(slotIds.map((id) => [id, null]))
  )
  const [active, setActive] = useState<string | null>(slotIds[0] ?? null)
  const [autoResult, setAutoResult] = useState<"ok" | "bad" | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const chipSet = useMemo(() => new Set(data.chips), [data.chips])

  useEffect(() => {
    if (!slotIds.every((id) => assign[id])) {
      setAutoResult(null)
      return
    }
    const allOk = data.slots.every((s) => (assign[s.id] || "").trim() === s.answer.trim())
    setAutoResult(allOk ? "ok" : "bad")
  }, [assign, data.slots, slotIds])

  const renderedLatex = useMemo(
    () => buildFillSlotLatex(data.latexTemplate, assign, active, autoResult, data.slots),
    [data.latexTemplate, assign, active, autoResult, data.slots],
  )

  const used = new Set(Object.values(assign).filter(Boolean) as string[])
  const allFilled = slotIds.length > 0 && slotIds.every((id) => assign[id])

  const placeChipInSlot = (chip: string, slotId: string) => {
    const trimmed = chip.trim()
    if (!trimmed || !chipSet.has(trimmed) || autoResult === "ok") return
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
    e.dataTransfer.setData(FILL_SLOT_CHIP_DRAG_MIME, chip)
    e.dataTransfer.setData("text/plain", chip)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleChipDragEnd = () => {
    setDragOverSlot(null)
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
        autoResult: allFilled ? autoResult : null,
      }),
      problemContextPreamble: "",
      initialUserMessage: LEARNING_PATH_FILL_SLOT_EXPLAIN_INITIAL_PROMPT,
    })
  }

  const canContinue = autoResult === "ok"

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!canContinue) return
    playDashboardStartButtonClickSound()
    await markComplete()
    await navigateToNextItem()
  }

  const chipCardBase =
    "rounded-lg border-[2.5px] bg-white px-2 py-1.5 text-center transition-[border-color,box-shadow,opacity] shadow-[0_3px_0_#9d8ab3] border-[#cfc3dc] sm:rounded-xl sm:border-[3px] sm:px-2.5 sm:py-2 sm:shadow-[0_3px_0_#9d8ab3]"

  return (
    <>
      <div className="flex min-h-[calc(100dvh-3.5rem-8rem)] w-full flex-col items-center justify-center px-2 pb-2 sm:min-h-[calc(100dvh-3.5rem-7.5rem)]">
        <div className="flex w-full max-w-full flex-col items-center">
          <div className="mb-8 w-full sm:mb-10">
            <FillSlotFormula
              latex={renderedLatex}
              slotIds={slotIds}
              autoResult={autoResult}
              dragOverSlot={dragOverSlot}
              onSelectSlot={setActive}
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
                draggable={autoResult !== "ok"}
                onDragStart={(e) => handleChipDragStart(e, chip)}
                onDragEnd={handleChipDragEnd}
                disabled={autoResult === "ok"}
                onClick={() => {
                  if (autoResult === "ok" || !active) return
                  placeChipInSlot(chip, active)
                }}
                className={cn(
                  chipCardBase,
                  "w-full touch-manipulation select-none hover:border-[#a898bc] md:w-auto md:min-w-[3.75rem] md:max-w-[6rem] md:shrink-0",
                  autoResult !== "ok" && "cursor-grab active:cursor-grabbing",
                  autoResult === "ok" && "cursor-not-allowed opacity-60",
                  taken && "opacity-90",
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

        {autoResult === "bad" ? (
          <p className="mt-6 max-w-md px-2 text-center text-sm font-medium text-red-600 sm:text-base">
            Unele valori nu sunt corecte. Trage un chip într-un slot sau selectează un slot și apasă pe un chip.
          </p>
        ) : null}
        </div>
      </div>

      <InteractiveBottomChrome registrationDeps={[canContinue, autoResult]}>
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
        ) : null}
      </InteractiveBottomChrome>
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
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pickL, setPickL] = useState<string | null>(null)
  const [edges, setEdges] = useState<{ leftId: string; rightId: string }[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; ok: boolean }[]>([])

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
    playDashboardStartButtonClickSound()
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

  return (
    <>
      <div className="flex min-h-[calc(100dvh-3.5rem-9rem)] w-full flex-col items-center px-2 pb-2 pt-1 sm:min-h-[calc(100dvh-3.5rem-8rem)] sm:pt-2">
        <p className="mb-5 max-w-lg text-center text-base font-medium leading-snug text-[#22192d] sm:mb-6 sm:max-w-xl sm:text-lg">
          Asociază cardurile din stânga cu cardurile din dreapta.
        </p>
        <div className="flex w-full flex-1 flex-col justify-center">
          <div ref={wrapRef} className="relative mx-auto w-full max-w-3xl">
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
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:justify-items-center md:gap-x-12 md:gap-y-6">
            <div className="flex w-full max-w-[220px] flex-col gap-3 sm:max-w-[248px] md:justify-self-end">
              {data.left.map((row) => (
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
            <div className="flex w-full max-w-[220px] flex-col gap-3 sm:max-w-[248px] md:justify-self-start">
              {data.right.map((row) => (
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
    playDashboardStartButtonClickSound()
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

  const tryAdvance = () => {
    if (!cur) return
    let ok = false
    if (cur.inputMode === "text") {
      ok = normAns(textVal) === normAns(cur.answer)
    } else {
      ok = choice !== null && normAns(choice) === normAns(cur.answer)
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
    playDashboardStartButtonClickSound()
    await markComplete()
    await navigateToNextItem()
  }

  const canVerifyStep =
    !!cur &&
    (cur.inputMode === "text" ? textVal.trim().length > 0 : choice !== null)

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-2 text-[#2a2433]">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#6f657b]">
          {data.language || "code"}
        </p>
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
            {cur.inputMode === "choice" && cur.options ? (
              <div className="flex flex-wrap gap-2">
                {cur.options.map((o) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => setChoice(o)}
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
                onChange={(e) => setTextVal(e.target.value)}
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

      <InteractiveBottomChrome registrationDeps={[done, canVerifyStep, wrong, step]}>
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
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<"left" | "right" | null>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-120, 120], [-8, 8])
  const card = data.cards[idx]
  const finished = idx >= data.cards.length

  const resolve = (side: "left" | "right") => {
    if (!card) return
    const ok = card.side === side
    if (ok) setScore((s) => s + 1)
    setFeedback(side)
    window.setTimeout(() => {
      setFeedback(null)
      setIdx((i) => i + 1)
      x.set(0)
    }, 220)
  }

  useEffect(() => {
    if (finished) onDone()
  }, [finished, onDone])

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!finished) return
    playDashboardStartButtonClickSound()
    await markComplete()
    await navigateToNextItem()
  }

  const outlineBtn =
    "shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 sm:px-5 sm:py-3 sm:text-base"

  return (
    <>
      <div className="mx-auto w-full max-w-md px-2 text-[#2a2433]">
        {data.prompt ? (
          <RichMini
            text={data.prompt}
            className="mb-6 text-center text-[#2a2433] [&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none"
          />
        ) : null}
        <div className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-wide text-[#6f657b] sm:text-sm">
          <span>{data.leftLabel}</span>
          <span>{data.rightLabel}</span>
        </div>
        {!finished && card ? (
          <motion.div
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 70) resolve("right")
              else if (info.offset.x < -70) resolve("left")
              else x.set(0)
            }}
            className="relative mx-auto w-full max-w-md touch-pan-y"
          >
            <div
              className={cn(
                "min-h-[140px] rounded-xl border-[3px] bg-white p-6 text-center shadow-[0_4px_0_#9d8ab3] transition-[border-color,box-shadow] border-[#cfc3dc]",
                feedback === "left" && card.side === "left" && "border-emerald-500 shadow-[0_4px_0_#047857]",
                feedback === "left" && card.side !== "left" && "border-red-500 shadow-[0_4px_0_#b91c1c]",
                feedback === "right" && card.side === "right" && "border-emerald-500 shadow-[0_4px_0_#047857]",
                feedback === "right" && card.side !== "right" && "border-red-500 shadow-[0_4px_0_#b91c1c]",
              )}
            >
              <RichMini text={card.text} className="[&_.prose]:text-center [&_p]:mx-auto [&_p]:max-w-none" />
              <p className="mt-4 text-center text-[11px] text-[#8b7fa3] sm:text-xs">
                Trage stânga/dreapta sau folosește butoanele de mai jos.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-xl border-[3px] border-[#cfc3dc] bg-white px-4 py-8 text-center shadow-[0_4px_0_#9d8ab3] sm:py-10">
            <p className="text-lg font-bold text-[#111] sm:text-xl">
              Scor: {score} / {data.cards.length}
            </p>
          </div>
        )}
      </div>

      <InteractiveBottomChrome registrationDeps={[finished, score, idx, feedback]}>
        {finished ? (
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
            <button type="button" className={outlineBtn} disabled={finished} onClick={() => resolve("left")}>
              ← {data.leftLabel}
            </button>
            <button type="button" className={outlineBtn} disabled={finished} onClick={() => resolve("right")}>
              {data.rightLabel} →
            </button>
          </>
        )}
      </InteractiveBottomChrome>
    </>
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
      const r = evaluate(data.formula, vals as Record<string, number>)
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
    playDashboardStartButtonClickSound()
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
    playDashboardStartButtonClickSound()
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
  const [visible, setVisible] = useState(0)
  const [quizChoice, setQuizChoice] = useState<number | null>(null)
  const [quizErr, setQuizErr] = useState(false)
  const steps = data.steps
  const atEnd = visible >= steps.length
  const block: RevealStepBlock | undefined = atEnd ? undefined : steps[visible]
  const total = steps.length

  const advance = () => {
    if (atEnd) return
    const cur = steps[visible]
    if (cur.kind === "quiz") {
      if (quizChoice === null) return
      if (quizChoice !== cur.correctIndex) {
        setQuizErr(true)
        return
      }
      setQuizErr(false)
      setQuizChoice(null)
    }
    setVisible((v) => v + 1)
  }

  useEffect(() => {
    if (atEnd) onDone()
  }, [atEnd, onDone])

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!atEnd) return
    playDashboardStartButtonClickSound()
    await markComplete()
    await navigateToNextItem()
  }

  const canTapAdvance =
    !!block && (block.kind === "markdown" || (block.kind === "quiz" && quizChoice !== null))

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
                  {block.options.map((o, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        setQuizChoice(i)
                        setQuizErr(false)
                      }}
                      className={cn(
                        "rounded-full border-[2.5px] px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:py-2.5",
                        quizChoice === i
                          ? "border-violet-500 bg-violet-50 text-[#111]"
                          : "border-[#cfc3dc] bg-white text-[#111] shadow-[0_3px_0_#9d8ab3]",
                      )}
                    >
                      <LatexRichText content={o} className="break-words [&_.katex]:text-inherit" />
                    </button>
                  ))}
                </div>
                {quizErr ? (
                  <p className="text-center text-sm font-medium text-red-600 sm:text-base">Răspuns incorect.</p>
                ) : null}
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
        registrationDeps={[atEnd, canTapAdvance, block?.kind, quizChoice, quizErr, visible]}
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
}: {
  parsed: ParsedInteractiveContent
  itemId: string
  lessonId: string
  nextItemHref: string
  isLastItem: boolean
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
          parsed.itemType === "swipe_classify" ||
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
        <FillSlotView data={parsed.data} nextItemHref={nextItemHref} markComplete={markComplete} />
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

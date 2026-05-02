"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  BatteryFull,
  BatteryLow,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCcw,
  XCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { useProgressTrigger } from "@/hooks/engagement/use-progress-trigger"
import { useMomentumTrigger } from "@/hooks/engagement/use-momentum-trigger"
import { resolveTestIcon } from "@/components/invata/test-icons"
import {
  getTestPassThreshold,
  type TestPublicContent,
  type TestPublicProblem,
} from "@/lib/learning-path-test"

const MAX_BATTERIES = 3

interface BatteryState {
  count: number
  nextRefillAt: string | null
  refillQueue: string[]
}

interface SubmitResultEntry {
  problemId: string
  selectedOptionId: string | null
  correctOptionId: string
  isCorrect: boolean
}

interface SubmitResult {
  scoreTotal: number
  scoreCorrect: number
  passed: boolean
  results: SubmitResultEntry[]
}

type ScreenState = "intro" | "test" | "result"

interface LearningPathTestSectionProps {
  itemId: string
  title: string
  content: TestPublicContent
  nextItemHref: string
  lessonId: string
  isLastItem: boolean
}

function formatCountdown(targetIso: string | null): string | null {
  if (!targetIso) return null
  const target = new Date(targetIso).getTime()
  if (!Number.isFinite(target)) return null
  const now = Date.now()
  const diff = Math.max(0, target - now)
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function describeTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  if (minutes === 0) return `${seconds} secunde`
  if (seconds === 0) return `${minutes} ${minutes === 1 ? "minut" : "minute"}`
  return `${minutes} ${minutes === 1 ? "minut" : "minute"} și ${seconds} secunde`
}

interface BatteryStripProps {
  count: number
  max?: number
}

function BatteryStrip({ count, max = MAX_BATTERIES }: BatteryStripProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < count
        return (
          <div
            key={index}
            className={
              "flex h-10 w-8 flex-col items-center justify-center rounded-md border-2 transition-colors sm:h-12 sm:w-9 " +
              (filled
                ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                : "border-[#d1d5db] bg-[#f3f4f6] text-[#9ca3af]")
            }
            aria-label={filled ? "Baterie disponibilă" : "Baterie consumată"}
          >
            {filled ? <BatteryFull className="h-4 w-4 sm:h-5 sm:w-5" /> : <BatteryLow className="h-4 w-4 sm:h-5 sm:w-5" />}
          </div>
        )
      })}
    </div>
  )
}

function DifficultyDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          className={
            "h-2 w-2 rounded-full " + (index < value ? "bg-[#7c3aed]" : "bg-[#d6d3df]")
          }
          aria-hidden
        />
      ))}
    </span>
  )
}

function useBatteryState() {
  const { user } = useAuth()
  const [state, setState] = useState<BatteryState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc("get_lp_test_battery_state")
    if (rpcError) {
      setError("Nu am putut încărca bateriile.")
      setLoading(false)
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      setState({ count: MAX_BATTERIES, nextRefillAt: null, refillQueue: [] })
    } else {
      const refillQueue = Array.isArray(row.refill_queue)
        ? (row.refill_queue as string[])
        : []
      setState({
        count: typeof row.count === "number" ? row.count : Number(row.count ?? 0),
        nextRefillAt: typeof row.next_refill_at === "string" ? row.next_refill_at : null,
        refillQueue,
      })
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { state, setState, loading, error, refresh }
}

interface IntroPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: TestPublicContent
  battery: BatteryState | null
  batteryLoading: boolean
  starting: boolean
  startError: string | null
  onStart: () => void
}

function IntroPopup({
  open,
  onOpenChange,
  title,
  content,
  battery,
  batteryLoading,
  starting,
  startError,
  onStart,
}: IntroPopupProps) {
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (!open) return
    if (!battery?.nextRefillAt || (battery?.count ?? 0) >= MAX_BATTERIES) return
    const interval = window.setInterval(() => forceTick((tick) => tick + 1), 1000)
    return () => window.clearInterval(interval)
  }, [battery?.nextRefillAt, battery?.count, open])

  const countdown = formatCountdown(battery?.nextRefillAt ?? null)
  const noBatteries = !batteryLoading && (battery?.count ?? 0) <= 0
  const Icon = resolveTestIcon(content.icon) ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!z-[401] max-h-[calc(100svh-1.5rem)] w-[calc(100vw-1rem)] max-w-md overflow-y-auto border-[#e5e5e5] bg-white p-4 shadow-xl sm:w-full sm:p-6"
        style={{ borderRadius: "20px" }}
        overlayClassName="!z-[400] !bg-black/45 backdrop-blur-none"
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-[0_8px_16px_rgba(124,58,237,0.24)] sm:h-12 sm:w-12">
            {Icon ? <Icon className="h-5 w-5 sm:h-6 sm:w-6" /> : <span className="text-base font-bold sm:text-lg">T</span>}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b6fac]">Test</p>
          <DialogTitle className="text-center text-lg font-bold leading-tight text-[#111111] sm:text-xl">
            <LatexRichText content={title} className="break-words text-center" />
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-[#3f3550] sm:space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:text-sm">
            <span className="inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-[#f4efff] px-2 py-2 text-[#5b21b6] sm:min-h-0 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="leading-tight">{describeTime(content.timeLimitSeconds)}</span>
            </span>
            <span className="inline-flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl bg-[#f5f3fb] px-2 py-2 text-[#3f3550] sm:min-h-0 sm:flex-row sm:gap-2 sm:rounded-full sm:px-3 sm:py-1">
              <span>Dificultate</span>
              <DifficultyDots value={content.difficulty} />
            </span>
            <span className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#f5f3fb] px-2 py-2 text-[#3f3550] sm:min-h-0 sm:rounded-full sm:px-3 sm:py-1">
              <span className="leading-tight">
                {content.problems.length} {content.problems.length === 1 ? "problemă" : "probleme"}
              </span>
            </span>
          </div>

          {content.description.trim() ? (
            <div className="max-h-36 overflow-y-auto rounded-2xl border border-[#ece8f5] bg-[#fbfaff] p-3 text-left sm:max-h-48 sm:p-4">
              <div className="prose prose-sm max-w-none prose-headings:break-words prose-p:break-words prose-p:my-2">
                <LessonRichContent content={content.description} theme="light" />
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-[#6f657b]">
              Acesta este un test grilă. Trebuie să obții peste 80% pentru a trece la pasul următor.
            </p>
          )}

          <div className="rounded-2xl border border-[#ece8f5] bg-[#fbfaff] p-3 sm:p-4">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6fac]">
              Bateriile tale
            </p>
            <div className="mt-2 sm:mt-3">
              {batteryLoading ? (
                <div className="flex items-center justify-center text-sm text-[#6f657b]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verific bateriile...
                </div>
              ) : (
                <BatteryStrip count={battery?.count ?? 0} />
              )}
            </div>
            <p className="mx-auto mt-2 max-w-xs text-center text-[11px] leading-snug text-[#6f657b] sm:mt-3 sm:text-xs">
              {noBatteries ? (
                <>Nu mai ai baterii. Așteaptă reîncărcarea pentru a încerca din nou.</>
              ) : (
                <>Fiecare încercare consumă o baterie. Bateriile se reîncarcă în 12h.</>
              )}
            </p>
            {countdown ? (
              <p className="mt-1.5 text-center text-xs font-medium text-[#5b21b6] sm:mt-2">
                Următoarea baterie în {countdown}
              </p>
            ) : (
              <p className="mt-1.5 text-center text-xs font-medium text-emerald-600 sm:mt-2">
                Toate bateriile sunt pline.
              </p>
            )}
          </div>

          {startError ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{startError}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col items-stretch gap-2 sm:mt-6">
          <Button
            type="button"
            onClick={onStart}
            disabled={starting || batteryLoading || noBatteries}
            className="h-12 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-base font-semibold text-white hover:opacity-95"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se pornește...
              </>
            ) : (
              "Începe testul"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface QuestionImageProps {
  src: string
  alt: string
}

function QuestionImage({ src, alt }: QuestionImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <p className="text-xs text-[#9b95a6]">Imaginea nu a putut fi încărcată.</p>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece8f5] bg-[#fbfaff]">
      {!loaded ? (
        <div className="flex h-44 items-center justify-center text-[#bbb1cf]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={loaded ? "block max-h-80 w-full object-contain" : "hidden"}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  )
}

interface ProblemCardProps {
  index: number
  total: number
  problem: TestPublicProblem
  selectedOptionId: string | null
  correctOptionId?: string
  showResult: boolean
  onSelect: (problemId: string, optionId: string) => void
}

function ProblemCard({
  index,
  total,
  problem,
  selectedOptionId,
  correctOptionId,
  showResult,
  onSelect,
}: ProblemCardProps) {
  return (
    <div className="rounded-3xl border border-[#ebe4f1] bg-white p-5 shadow-[0_8px_28px_rgba(82,44,111,0.06)] sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b6fac]">
        Problema {index + 1} din {total}
      </p>
      <h3 className="mt-2 text-base font-semibold leading-snug text-[#111111] sm:text-lg">
        <LatexRichText
          content={problem.statement}
          className="whitespace-pre-line break-words [&_.katex]:text-[#111111]"
        />
      </h3>

      {problem.imageUrl ? (
        <div className="mt-4">
          <QuestionImage src={problem.imageUrl} alt={`Imagine pentru problema ${index + 1}`} />
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {problem.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          const isCorrect = showResult && correctOptionId && option.id === correctOptionId
          const isWrongChoice =
            showResult && isSelected && correctOptionId && option.id !== correctOptionId
          return (
            <button
              key={option.id}
              type="button"
              disabled={showResult}
              onClick={() => onSelect(problem.id, option.id)}
              className={
                "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors " +
                (isCorrect
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : isWrongChoice
                    ? "border-red-400 bg-red-50 text-red-700"
                    : isSelected
                      ? "border-[#7c3aed] bg-[#f4efff] text-[#3f3550]"
                      : "border-[#e6e1ee] bg-white text-[#3f3550] hover:border-[#cdc1de] hover:bg-[#fbfaff]")
              }
            >
              <span className="min-w-0 flex-1 text-left">
                <LatexRichText content={option.label} className="break-words [&_.katex]:text-inherit" />
              </span>
              {showResult && isCorrect ? <CheckCircle2 className="h-4 w-4" /> : null}
              {showResult && isWrongChoice ? <XCircle className="h-4 w-4" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LearningPathTestSection({
  itemId,
  title,
  content,
  nextItemHref,
  lessonId,
  isLastItem,
}: LearningPathTestSectionProps) {
  const router = useRouter()
  const { user } = useAuth()
  const pushProgress = useProgressTrigger()
  const pushMomentum = useMomentumTrigger()

  const [screen, setScreen] = useState<ScreenState>("intro")
  const [introOpen, setIntroOpen] = useState(true)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const { state: battery, setState: setBattery, loading: batteryLoading, refresh: refreshBattery } =
    useBatteryState()

  const [secondsLeft, setSecondsLeft] = useState<number>(content.timeLimitSeconds)
  const [autoSubmitArmed, setAutoSubmitArmed] = useState(false)

  useEffect(() => {
    if (screen !== "test") return
    setSecondsLeft(content.timeLimitSeconds)
  }, [content.timeLimitSeconds, screen])

  useEffect(() => {
    if (screen !== "test") return
    if (secondsLeft <= 0) {
      if (!autoSubmitArmed) setAutoSubmitArmed(true)
      return
    }
    const handle = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(handle)
  }, [autoSubmitArmed, screen, secondsLeft])

  const handleSelectOption = useCallback((problemId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [problemId]: optionId }))
  }, [])

  const submit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc("submit_lp_test", {
        p_item_id: itemId,
        p_answers: answers,
      })
      if (rpcError) {
        throw new Error(rpcError.message || "Nu am putut trimite testul.")
      }
      const row = Array.isArray(data) ? data[0] : data
      if (!row) {
        throw new Error("Răspuns invalid de la server.")
      }
      const parsed: SubmitResult = {
        scoreTotal: Number(row.score_total ?? 0),
        scoreCorrect: Number(row.score_correct ?? 0),
        passed: Boolean(row.passed),
        results: Array.isArray(row.results)
          ? (row.results as SubmitResultEntry[])
          : [],
      }
      setResult(parsed)
      setScreen("result")

      if (parsed.passed && user?.id) {
        const { count } = await supabase
          .from("user_learning_path_item_progress")
          .select("item_id", { count: "exact", head: true })
          .eq("user_id", user.id)
        pushProgress(count ?? undefined, itemId)

        if (isLastItem && lessonId) {
          await supabase
            .from("user_learning_path_lesson_progress")
            .upsert(
              {
                user_id: user.id,
                lesson_id: lessonId,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "user_id,lesson_id" }
            )
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || "A apărut o eroare la trimiterea testului.")
    } finally {
      setSubmitting(false)
    }
  }, [answers, isLastItem, itemId, lessonId, pushProgress, submitting, user?.id])

  useEffect(() => {
    if (autoSubmitArmed && screen === "test" && !submitting) {
      void submit()
    }
  }, [autoSubmitArmed, screen, submit, submitting])

  const handleStart = useCallback(async () => {
    setStartError(null)
    setStarting(true)
    try {
      const { data, error: rpcError } = await supabase.rpc("consume_lp_test_battery")
      if (rpcError) {
        if ((rpcError.message || "").toLowerCase().includes("no_batteries")) {
          throw new Error("Nu mai ai baterii disponibile pentru un test nou.")
        }
        throw new Error(rpcError.message || "Nu am putut consuma o baterie.")
      }
      const row = Array.isArray(data) ? data[0] : data
      if (row) {
        const refillQueue = Array.isArray(row.refill_queue)
          ? (row.refill_queue as string[])
          : []
        setBattery({
          count: typeof row.count === "number" ? row.count : Number(row.count ?? 0),
          nextRefillAt: typeof row.next_refill_at === "string" ? row.next_refill_at : null,
          refillQueue,
        })
      }
      setAnswers({})
      setResult(null)
      setSubmitError(null)
      setAutoSubmitArmed(false)
      setSecondsLeft(content.timeLimitSeconds)
      setIntroOpen(false)
      setScreen("test")
    } catch (err: any) {
      setStartError(err.message || "A apărut o eroare la pornirea testului.")
    } finally {
      setStarting(false)
    }
  }, [content.timeLimitSeconds, setBattery])

  const handleRetry = useCallback(async () => {
    await refreshBattery()
    setScreen("intro")
    setIntroOpen(true)
    setResult(null)
    setSubmitError(null)
    setAnswers({})
  }, [refreshBattery])

  const handleContinueAfterPass = useCallback(async () => {
    pushMomentum({
      nextHref: nextItemHref,
      isLastItem,
      itemIndex: 0,
      totalItems: 0,
    })
    router.push(nextItemHref)
  }, [isLastItem, nextItemHref, pushMomentum, router])

  const totalProblems = content.problems.length
  const answeredCount = useMemo(() => {
    let count = 0
    for (const problem of content.problems) {
      if (answers[problem.id]) count += 1
    }
    return count
  }, [answers, content.problems])

  const correctMap = useMemo(() => {
    const map = new Map<string, string>()
    if (result) {
      for (const entry of result.results) {
        map.set(entry.problemId, entry.correctOptionId)
      }
    }
    return map
  }, [result])

  if (screen === "intro") {
    return (
      <>
        <IntroPopup
          open={introOpen}
          onOpenChange={(next) => {
            if (!next) {
              router.back()
              return
            }
            setIntroOpen(next)
          }}
          title={title}
          content={content}
          battery={battery}
          batteryLoading={batteryLoading}
          starting={starting}
          startError={startError}
          onStart={handleStart}
        />
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6f657b]">
          {batteryLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Se pregătește testul...
            </span>
          ) : (
            <span>Acest pas este un test. Confirmă în pop-up pentru a începe.</span>
          )}
        </div>
      </>
    )
  }

  if (screen === "test") {
    return (
      <div className="space-y-5">
        <div className="sticky top-14 z-10 -mx-5 flex items-center justify-between gap-3 border-b border-[#ece8f5] bg-white/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#3f3550]">
            <Clock className="h-4 w-4 text-[#7c3aed]" />
            <span className="tabular-nums">{formatDuration(secondsLeft)}</span>
          </div>
          <div className="text-xs font-medium text-[#6f657b]">
            {answeredCount} / {totalProblems} răspunsuri
          </div>
        </div>

        <div className="space-y-4">
          {content.problems.map((problem, index) => (
            <ProblemCard
              key={problem.id}
              index={index}
              total={totalProblems}
              problem={problem}
              selectedOptionId={answers[problem.id] ?? null}
              showResult={false}
              onSelect={handleSelectOption}
            />
          ))}
        </div>

        {submitError ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-5 flex justify-center border-t border-[#ece8f5] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="h-12 w-full max-w-md rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-base font-semibold text-white hover:opacity-95"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se trimite...
              </>
            ) : (
              `Trimite răspunsurile (${answeredCount}/${totalProblems})`
            )}
          </Button>
        </div>
      </div>
    )
  }

  const passed = !!result?.passed
  const total = result?.scoreTotal ?? totalProblems
  const correctCount = result?.scoreCorrect ?? 0
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const threshold = Math.round(getTestPassThreshold() * 100)

  return (
    <div className="space-y-5">
      <div
        className={
          "rounded-3xl border p-6 text-center shadow-[0_12px_32px_rgba(82,44,111,0.08)] " +
          (passed
            ? "border-emerald-300 bg-emerald-50"
            : "border-red-300 bg-red-50")
        }
      >
        <div
          className={
            "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white " +
            (passed
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
              : "bg-gradient-to-r from-red-500 to-red-600")
          }
        >
          {passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
        </div>
        <p
          className={
            "mt-3 text-xs font-semibold uppercase tracking-[0.18em] " +
            (passed ? "text-emerald-700" : "text-red-700")
          }
        >
          {passed ? "Felicitări, ai trecut!" : "Mai trebuie puțin"}
        </p>
        <p className="mt-1 text-2xl font-bold text-[#111111]">
          Scor: {correctCount}/{total} ({percent}%)
        </p>
        <p className="mt-2 text-sm text-[#3f3550]">
          {passed
            ? "Ai obținut peste " + threshold + "%, ai deblocat pasul următor."
            : "Trebuie să obții peste " + threshold + "% pentru a trece la pasul următor."}
        </p>
      </div>

      {passed ? (
        <div className="space-y-4">
          {content.problems.map((problem, index) => {
            const correctId = correctMap.get(problem.id)
            return (
              <ProblemCard
                key={problem.id}
                index={index}
                total={totalProblems}
                problem={problem}
                selectedOptionId={answers[problem.id] ?? null}
                correctOptionId={correctId}
                showResult
                onSelect={handleSelectOption}
              />
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#ebe4f1] bg-white p-5 text-center shadow-[0_8px_28px_rgba(82,44,111,0.06)]">
          <p className="text-sm font-semibold text-[#111111]">Răspunsurile nu sunt afișate încă.</p>
          <p className="mt-2 text-sm leading-6 text-[#6f657b]">
            După ce treci pragul de {threshold}%, vei putea vedea ce ai făcut corect și ce ai greșit.
          </p>
        </div>
      )}

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
        {passed ? (
          <Link
            href={nextItemHref}
            onClick={(event) => {
              event.preventDefault()
              void handleContinueAfterPass()
            }}
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-6 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]"
          >
            Continuă <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        ) : (
          <Button
            type="button"
            onClick={() => void handleRetry()}
            className="h-12 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-sm font-semibold text-white"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Reia testul
          </Button>
        )}
      </div>
    </div>
  )
}

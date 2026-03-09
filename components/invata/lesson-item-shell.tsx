"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, ChevronRight, Flame } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import type { LearningPathLessonItem } from "@/lib/supabase-learning-paths"

const CTA_GLOW_TINT = "rgba(221, 211, 255, 0.84)"

function playClickSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = "sine"
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  } catch {
    // Ignore audio errors (e.g. autoplay policy)
  }
}

interface LessonItemShellProps {
  chapterSlug: string
  lessonSlug: string
  itemIndex: number
  items: LearningPathLessonItem[]
  lessonBaseHref: string
  isTextLesson: boolean
  children: React.ReactNode
}

export function LessonItemShell({
  chapterSlug,
  lessonSlug,
  itemIndex,
  items,
  lessonBaseHref,
  isTextLesson,
  children,
}: LessonItemShellProps) {
  const { user } = useAuth()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [streak, setStreak] = useState<number | null>(null)
  const [showQuitDialog, setShowQuitDialog] = useState(false)

  const nextItemHref =
    itemIndex < items.length
      ? `${lessonBaseHref}/${itemIndex + 1}`
      : lessonBaseHref

  const stepProgress = items.length > 0 ? itemIndex / items.length : 0

  useEffect(() => {
    if (!user) {
      setStreak(null)
      return
    }
    const fetchStreak = async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("current_streak")
        .eq("user_id", user.id)
        .single()
      setStreak(data?.current_streak ?? 0)
    }
    fetchStreak()
  }, [user])

  const updateScrollProgress = useCallback(() => {
    const el = contentRef.current
    if (!el || !isTextLesson) return

    const rect = el.getBoundingClientRect()
    const contentTop = rect.top + window.scrollY
    const contentHeight = el.offsetHeight
    const viewportHeight = window.innerHeight

    if (contentHeight <= viewportHeight) {
      setScrollProgress(1)
      return
    }

    const scrollable = contentHeight - viewportHeight
    const scrolled = Math.max(0, window.scrollY - contentTop)
    const progress = Math.min(1, Math.max(0, scrolled / scrollable))
    setScrollProgress(progress)
  }, [isTextLesson])

  useEffect(() => {
    if (!isTextLesson) return

    updateScrollProgress()
    window.addEventListener("scroll", updateScrollProgress, { passive: true })
    window.addEventListener("resize", updateScrollProgress)
    return () => {
      window.removeEventListener("scroll", updateScrollProgress)
      window.removeEventListener("resize", updateScrollProgress)
    }
  }, [isTextLesson, updateScrollProgress])

  const progress = isTextLesson ? scrollProgress : stepProgress

  return (
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
          <div className="w-full max-w-[200px] sm:max-w-[280px]">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e5e5]">
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

      <main
        className="min-h-screen bg-[#ffffff] pt-14"
        style={{
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div ref={contentRef} className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12">
          {children}
        </div>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-[300] border-t-2 border-[#eee7f3] bg-white/95 px-4 pt-4 backdrop-blur-sm sm:px-6"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-5xl justify-center">
          <Link
            href={nextItemHref}
            onClick={playClickSound}
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
}

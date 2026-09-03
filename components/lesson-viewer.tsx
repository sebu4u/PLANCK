'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Target,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { Lesson } from '@/lib/supabase-physics'
import { PhysicsChatSidebar } from '@/components/physics-chat-sidebar'
import { WorkInProgressCard } from '@/components/work-in-progress-card'
import { ShareLessonDialog } from '@/components/share-lesson-dialog'
import { PremiumFeatureDialog } from '@/components/premium-feature-dialog'
import { LessonRichContent } from '@/components/lesson-rich-content'
import { LessonExercisesTab } from '@/components/cursuri/lesson-exercises-tab'
import { ReportIssueButton } from '@/components/content-reports/report-issue-button'
import { slugify } from '@/lib/slug'
import type { CursuriSubjectId } from '@/lib/cursuri-subjects'
import type { LessonExercisePublic } from '@/lib/lesson-exercises'

import { MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS } from '@/lib/mobile-app-nav'

interface LessonViewerProps {
  lesson: Lesson | null
  onPreviousLesson?: () => void
  onNextLesson?: () => void
  hasPrevious: boolean
  hasNext: boolean
  currentGrade?: number
  onProgressChange?: (progress: number) => void
  isCompleted?: boolean
  onComplete?: () => void
  subject?: CursuriSubjectId
  exercises?: LessonExercisePublic[]
}

const lessonNavBtnClass =
  "h-10 flex-1 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-none hover:bg-[#F8FAFD] hover:text-gray-900 disabled:opacity-40"

const lessonNavPrimaryClass =
  "h-10 flex-1 rounded-xl border border-gray-900 bg-gray-900 text-sm font-medium text-white shadow-none hover:bg-gray-800 hover:text-white disabled:opacity-40"

const lessonCompleteBtnClass =
  "h-10 flex-1 rounded-xl border border-emerald-600 bg-emerald-600 text-sm font-medium text-white shadow-none hover:bg-emerald-700 hover:text-white"

export function LessonViewer({
  lesson,
  onPreviousLesson,
  onNextLesson,
  hasPrevious,
  hasNext,
  currentGrade,
  onProgressChange,
  isCompleted = false,
  onComplete,
  subject,
  exercises = [],
}: LessonViewerProps) {

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const [selectionButtonPos, setSelectionButtonPos] = useState<{ x: number, y: number } | null>(null)
  const [selectedText, setSelectedText] = useState<string>('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInitialQuery, setChatInitialQuery] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const container = document.getElementById('lesson-scroll-container')
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const windowHeight = scrollHeight - clientHeight
      if (windowHeight > 0) {
        const progress = (scrollTop / windowHeight) * 100
        const clamped = Math.min(100, Math.max(0, progress))
        setScrollProgress(clamped)
        onProgressChange?.(clamped)
      }
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [lesson, onProgressChange])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.ask-ai-btn')) return

      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelectionButtonPos(null)
        return
      }

      const text = selection.toString().trim()
      if (!text) {
        setSelectionButtonPos(null)
        return
      }

      const container = document.getElementById('lesson-content-wrapper')
      if (!container || (!container.contains(selection.anchorNode) && !container.contains(selection.focusNode))) {
        setSelectionButtonPos(null)
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // Position relative to content wrapper so the button scrolls with the text
      setSelectionButtonPos({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top
      })
      setSelectedText(text)
    }

    const handleInteraction = (e: MouseEvent) => {
      if (e.button !== 0) return
      setTimeout(() => handleMouseUp(e), 10)
    }

    document.addEventListener('mouseup', handleInteraction)
    return () => document.removeEventListener('mouseup', handleInteraction)
  }, [])

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[#F8FAFD]">
        <div className="w-full max-w-2xl">
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              Selectează o lecție
            </h3>
            <p className="text-gray-400">
              Alege o lecție din sidebar pentru a începe învățarea
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-[#F8FAFD]">
      <div
        className={`
          absolute top-[3px] left-[3px] bottom-[3px]
          bg-white lg:rounded-xl overflow-hidden flex flex-col
          transition-all duration-300 ease-in-out
          ${isChatOpen ? 'right-[3px] xl:right-[453px]' : 'right-[3px]'}
        `}
      >
        <div className="flex-1 overflow-y-auto lesson-sidebar-scroll" id="lesson-scroll-container">
          <WorkInProgressCard />

          <div className="bg-white text-gray-900 p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className="bg-[#F8FAFD] text-gray-800 border-gray-200">
                    Lecția {lesson.order_index}
                  </Badge>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(lesson.estimated_duration)}</span>
                  </div>
                  {lesson.difficulty_level && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Target className="w-4 h-4" />
                      <span>Nivel {lesson.difficulty_level}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-gray-200 bg-white text-gray-700 shadow-none hover:bg-[#F8FAFD] hover:text-gray-900 text-xs lg:text-sm"
                    onClick={() => setIsShareOpen(true)}
                  >
                    <Share2 className="w-4 h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Partajează</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full border-gray-200 bg-white text-gray-700 shadow-none hover:bg-[#F8FAFD] hover:text-gray-900 text-xs lg:text-sm"
                    onClick={() => setIsPremiumDialogOpen(true)}
                  >
                    <Download className="w-4 h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Descarcă</span>
                  </Button>
                  {lesson ? (
                    <ReportIssueButton
                      sourceType="course_lesson"
                      sourceId={lesson.id}
                      sourceMeta={{
                        subject,
                        slug: slugify(lesson.title),
                        title: lesson.title,
                        chapter_id: lesson.chapter_id,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold mb-4 break-words text-gray-900">{lesson.title}</h1>

              <div className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  className={lessonNavBtnClass}
                  onClick={onPreviousLesson}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Lecția anterioară</span>
                  <span className="sm:hidden">Înapoi</span>
                </Button>

                <Button
                  variant="outline"
                  className={lessonNavPrimaryClass}
                  onClick={onNextLesson}
                  disabled={!hasNext}
                >
                  <span className="hidden sm:inline">Lecția următoare</span>
                  <span className="sm:hidden">Înainte</span>
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 lg:px-6 py-2.5 pointer-events-none">
            <div className="max-w-4xl mx-auto">
              <div className="h-2.5 w-full rounded-full bg-[#E8EEF5] overflow-hidden p-[2px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="relative px-4 pb-8 pt-4 lg:px-6 lg:pb-8 lg:pt-4 bg-white" id="lesson-content-wrapper">
            {selectionButtonPos && (
              <div
                className="absolute z-50 animate-in zoom-in-95 duration-200"
                style={{
                  top: `${selectionButtonPos.y - 12}px`,
                  left: `${selectionButtonPos.x}px`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <Button
                  size="sm"
                  onClick={() => {
                    setChatInitialQuery(selectedText)
                    setIsChatOpen(true)
                    setSelectionButtonPos(null)
                  }}
                  className="ask-ai-btn bg-gray-900 hover:bg-gray-800 text-white shadow-lg border-0 rounded-full h-9 px-4 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask AI
                </Button>
                <div className="w-3 h-3 bg-gray-900 absolute left-1/2 -bottom-1.5 -translate-x-1/2 rotate-45" />
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              <div className="lesson-content relative">
                <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:break-words prose-p:break-words ">
                  <LessonRichContent content={lesson.content} theme="light" />
                </div>
              </div>

              <LessonExercisesTab exercises={exercises} />

              <div className="mt-8 flex flex-row gap-2">
                <Button
                  variant="outline"
                  className={lessonNavBtnClass}
                  onClick={() => {
                    onPreviousLesson?.()
                    setTimeout(() => {
                      document.getElementById('lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Lecția anterioară</span>
                  <span className="sm:hidden">Înapoi</span>
                </Button>

                {isCompleted ? (
                  <Button
                    variant="outline"
                    className={lessonNavPrimaryClass}
                    onClick={() => {
                      onNextLesson?.()
                      setTimeout(() => {
                        document.getElementById('lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })
                      }, 100)
                    }}
                    disabled={!hasNext}
                  >
                    <span className="hidden sm:inline">Lecția următoare</span>
                    <span className="sm:hidden">Înainte</span>
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className={lessonCompleteBtnClass}
                    onClick={onComplete}
                  >
                    <span className="hidden sm:inline">Am terminat lecția</span>
                    <span className="sm:hidden">Finalizează</span>
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {!isChatOpen && (
        <Button
          onClick={() => {
            setIsChatOpen(true)
            setChatInitialQuery(null)
          }}
          className={`fixed bottom-8 right-4 z-50 rounded-2xl w-14 h-14 p-0 shadow-lg bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-300 hover:scale-105 group lg:right-8 ${MOBILE_BOTTOM_NAV_FAB_OFFSET_CLASS}`}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-7 h-7 text-gray-800" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-800"></span>
          </span>
        </Button>
      )}

      <PhysicsChatSidebar
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false)
          setChatInitialQuery(null)
        }}
        lessonContent={lesson.content}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        initialQuery={chatInitialQuery}
      />

      <ShareLessonDialog
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        lessonTitle={lesson.title}
        lessonUrl={currentUrl}
      />

      <PremiumFeatureDialog
        isOpen={isPremiumDialogOpen}
        onOpenChange={setIsPremiumDialogOpen}
      />
    </div>
  )
}

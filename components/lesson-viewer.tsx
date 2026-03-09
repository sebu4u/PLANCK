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
}

export function LessonViewer({
  lesson,
  onPreviousLesson,
  onNextLesson,
  hasPrevious,
  hasNext,
  currentGrade,
  onProgressChange,
  isCompleted = false,
  onComplete
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
        setScrollProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    container.addEventListener('scroll', handleScroll)
    // Trigger once to set initial state if needed, though usually starts at 0
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [lesson]) // Re-run if lesson changes

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

      setSelectionButtonPos({
        x: rect.left + rect.width / 2,
        y: rect.top
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
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[#1b1b1b]">
        <div className="w-full max-w-2xl">
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              Selectează o lecție
            </h3>
            <p className="text-white/50">
              Alege o lecție din sidebar pentru a începe învățarea
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div
        className={`
          absolute top-[3px] left-[3px] bottom-[3px] 
          bg-[#1b1b1b] lg:rounded-xl overflow-hidden flex flex-col
          transition-all duration-300 ease-in-out
          ${isChatOpen ? 'right-[3px] xl:right-[453px]' : 'right-[3px]'}
          border-[3px] border-[#101010] lg:border-none
          /* On desktop, we handle "border" via the gap (margin). On mobile, layout is different. */
          /* Wait, if I use absolute right-[3px], I am creating a gap. */
          /* The user asked for "Constant in a border ce are o margine de 3px". */
          /* So the GAP creates the visual border if parent is #101010. */
        `}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar" id="lesson-scroll-container">
          <WorkInProgressCard />

          <div className="bg-[#1b1b1b] text-white p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className="bg-white/10 text-white backdrop-blur-sm border-white/20">
                    Lecția {lesson.order_index}
                  </Badge>
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(lesson.estimated_duration)}</span>
                  </div>
                  {lesson.difficulty_level && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Target className="w-4 h-4" />
                      <span>Nivel {lesson.difficulty_level}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-xs lg:text-sm rounded-full"
                    onClick={() => setIsShareOpen(true)}
                  >
                    <Share2 className="w-4 h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Partajează</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-xs lg:text-sm rounded-full"
                    onClick={() => setIsPremiumDialogOpen(true)}
                  >
                    <Download className="w-4 h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Descarcă</span>
                  </Button>
                </div>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold mb-4 break-words text-white">{lesson.title}</h1>

              <div className="flex flex-row justify-between gap-2">
                <Button
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-sm flex-1"
                  onClick={onPreviousLesson}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Lecția anterioară</span>
                  <span className="sm:hidden">Anterioară</span>
                </Button>

                <Button
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-sm flex-1"
                  onClick={onNextLesson}
                  disabled={!hasNext}
                >
                  <span className="hidden sm:inline">Lecția următoare</span>
                  <span className="sm:hidden">Următoare</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          <div className="sticky top-4 z-50 px-4 lg:px-6 pointer-events-none">
            <div className="max-w-4xl mx-auto">
              <div className="h-3 rounded-full bg-[#1b1b1b]/80 backdrop-blur-md border border-white/10 p-[2px] shadow-lg">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100 ease-out"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-2 lg:px-6 lg:pb-6 lg:pt-2 bg-[#1b1b1b]" id="lesson-content-wrapper">
            <div className="max-w-4xl mx-auto">
              <div className="lesson-content relative">
                <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:break-words prose-p:break-words prose-invert">
                  <LessonRichContent content={lesson.content} theme="dark" />
                </div>
              </div>

              <div className="mt-6 lg:mt-8 flex flex-row justify-between gap-2">
                <Button
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-sm flex-1"
                  onClick={() => {
                    onPreviousLesson?.()
                    setTimeout(() => {
                      document.getElementById('lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Lecția anterioară</span>
                  <span className="sm:hidden">Anterioară</span>
                </Button>

                {isCompleted ? (
                  <Button
                    variant="outline"
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white text-sm flex-1"
                    onClick={() => {
                      onNextLesson?.()
                      setTimeout(() => {
                        document.getElementById('lesson-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })
                      }, 100)
                    }}
                    disabled={!hasNext}
                  >
                    <span className="hidden sm:inline">Lecția următoare</span>
                    <span className="sm:hidden">Următoare</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="bg-white/10 backdrop-blur-sm border-green-500 text-white hover:bg-green-500/10 hover:text-white text-sm flex-1 shadow-lg shadow-green-900/20 transition-all duration-300 transform hover:scale-[1.02]"
                    onClick={onComplete}
                  >
                    <span className="hidden sm:inline">Am terminat lecția</span>
                    <span className="sm:hidden">Finalizează</span>
                    <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {selectionButtonPos && (
        <div
          className="fixed z-50 animate-in zoom-in-95 duration-200"
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
            className="ask-ai-btn bg-purple-600 hover:bg-purple-700 text-white shadow-xl border border-white/10 rounded-full h-9 px-4 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </Button>
          <div className="w-3 h-3 bg-purple-600 absolute left-1/2 -bottom-1.5 -translate-x-1/2 rotate-45" />
        </div>
      )}

      {!isChatOpen && (
        <Button
          onClick={() => {
            setIsChatOpen(true)
            setChatInitialQuery(null)
          }}
          className="fixed bottom-8 right-8 z-50 rounded-2xl w-14 h-14 p-0 shadow-2xl bg-[#252525] hover:bg-[#2a2a2a] border border-white/20 transition-all duration-300 hover:scale-105 group"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
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

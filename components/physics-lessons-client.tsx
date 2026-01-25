'use client'

import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { Grade, Chapter, Lesson, LessonSummary } from '@/lib/supabase-physics'
import { Button } from '@/components/ui/button'
import { Menu, X, Chrome, Github, Loader2, Lock, PanelRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { slugify } from '@/lib/slug'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

// Lazy load heavy components
const PhysicsSidebar = lazy(() => import('@/components/physics-sidebar').then(m => ({ default: m.PhysicsSidebar })))
const LessonViewer = lazy(() => import('@/components/lesson-viewer').then(m => ({ default: m.LessonViewer })))
import { WorkInProgressCard } from '@/components/work-in-progress-card'
import { getUserCompletedLessons, markLessonAsCompleted } from '@/lib/supabase-physics'
import { LessonCompletionModal } from '@/components/lesson-completion-modal'

interface PhysicsLessonsClientProps {
  grades: Grade[]
  chapters: { [gradeId: string]: Chapter[] }
  lessons: { [chapterId: string]: LessonSummary[] }
  initialLessonId?: string
}

export function PhysicsLessonsClient({ grades, chapters, lessons, initialLessonId }: PhysicsLessonsClientProps) {
  const { user, loading: authLoading, loginWithGoogle, loginWithGitHub } = useAuth()
  const { toast } = useToast()
  const [loginLoading, setLoginLoading] = useState<'google' | 'github' | null>(null)

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1)
  const [allLessons, setAllLessons] = useState<LessonSummary[]>([])
  const [currentGrade, setCurrentGrade] = useState<number>(9)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const hasInitializedFromPersisted = useRef(false)
  const [isLessonLoading, setIsLessonLoading] = useState(false)
  const lessonCache = useRef<Map<string, Lesson>>(new Map())
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set())
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // Check if user is not authenticated (show auth gate)
  const showAuthGate = !authLoading && !user

  // Login handlers
  const handleGoogleLogin = async () => {
    setLoginLoading('google')
    const { error } = await loginWithGoogle()
    setLoginLoading(null)
    if (error) {
      toast({
        title: 'Eroare la autentificare cu Google',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleGitHubLogin = async () => {
    setLoginLoading('github')
    const { error } = await loginWithGitHub()
    setLoginLoading(null)
    if (error) {
      toast({
        title: 'Eroare la autentificare cu GitHub',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  // Block scroll when auth gate is shown
  useEffect(() => {
    const lockScroll = () => {
      if (showAuthGate) {
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
      } else {
        if (!isMobileSidebarOpen) {
          document.body.style.overflow = 'unset'
          document.documentElement.style.overflow = 'unset'
        }
      }
    }

    lockScroll()

    // Retry after a small delay to handle navigation race conditions
    const timer = setTimeout(lockScroll, 100)
    // Another retry for good measure
    const timer2 = setTimeout(lockScroll, 300)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      if (showAuthGate) {
        document.body.style.overflow = 'unset'
        document.documentElement.style.overflow = 'unset'
      }
    }
  }, [showAuthGate, isMobileSidebarOpen])

  // Fetch completed lessons
  useEffect(() => {
    if (user) {
      getUserCompletedLessons(user.id).then((ids) => {
        setCompletedLessonIds(new Set(ids))
      })
    } else {
      setCompletedLessonIds(new Set())
    }
  }, [user])

  // Apply preselected class from navbar dropdown
  useEffect(() => {
    const applyPreselectedClass = () => {
      try {
        const cls = sessionStorage.getItem('physicsSelectedClass')
        if (!cls) return
        const map: Record<string, number> = { 'a 9-a': 9, 'a 10-a': 10, 'a 11-a': 11, 'a 12-a': 12 }
        const num = map[cls]
        if (num) {
          setCurrentGrade(num)
        }
      } catch { }
    }
    applyPreselectedClass()
    const handler = () => applyPreselectedClass()
    window.addEventListener('physicsClassSelected', handler)
    return () => window.removeEventListener('physicsClassSelected', handler)
  }, [])

  // Skeletons
  const SidebarSkeleton = () => (
    <div className="w-full lg:w-80 h-full lg:h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0 lg:block">
      <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 lg:h-6 w-32 lg:w-44 bg-white/10" />
          <Skeleton className="h-5 lg:h-6 w-5 lg:w-6 rounded bg-white/10" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-2 lg:p-3 space-y-2 lg:space-y-3">
            <div className="flex items-center gap-2 lg:gap-3">
              <Skeleton className="h-4 lg:h-5 w-4 lg:w-5 rounded bg-white/10" />
              <Skeleton className="h-4 lg:h-5 w-32 lg:w-48 bg-white/10" />
            </div>
            <div className="space-y-1 lg:space-y-2 pl-5 lg:pl-7">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-2 lg:gap-3">
                  <Skeleton className="h-4 lg:h-5 w-4 lg:w-5 rounded-full bg-white/10" />
                  <Skeleton className={`h-3 lg:h-4 bg-white/10 ${j % 3 === 0 ? 'w-40 lg:w-56' : j % 3 === 1 ? 'w-32 lg:w-44' : 'w-48 lg:w-64'}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const LessonViewerSkeleton = () => (
    <div className="w-full">
      <div className="bg-[#1b1b1b] text-white p-3 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Mobile skeleton header - mirrors real header exactly */}
          <div className="lg:hidden">
            <div className="flex flex-col justify-between mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Skeleton className="h-6 w-24 bg-white/10 rounded" />
                <Skeleton className="h-5 w-20 bg-white/10 rounded" />
                <Skeleton className="h-5 w-24 bg-white/10 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 bg-white/10 rounded-md" />
                <Skeleton className="h-8 w-28 bg-white/10 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-7 w-11/12 bg-white/10 mb-4" />
            <div className="flex flex-row justify-between gap-2">
              <Skeleton className="h-10 w-full bg-white/10 rounded-md" />
              <Skeleton className="h-10 w-full bg-white/10 rounded-md" />
            </div>
          </div>

          {/* Desktop skeleton header - mirrors real header exactly */}
          <div className="hidden lg:block">
            {/* Meta row */}
            <div className="flex flex-row items-center justify-between mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-6 w-28 bg-white/10 rounded" />
                <Skeleton className="h-6 w-24 bg-white/10 rounded" />
                <Skeleton className="h-6 w-28 bg-white/10 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-28 bg-white/10 rounded-md" />
                <Skeleton className="h-9 w-32 bg-white/10 rounded-md" />
              </div>
            </div>

            {/* Title */}
            <Skeleton className="h-10 w-4/5 bg-white/10 mb-4" />

            {/* Navigation buttons */}
            <div className="flex flex-row justify-between gap-2">
              <Skeleton className="h-11 w-full bg-white/10 rounded-md" />
              <Skeleton className="h-11 w-full bg-white/10 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 lg:p-6 bg-[#1b1b1b]">
        <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
          {/* Section heading */}
          <Skeleton className="h-5 lg:h-6 w-1/2 lg:w-2/3 bg-white/10" />

          {/* Paragraph lines with varying widths - mobile optimized */}
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`p1-${i}`} className={`h-3 lg:h-4 bg-white/10 ${i % 4 === 0 ? 'w-[95%]' : i % 4 === 1 ? 'w-[88%]' : i % 4 === 2 ? 'w-[76%]' : 'w-[90%]'}`} />
          ))}

          {/* Image/figure placeholder - responsive height */}
          <Skeleton className="h-48 lg:h-64 w-full rounded-lg bg-white/10" />

          {/* More text - mobile optimized */}
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`p2-${i}`} className={`h-3 lg:h-4 bg-white/10 ${i % 3 === 0 ? 'w-[90%]' : i % 3 === 1 ? 'w-[82%]' : 'w-[70%]'}`} />
          ))}

          {/* Bottom navigation skeleton - mobile responsive */}
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 mt-6 lg:mt-8">
            <Skeleton className="h-10 lg:h-11 w-full bg-white/10" />
            <Skeleton className="h-10 lg:h-11 w-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )

  // Blochează scroll-ul când sidebar-ul este deschis pe mobil
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup când componenta se distruge
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileSidebarOpen])


  // Construim lista completă de lecții (rezumate) pentru navigare
  useEffect(() => {
    const lessonsList: LessonSummary[] = []

    grades.forEach(grade => {
      const gradeChapters = chapters[grade.id] || []
      gradeChapters.forEach(chapter => {
        const chapterLessons = lessons[chapter.id] || []
        lessonsList.push(...chapterLessons)
      })
    })

    // Nu mai sortăm global, păstrăm ordinea naturală (Grade -> Capitol -> Lecție)
    setAllLessons(lessonsList)
  }, [grades, chapters, lessons])

  // Actualizează URL-ul și persistă ultima lecție selectată
  const updateUrlAndPersist = (lessonId: string) => {
    try {
      const url = new URL(window.location.href)
      // Folosește URL prietenos: /cursuri/[slug] (din titlu)
      const summary = allLessons.find(l => l.id === lessonId)
      const slug = summary ? slugify(summary.title) : lessonId
      url.pathname = `/cursuri/${slug}`
      window.history.replaceState({}, '', url.toString())
      localStorage.setItem('lastLessonId', lessonId)
    } catch (e) {
      // Ignorăm în cazurile rare în care URL/localStorage nu este disponibil
    }
  }

  // Helper: fetch lesson detail by id with cache
  const fetchLessonById = async (lessonId: string, options?: { silent?: boolean }): Promise<Lesson | null> => {
    if (lessonCache.current.has(lessonId)) {
      return lessonCache.current.get(lessonId) as Lesson
    }
    try {
      if (!options?.silent) setIsLessonLoading(true)
      const res = await fetch(`/api/physics/lessons/${lessonId}`, { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      if (data && data.id) {
        lessonCache.current.set(lessonId, data)
        return data as Lesson
      }
    } catch (e) {
      console.error('Failed to fetch lesson by id', lessonId, e)
    } finally {
      if (!options?.silent) setIsLessonLoading(false)
    }
    return null
  }

  // Initializează lecția curentă din URL (path sau query), prop sau localStorage după ce avem toate lecțiile (rezumate)
  useEffect(() => {
    if (hasInitializedFromPersisted.current) return
    if (allLessons.length === 0) return

    try {
      const url = new URL(window.location.href)
      const pathParts = url.pathname.split('/').filter(Boolean)
      const pathLessonId = pathParts[0] === 'cursuri' && pathParts[1] ? pathParts[1] : undefined
      const urlLessonId = url.searchParams.get('lesson')
      const storedLessonId = localStorage.getItem('lastLessonId') || undefined
      const targetLessonId = initialLessonId || pathLessonId || urlLessonId || storedLessonId || allLessons[0]?.id

      if (targetLessonId) {
        const index = allLessons.findIndex(l => l.id === targetLessonId)
        if (index !== -1) {
          setCurrentLessonIndex(index)
          // Fetch detaliile lecției selectate
          fetchLessonById(targetLessonId).then((detail) => {
            if (detail) setCurrentLesson(detail)
          })

          // Găsim clasa pentru lecția curentă
          for (const grade of grades) {
            const gradeChapters = chapters[grade.id] || []
            for (const chapter of gradeChapters) {
              const chapterLessons = lessons[chapter.id] || []
              if (chapterLessons.some(l => l.id === targetLessonId)) {
                setCurrentGrade(grade.grade_number)
                break
              }
            }
          }
        }
      }
    } catch (e) {
      // Dacă nu putem citi URL/localStorage, continuăm fără inițializare
    } finally {
      hasInitializedFromPersisted.current = true
    }
  }, [allLessons, grades, chapters, lessons, initialLessonId])

  const handleLessonSelect = (lesson: LessonSummary) => {
    const index = allLessons.findIndex(l => l.id === lesson.id)
    setCurrentLessonIndex(index)
    updateUrlAndPersist(lesson.id)
    // Fetch detaliile lecției selectate
    fetchLessonById(lesson.id).then((detail) => {
      if (detail) setCurrentLesson(detail)
    })

    // Găsim clasa pentru lecția curentă
    for (const grade of grades) {
      const gradeChapters = chapters[grade.id] || []
      for (const chapter of gradeChapters) {
        const chapterLessons = lessons[chapter.id] || []
        if (chapterLessons.some(l => l.id === lesson.id)) {
          setCurrentGrade(grade.grade_number)
          break
        }
      }
    }

    // Închide sidebar-ul pe mobil când se selectează o lecție
    setIsMobileSidebarOpen(false)

    // Scroll la vârful paginii când se schimbă lecția
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Verifică dacă este prima lecție din capitol


  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const previousLesson = allLessons[currentLessonIndex - 1]
      setCurrentLessonIndex(currentLessonIndex - 1)
      updateUrlAndPersist(previousLesson.id)
      fetchLessonById(previousLesson.id).then((detail) => {
        if (detail) setCurrentLesson(detail)
      })

      // Scroll la vârful paginii
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1]
      setCurrentLessonIndex(currentLessonIndex + 1)
      updateUrlAndPersist(nextLesson.id)
      fetchLessonById(nextLesson.id).then((detail) => {
        if (detail) setCurrentLesson(detail)
      })

      // Scroll la vârful paginii
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const hasPrevious = currentLessonIndex > 0
  const hasNext = currentLessonIndex < allLessons.length - 1

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-[#101010]">
      {/* Auth Gate Overlay - shown for unauthenticated users */}
      {showAuthGate && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[200] flex items-center justify-center">
          {/* Backdrop blur overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />

          {/* Login Card */}
          <div className="relative z-10 w-[min(580px,90vw)] bg-[#0d0d0d] border border-white/15 rounded-2xl shadow-[0_0_60px_rgba(255,255,255,0.05)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header Image */}
            <div className="relative h-32 sm:h-44 w-full mb-0">
              <img
                src="/images/auth-gate-header.png"
                alt="Physics Authentication"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/60 to-transparent" />
            </div>

            <div className="p-5 sm:p-8 pt-4">

              {/* Title & Description */}
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
                Creează-ți un cont gratuit
              </h2>
              <p className="text-gray-400 text-center text-sm mb-4 sm:mb-8">
                Pentru a accesa cursurile de fizică, ai nevoie de un cont PLANCK.
                Este gratuit și durează doar câteva secunde!
              </p>

              {/* Login Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loginLoading !== null}
                  className="w-full h-10 sm:h-12 bg-white hover:bg-gray-100 text-black border border-white/20 hover:border-white/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  {loginLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Chrome className="w-5 h-5 mr-2 text-gray-800" />
                  )}
                  <span className="font-semibold">
                    {loginLoading === 'google' ? 'Se conectează...' : 'Continuă cu Google'}
                  </span>
                </Button>

                <Button
                  onClick={handleGitHubLogin}
                  disabled={loginLoading !== null}
                  className="w-full h-10 sm:h-12 bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/10 hover:border-white/20 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                >
                  {loginLoading === 'github' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Github className="w-5 h-5 mr-2" />
                  )}
                  <span className="font-semibold">
                    {loginLoading === 'github' ? 'Se conectează...' : 'Continuă cu GitHub'}
                  </span>
                </Button>
              </div>

              {/* Footer note */}
              <p className="text-gray-500 text-xs text-center mt-6">
                Prin continuare, accepți{' '}
                <a href="/termeni" className="text-white/60 hover:text-white/90 hover:underline transition-colors">Termenii și Condițiile</a>
                {' '}și{' '}
                <a href="/confidentialitate" className="text-white/60 hover:text-white/90 hover:underline transition-colors">Politica de Confidențialitate</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - blurred when auth gate is shown */}
      <div className={`flex relative h-full ${showAuthGate ? 'pointer-events-none blur-[3px] select-none' : ''}`}>
        {/* Mobile Menu Button */}
        {!isMobileSidebarOpen && (
          <Button
            variant="outline"
            size="sm"
            className="fixed right-4 top-20 z-[90] lg:hidden bg-[#101010] border-white/20 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/10"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <PanelRight className="w-4 h-4 animate-in zoom-in duration-200" />
          </Button>
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[350] lg:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop & Mobile */}
        <div className={`
          ${isMobileSidebarOpen
            ? 'fixed inset-y-0 right-0 z-[360] w-4/5 block animate-in slide-in-from-right duration-300 ease-out bg-[#101010]'
            : 'hidden lg:block h-full z-10'
          }
        `}>
          <Suspense fallback={<SidebarSkeleton />}>
            <PhysicsSidebar
              grades={grades}
              chapters={chapters}
              lessons={lessons}
              currentLessonId={currentLesson?.id}
              completedLessonIds={completedLessonIds}
              onLessonSelect={handleLessonSelect}
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </Suspense>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0 h-full overflow-hidden">
          <Suspense fallback={<LessonViewerSkeleton />}>
            {isLessonLoading ? (
              <LessonViewerSkeleton />
            ) : (
              <LessonViewer
                lesson={currentLesson}
                onPreviousLesson={handlePreviousLesson}
                onNextLesson={handleNextLesson}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                currentGrade={currentGrade}
                isCompleted={currentLesson ? completedLessonIds.has(currentLesson.id) : false}
                onComplete={async () => {
                  if (user && currentLesson) {
                    const success = await markLessonAsCompleted(user.id, currentLesson.id)
                    if (success) {
                      setCompletedLessonIds(prev => new Set(prev).add(currentLesson.id))
                      setShowCompletionModal(true)
                    }
                  }
                }}
                onProgressChange={(p) => {
                  if (p >= 80 && currentLessonIndex < allLessons.length - 1) {
                    const nextId = allLessons[currentLessonIndex + 1].id
                    if (!lessonCache.current.has(nextId)) {
                      // Prefetch următoarea lecție în cache (silent, fără skeleton)
                      fetchLessonById(nextId, { silent: true })
                    }
                  }
                }}
              />
            )}
          </Suspense>
        </div>
      </div>

      <LessonCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onNextLesson={handleNextLesson}
        hasNextLesson={hasNext}
      />
    </div>
  )
}


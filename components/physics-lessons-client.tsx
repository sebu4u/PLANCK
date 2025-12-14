'use client'

import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { Grade, Chapter, Lesson, LessonSummary } from '@/lib/supabase-physics'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { slugify } from '@/lib/slug'

// Lazy load heavy components
const PhysicsSidebar = lazy(() => import('@/components/physics-sidebar').then(m => ({ default: m.PhysicsSidebar })))
const LessonViewer = lazy(() => import('@/components/lesson-viewer').then(m => ({ default: m.LessonViewer })))
import { WorkInProgressCard } from '@/components/work-in-progress-card'

interface PhysicsLessonsClientProps {
  grades: Grade[]
  chapters: { [gradeId: string]: Chapter[] }
  lessons: { [chapterId: string]: LessonSummary[] }
  initialLessonId?: string
}

export function PhysicsLessonsClient({ grades, chapters, lessons, initialLessonId }: PhysicsLessonsClientProps) {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1)
  const [allLessons, setAllLessons] = useState<LessonSummary[]>([])
  const [currentGrade, setCurrentGrade] = useState<number>(9)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const hasInitializedFromPersisted = useRef(false)
  const [isLessonLoading, setIsLessonLoading] = useState(false)
  const lessonCache = useRef<Map<string, Lesson>>(new Map())

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
          <Skeleton className="h-5 lg:h-6 w-32 lg:w-44 bg-gray-800" />
          <Skeleton className="h-5 lg:h-6 w-5 lg:w-6 rounded bg-gray-800" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-2 lg:p-3 space-y-2 lg:space-y-3">
            <div className="flex items-center gap-2 lg:gap-3">
              <Skeleton className="h-4 lg:h-5 w-4 lg:w-5 rounded bg-gray-800" />
              <Skeleton className="h-4 lg:h-5 w-32 lg:w-48 bg-gray-800" />
            </div>
            <div className="space-y-1 lg:space-y-2 pl-5 lg:pl-7">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-2 lg:gap-3">
                  <Skeleton className="h-4 lg:h-5 w-4 lg:w-5 rounded-full bg-gray-800" />
                  <Skeleton className={`h-3 lg:h-4 bg-gray-800 ${j % 3 === 0 ? 'w-40 lg:w-56' : j % 3 === 1 ? 'w-32 lg:w-44' : 'w-48 lg:w-64'}`} />
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
      <div className="bg-[#0d1117] text-white p-3 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Mobile skeleton header - mirrors real header exactly */}
          <div className="lg:hidden">
            <div className="flex flex-col justify-between mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Skeleton className="h-6 w-24 bg-gray-800 rounded" />
                <Skeleton className="h-5 w-20 bg-gray-800 rounded" />
                <Skeleton className="h-5 w-24 bg-gray-800 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 bg-gray-800 rounded-md" />
                <Skeleton className="h-8 w-28 bg-gray-800 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-7 w-11/12 bg-gray-800 mb-4" />
            <div className="flex flex-row justify-between gap-2">
              <Skeleton className="h-10 w-full bg-gray-800 rounded-md" />
              <Skeleton className="h-10 w-full bg-gray-800 rounded-md" />
            </div>
          </div>

          {/* Desktop skeleton header - mirrors real header exactly */}
          <div className="hidden lg:block">
            {/* Meta row */}
            <div className="flex flex-row items-center justify-between mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-6 w-28 bg-gray-800 rounded" />
                <Skeleton className="h-6 w-24 bg-gray-800 rounded" />
                <Skeleton className="h-6 w-28 bg-gray-800 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-28 bg-gray-800 rounded-md" />
                <Skeleton className="h-9 w-32 bg-gray-800 rounded-md" />
              </div>
            </div>

            {/* Title */}
            <Skeleton className="h-10 w-4/5 bg-gray-800 mb-4" />

            {/* Navigation buttons */}
            <div className="flex flex-row justify-between gap-2">
              <Skeleton className="h-11 w-full bg-gray-800 rounded-md" />
              <Skeleton className="h-11 w-full bg-gray-800 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 lg:p-6 bg-[#0d1117]">
        <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
          {/* Section heading */}
          <Skeleton className="h-5 lg:h-6 w-1/2 lg:w-2/3 bg-gray-800" />

          {/* Paragraph lines with varying widths - mobile optimized */}
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`p1-${i}`} className={`h-3 lg:h-4 bg-gray-800 ${i % 4 === 0 ? 'w-[95%]' : i % 4 === 1 ? 'w-[88%]' : i % 4 === 2 ? 'w-[76%]' : 'w-[90%]'}`} />
          ))}

          {/* Image/figure placeholder - responsive height */}
          <Skeleton className="h-48 lg:h-64 w-full rounded-lg bg-gray-800" />

          {/* More text - mobile optimized */}
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`p2-${i}`} className={`h-3 lg:h-4 bg-gray-800 ${i % 3 === 0 ? 'w-[90%]' : i % 3 === 1 ? 'w-[82%]' : 'w-[70%]'}`} />
          ))}

          {/* Bottom navigation skeleton - mobile responsive */}
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 mt-6 lg:mt-8">
            <Skeleton className="h-10 lg:h-11 w-full bg-gray-800" />
            <Skeleton className="h-10 lg:h-11 w-full bg-gray-800" />
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

    // Sortăm lecțiile după order_index
    lessonsList.sort((a, b) => a.order_index - b.order_index)
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
  const isFirstLessonInChapter = () => {
    if (!currentLesson) return false

    // Găsim capitolul curent
    for (const grade of grades) {
      const gradeChapters = chapters[grade.id] || []
      for (const chapter of gradeChapters) {
        const chapterLessons = lessons[chapter.id] || []
        if (chapterLessons.some(l => l.id === currentLesson.id)) {
          // Verifică dacă este prima lecție din capitol
          const sortedLessons = chapterLessons.sort((a, b) => a.order_index - b.order_index)
          return sortedLessons[0]?.id === currentLesson.id
        }
      }
    }
    return false
  }

  // Verifică dacă este ultima lecție din capitol
  const isLastLessonInChapter = () => {
    if (!currentLesson) return false

    // Găsim capitolul curent
    for (const grade of grades) {
      const gradeChapters = chapters[grade.id] || []
      for (const chapter of gradeChapters) {
        const chapterLessons = lessons[chapter.id] || []
        if (chapterLessons.some(l => l.id === currentLesson.id)) {
          // Verifică dacă este ultima lecție din capitol
          const sortedLessons = chapterLessons.sort((a, b) => a.order_index - b.order_index)
          return sortedLessons[sortedLessons.length - 1]?.id === currentLesson.id
        }
      }
    }
    return false
  }

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

  const hasPrevious = currentLessonIndex > 0 && !isFirstLessonInChapter()
  const hasNext = currentLessonIndex < allLessons.length - 1 && !isLastLessonInChapter()

  return (
    <div className="flex relative">
      {/* Mobile Menu Button */}
      {!isMobileSidebarOpen && (
        <Button
          variant="outline"
          size="sm"
          className="fixed right-4 top-20 z-[90] lg:hidden bg-[#0d1117] border-white/20 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/10"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <Menu className="w-4 h-4 animate-in zoom-in duration-200" />
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
          ? 'fixed inset-y-0 right-0 z-[360] w-4/5 block animate-in slide-in-from-right duration-300 ease-out bg-[#0d1117]'
          : 'hidden lg:block sticky top-16 self-start z-10'
        }
      `}>
        <Suspense fallback={<SidebarSkeleton />}>
          <PhysicsSidebar
            grades={grades}
            chapters={chapters}
            lessons={lessons}
            currentLessonId={currentLesson?.id}
            onLessonSelect={handleLessonSelect}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </Suspense>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-0">
        <WorkInProgressCard />
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
  )
}


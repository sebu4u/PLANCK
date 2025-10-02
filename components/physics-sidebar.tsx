'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  Atom,
  Calculator,
  Lightbulb,
  Target,
  Lock,
  X
} from 'lucide-react'
import { Grade, Chapter, LessonSummary } from '@/lib/supabase-physics'
import { slugify } from '@/lib/slug'

interface PhysicsSidebarProps {
  grades: Grade[]
  chapters: { [gradeId: string]: Chapter[] }
  lessons: { [chapterId: string]: LessonSummary[] }
  currentLessonId?: string
  onLessonSelect: (lesson: LessonSummary) => void
  onClose?: () => void
}

interface GradeWithData extends Grade {
  chapters: ChapterWithData[]
  totalLessons: number
  completedLessons: number
  totalDuration: number
}

interface ChapterWithData extends Chapter {
  lessons: LessonSummary[]
  totalLessons: number
  completedLessons: number
  totalDuration: number
}

export function PhysicsSidebar({ 
  grades, 
  chapters, 
  lessons, 
  currentLessonId, 
  onLessonSelect,
  onClose
}: PhysicsSidebarProps) {
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [gradesData, setGradesData] = useState<GradeWithData[]>([])

  // Auto-deschide clasa și capitolul care conțin lecția curentă
  useEffect(() => {
    if (!currentLessonId || grades.length === 0) return

    let foundGradeId: string | null = null
    let foundChapterId: string | null = null

    for (const grade of grades) {
      const gradeChapters = chapters[grade.id] || []
      for (const chapter of gradeChapters) {
        const chapterLessons = lessons[chapter.id] || []
        if (chapterLessons.some(l => l.id === currentLessonId)) {
          foundGradeId = grade.id
          foundChapterId = chapter.id
          break
        }
      }
      if (foundGradeId && foundChapterId) break
    }

    if (foundGradeId) {
      setExpandedGrades(prev => {
        const next = new Set(prev)
        next.add(foundGradeId as string)
        return next
      })
    }

    if (foundChapterId) {
      setExpandedChapters(prev => {
        const next = new Set(prev)
        next.add(foundChapterId as string)
        return next
      })
    }
  }, [currentLessonId, grades, chapters, lessons])

  // Calculează datele pentru fiecare clasă
  useEffect(() => {
    const processedGrades = grades.map(grade => {
      const gradeChapters = chapters[grade.id] || []
      const processedChapters = gradeChapters.map(chapter => {
        const chapterLessons = lessons[chapter.id] || []
        const totalDuration = chapterLessons.reduce((sum, lesson) => 
          sum + (lesson.estimated_duration || 0), 0
        )
        
        return {
          ...chapter,
          lessons: chapterLessons,
          totalLessons: chapterLessons.length,
          completedLessons: 0, // Va fi implementat când adăugăm progresul utilizatorului
          totalDuration
        }
      })

      const totalLessons = processedChapters.reduce((sum, chapter) => sum + chapter.totalLessons, 0)
      const completedLessons = processedChapters.reduce((sum, chapter) => sum + chapter.completedLessons, 0)
      const totalDuration = processedChapters.reduce((sum, chapter) => sum + chapter.totalDuration, 0)

      return {
        ...grade,
        chapters: processedChapters,
        totalLessons,
        completedLessons,
        totalDuration
      }
    })

    setGradesData(processedGrades)
  }, [grades, chapters, lessons])

  const toggleGrade = (gradeId: string) => {
    const newExpanded = new Set(expandedGrades)
    if (newExpanded.has(gradeId)) {
      newExpanded.delete(gradeId)
    } else {
      newExpanded.add(gradeId)
    }
    setExpandedGrades(newExpanded)
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const getGradeIcon = (gradeNumber: number) => {
    switch (gradeNumber) {
      case 9: return Atom
      case 10: return Calculator
      case 11: return Lightbulb
      case 12: return Target
      default: return BookOpen
    }
  }

  const getGradeColor = (gradeNumber: number) => {
    switch (gradeNumber) {
      case 9: return 'text-purple-600'
      case 10: return 'text-blue-600'
      case 11: return 'text-green-600'
      case 12: return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getLessonNumberColor = (gradeNumber: number, isCurrentLesson: boolean) => {
    if (isCurrentLesson) {
      return 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
    }
    
    switch (gradeNumber) {
      case 9: return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
      case 10: return 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
      case 11: return 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
      case 12: return 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="lesson-sidebar-scroll w-full lg:w-80 bg-white border-r border-gray-200 h-full lg:h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0 shadow-lg lg:block">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Lecții de Fizică</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              onClick={onClose}
            >
              <X className="w-4 h-4 animate-in zoom-in duration-200" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {gradesData.map((grade) => {
            const GradeIcon = getGradeIcon(grade.grade_number)
            const isExpanded = expandedGrades.has(grade.id)
            const progressPercentage = grade.totalLessons > 0 ? (grade.completedLessons / grade.totalLessons) * 100 : 0

            return (
              <Card key={grade.id} className="border-gray-200">
                <CardContent className="p-0">
                  {/* Grade Header */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto transition-all duration-200 ease-in-out hover:bg-gray-50 hover:scale-[1.01]"
                    onClick={() => toggleGrade(grade.id)}
                  >
                    <div className="flex items-center w-full">
                      <ChevronDown className={`w-4 h-4 mr-2 text-gray-500 transition-transform duration-500 ease-in-out ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`} />
                      <GradeIcon className={`w-5 h-5 mr-3 ${getGradeColor(grade.grade_number)}`} />
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">{grade.name}</div>
                        <div className="text-sm text-gray-500">
                          {grade.totalLessons} lecții • {formatDuration(grade.totalDuration)}
                        </div>
                      </div>
                    </div>
                  </Button>


                  {/* Chapters */}
                  <div className={`border-t border-gray-100 transition-all duration-500 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className={`transition-all duration-500 ease-in-out ${
                      isExpanded 
                        ? 'translate-y-0 opacity-100' 
                        : '-translate-y-4 opacity-0'
                    }`}>
                      {grade.chapters.map((chapter) => {
                        const isChapterExpanded = expandedChapters.has(chapter.id)
                        const chapterProgressPercentage = chapter.totalLessons > 0 ? 
                          (chapter.completedLessons / chapter.totalLessons) * 100 : 0

                        return (
                          <div key={chapter.id} className="border-b border-gray-50 last:border-b-0">
                            {/* Chapter Header */}
                            <Button
                              variant="ghost"
                              className="w-full justify-start p-3 h-auto text-left transition-all duration-200 ease-in-out hover:bg-gray-50 hover:scale-[1.01]"
                              onClick={() => toggleChapter(chapter.id)}
                            >
                              <div className="flex items-center w-full">
                                <ChevronDown className={`w-3 h-3 mr-2 text-gray-400 transition-transform duration-500 ease-in-out ${
                                  isChapterExpanded ? 'rotate-0' : '-rotate-90'
                                }`} />
                                <BookOpen className="w-4 h-4 mr-2 text-gray-600" />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800 text-sm">
                                    {chapter.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {chapter.totalLessons} lecții • {formatDuration(chapter.totalDuration)}
                                  </div>
                                </div>
                              </div>
                            </Button>


                            {/* Lessons */}
                            <div className={`bg-gray-50 transition-all duration-500 ease-in-out overflow-hidden ${
                              isChapterExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                              <div className={`transition-all duration-500 ease-in-out ${
                                isChapterExpanded 
                                  ? 'translate-y-0 opacity-100' 
                                  : '-translate-y-2 opacity-0'
                              }`}>
                                {chapter.lessons.map((lesson, index) => {
                                  const isCurrentLesson = currentLessonId === lesson.id
                                  const isCompleted = false // Va fi implementat cu progresul utilizatorului
                                  
                                  return (
                                    <Button
                                      key={lesson.id}
                                      variant="ghost"
                                      className={`w-full justify-start p-2 h-auto text-left transition-all duration-200 ease-in-out hover:bg-gray-100 hover:scale-[1.02] ${
                                        isCurrentLesson ? 'bg-blue-100 border-l-2 border-blue-500 scale-[1.02]' : ''
                                      }`}
                                      onClick={() => onLessonSelect(lesson)}
                                    >
                                       <div className="flex items-center w-full">
                                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mr-3 flex-none ${getLessonNumberColor(grade.grade_number, isCurrentLesson)}`}>
                                           {index + 1}
                                         </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-gray-800 text-sm break-words">
                                            {lesson.title}
                                          </div>
                                          <div className="flex items-center text-xs text-gray-500">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDuration(lesson.estimated_duration || 0)}
                                            {lesson.difficulty_level && (
                                              <>
                                                <span className="mx-1">•</span>
                                                <span>Nivel {lesson.difficulty_level}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center">
                                          {isCompleted ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                          ) : (
                                            <PlayCircle className="w-4 h-4 text-gray-400" />
                                          )}
                                        </div>
                                      </div>
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    ChevronDown,
    ChevronRight,
    BookOpen,
    Atom,
    Calculator,
    Lightbulb,
    Target,
    X,
    Lock,
    CheckCircle2
} from 'lucide-react'
import { Grade, Chapter, LessonSummary } from '@/lib/supabase-physics'
import { slugify } from '@/lib/slug'

interface PhysicsSidebarProps {
    grades: Grade[]
    chapters: { [gradeId: string]: Chapter[] }
    lessons: { [chapterId: string]: LessonSummary[] }
    currentLessonId?: string
    completedLessonIds?: Set<string>
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
    completedLessonIds = new Set(),
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
                    completedLessons: chapterLessons.filter(l => completedLessonIds.has(l.id)).length,
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
    }, [grades, chapters, lessons, completedLessonIds])

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


    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    return (
        <div className="lesson-sidebar-scroll w-full lg:w-80 h-full lg:h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0 lg:block">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Lecții de Fizică</h2>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4 animate-in zoom-in duration-200" />
                        </Button>
                    )}
                </div>

                <div className="space-y-1">
                    {gradesData.map((grade) => {
                        const GradeIcon = getGradeIcon(grade.grade_number)
                        const isExpanded = expandedGrades.has(grade.id)
                        // Check if any chapter in this grade has a selected lesson
                        const hasSelectedLesson = grade.chapters.some(chapter =>
                            chapter.lessons.some(l => l.id === currentLessonId)
                        )

                        const isLocked = grade.grade_number === 11 || grade.grade_number === 12

                        return (
                            <div key={grade.id} className="mb-2">
                                {/* Grade Header */}
                                <button
                                    className={`w-full text-left p-2 h-auto transition-all duration-200 ease-in-out ${isLocked
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:opacity-80'
                                        }`}
                                    onClick={() => !isLocked && toggleGrade(grade.id)}
                                    disabled={isLocked}
                                >
                                    <div className="flex items-center w-full">
                                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-500 ease-in-out ${hasSelectedLesson ? 'text-blue-400' : 'text-white'} ${isExpanded ? 'rotate-0' : '-rotate-90'
                                            } ${isLocked ? 'invisible' : ''}`} />
                                        <GradeIcon className={`w-5 h-5 mr-3 ${hasSelectedLesson ? 'text-blue-400' : 'text-white'}`} />
                                        <div className="flex-1 text-left">
                                            <div className={`font-semibold ${hasSelectedLesson ? 'text-blue-400' : 'text-white'}`}>{grade.name}</div>
                                        </div>
                                        <div className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full ml-auto whitespace-nowrap">
                                            {grade.completedLessons}/{grade.totalLessons}
                                        </div>
                                        {isLocked && <Lock className="w-4 h-4 ml-2 text-white/50" />}
                                    </div>
                                </button>

                                {/* Chapters */}
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className={`transition-all duration-500 ease-in-out ${isExpanded
                                        ? 'translate-y-0 opacity-100'
                                        : '-translate-y-4 opacity-0'
                                        }`}>
                                        {grade.chapters.map((chapter) => {
                                            const isChapterExpanded = expandedChapters.has(chapter.id)
                                            // Check if any lesson in this chapter is selected
                                            const hasSelectedLesson = chapter.lessons.some(l => l.id === currentLessonId)

                                            return (
                                                <div key={chapter.id} className="pl-6">
                                                    {/* Chapter Header */}
                                                    <button
                                                        className="w-full text-left p-2 h-auto transition-all duration-200 ease-in-out hover:opacity-80"
                                                        onClick={() => toggleChapter(chapter.id)}
                                                    >
                                                        <div className="flex items-center w-full">
                                                            <ChevronDown className={`w-3 h-3 mr-2 transition-transform duration-500 ease-in-out ${hasSelectedLesson ? 'text-blue-400' : 'text-white'} ${isChapterExpanded ? 'rotate-0' : '-rotate-90'
                                                                }`} />
                                                            <div className="flex-1">
                                                                <div className={`font-medium text-sm ${hasSelectedLesson ? 'text-blue-400' : 'text-white'}`}>
                                                                    {chapter.title}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Lessons */}
                                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isChapterExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                                        }`}>
                                                        <div className={`transition-all duration-500 ease-in-out ${isChapterExpanded
                                                            ? 'translate-y-0 opacity-100'
                                                            : '-translate-y-2 opacity-0'
                                                            }`}>
                                                            {chapter.lessons.map((lesson, index) => {
                                                                const isCurrentLesson = currentLessonId === lesson.id

                                                                return (
                                                                    <button
                                                                        key={lesson.id}
                                                                        className={`w-full text-left p-2 h-auto transition-all duration-200 ease-in-out hover:opacity-80 pl-6`}
                                                                        onClick={() => onLessonSelect(lesson)}
                                                                    >
                                                                        <div className="flex items-center w-full">
                                                                            <div className="flex items-center w-full group">
                                                                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                                    <div className={`font-medium text-sm break-words flex-1 ${isCurrentLesson ? 'text-blue-400' : 'text-white'}`}>
                                                                                        {lesson.title}
                                                                                    </div>
                                                                                    {completedLessonIds.has(lesson.id) && (
                                                                                        <CheckCircle2 className={`w-4 h-4 text-green-500 shrink-0 ${isCurrentLesson ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

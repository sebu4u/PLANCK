"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  FileText,
  Plus,
  GraduationCap,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react"
import { ChapterForm } from "@/components/admin/chapter-form"
import { LessonForm } from "@/components/admin/lesson-form"
import type { Lesson } from "@/lib/supabase-physics"

// Types mirroring DB
interface Grade {
  id: string
  grade_number: number
  name: string
  order_index: number
  is_active: boolean
}

interface Chapter {
  id: string
  grade_id: string
  title: string
  description: string | null
  order_index: number
  is_active: boolean
  estimated_duration: number | null
  created_at: string
  updated_at: string
}

interface LessonSummary {
  id: string
  chapter_id: string
  title: string
  order_index: number
  difficulty_level: number | null
  estimated_duration: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type EditMode =
  | { type: "none" }
  | { type: "new-chapter"; gradeId: string }
  | { type: "edit-chapter"; chapter: Chapter }
  | { type: "new-lesson"; chapterId: string }
  | { type: "edit-lesson"; lesson: Lesson }

export function LessonsManager() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState<EditMode>({ type: "none" })
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const getAccessToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token || null
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune expirată. Reîncarcă pagina.")
        return
      }

      const response = await fetch("/api/admin/lessons", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut încărca datele.")
      }

      const data = await response.json()
      setGrades(data.grades || [])
      setChapters(data.chapters || [])
      setLessons(data.lessons || [])
    } catch (err: any) {
      setError(err.message || "Eroare la încărcarea datelor.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchLessonContent = async (lessonId: string) => {
    try {
      setLoadingLesson(true)
      const accessToken = await getAccessToken()
      if (!accessToken) return null

      // Fetch the full lesson with content through the physics API
      const res = await fetch(`/api/physics/lessons/${lessonId}`, { cache: "no-store" })
      if (!res.ok) return null
      const data = await res.json()
      return data as Lesson
    } catch {
      return null
    } finally {
      setLoadingLesson(false)
    }
  }

  const handleSave = async (data: any) => {
    const accessToken = await getAccessToken()
    if (!accessToken) throw new Error("Sesiune expirată.")

    const isEdit = !!data.id
    const method = isEdit ? "PUT" : "POST"

    const response = await fetch("/api/admin/lessons", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const resData = await response.json()
      throw new Error(resData.error || "Eroare la salvare.")
    }

    // Show success and refresh
    setSuccessMessage(isEdit ? "Salvat cu succes!" : "Creat cu succes!")
    setTimeout(() => setSuccessMessage(null), 3000)
    setEditMode({ type: "none" })
    setEditingLesson(null)
    await fetchData()
  }

  const handleEditLesson = async (lessonSummary: LessonSummary) => {
    const fullLesson = await fetchLessonContent(lessonSummary.id)
    if (fullLesson) {
      setEditingLesson(fullLesson)
      setEditMode({ type: "edit-lesson", lesson: fullLesson })
    } else {
      setError("Nu am putut încărca conținutul lecției.")
    }
  }

  const toggleGrade = (gradeId: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev)
      if (next.has(gradeId)) next.delete(gradeId)
      else next.add(gradeId)
      return next
    })
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }

  const getChaptersForGrade = (gradeId: string) =>
    chapters.filter((c) => c.grade_id === gradeId).sort((a, b) => a.order_index - b.order_index)

  const getLessonsForChapter = (chapterId: string) =>
    lessons.filter((l) => l.chapter_id === chapterId).sort((a, b) => a.order_index - b.order_index)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)]">
      {/* Left: Tree Navigation */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Structura cursuri</h3>
          </div>

          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            {grades.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm text-center">Nu sunt clase disponibile.</div>
            ) : (
              grades.map((grade) => {
                const gradeChapters = getChaptersForGrade(grade.id)
                const isExpanded = expandedGrades.has(grade.id)

                return (
                  <div key={grade.id} className="border-b border-white/5 last:border-b-0">
                    {/* Grade */}
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => toggleGrade(grade.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <GraduationCap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-white flex-1">
                        {grade.name || `Clasa ${grade.grade_number}`}
                      </span>
                      <span className="text-xs text-gray-500">{gradeChapters.length} cap.</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-200 hover:text-green-400 hover:bg-green-400/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditMode({ type: "new-chapter", gradeId: grade.id })
                          setEditingLesson(null)
                          if (!isExpanded) toggleGrade(grade.id)
                        }}
                        title="Adaugă capitol"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Chapters under this grade */}
                    {isExpanded && (
                      <div className="bg-white/[0.02]">
                        {gradeChapters.length === 0 ? (
                          <div className="pl-10 pr-4 py-2 text-xs text-gray-500 italic">
                            Niciun capitol
                          </div>
                        ) : (
                          gradeChapters.map((chapter) => {
                            const chapterLessons = getLessonsForChapter(chapter.id)
                            const isChExpanded = expandedChapters.has(chapter.id)

                            return (
                              <div key={chapter.id}>
                                {/* Chapter */}
                                <div
                                  className="flex items-center gap-2 pl-8 pr-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                                  onClick={() => toggleChapter(chapter.id)}
                                >
                                  {isChExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <BookOpen className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                  <span className={`text-sm flex-1 truncate ${chapter.is_active ? "text-gray-200" : "text-gray-500 line-through"}`}>
                                    {chapter.title}
                                  </span>
                                  {!chapter.is_active && (
                                    <EyeOff className="w-3 h-3 text-gray-500 flex-shrink-0" title="Inactiv" />
                                  )}
                                  <span className="text-xs text-gray-500">{chapterLessons.length}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-gray-200 hover:text-blue-400 hover:bg-blue-400/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditMode({ type: "edit-chapter", chapter })
                                      setEditingLesson(null)
                                    }}
                                    title="Editează capitol"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-gray-200 hover:text-green-400 hover:bg-green-400/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditMode({ type: "new-lesson", chapterId: chapter.id })
                                      setEditingLesson(null)
                                      if (!isChExpanded) toggleChapter(chapter.id)
                                    }}
                                    title="Adaugă lecție"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>

                                {/* Lessons under this chapter */}
                                {isChExpanded && (
                                  <div>
                                    {chapterLessons.length === 0 ? (
                                      <div className="pl-16 pr-4 py-1.5 text-xs text-gray-500 italic">
                                        Nicio lecție
                                      </div>
                                    ) : (
                                      chapterLessons.map((lessonItem) => (
                                        <div
                                          key={lessonItem.id}
                                          className={`flex items-center gap-2 pl-14 pr-4 py-1.5 cursor-pointer hover:bg-white/5 transition-colors group ${
                                            editMode.type === "edit-lesson" && editingLesson?.id === lessonItem.id
                                              ? "bg-blue-500/10 border-l-2 border-blue-400"
                                              : ""
                                          }`}
                                          onClick={() => handleEditLesson(lessonItem)}
                                        >
                                          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span className={`text-xs flex-1 truncate ${lessonItem.is_active ? "text-gray-300" : "text-gray-500 line-through"}`}>
                                            {lessonItem.title}
                                          </span>
                                          {!lessonItem.is_active && (
                                            <EyeOff className="w-3 h-3 text-gray-500 flex-shrink-0" title="Inactivă" />
                                          )}
                                          {loadingLesson && editMode.type === "edit-lesson" && editingLesson?.id === lessonItem.id && (
                                            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                                          )}
                                          <Pencil className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Right: Form area */}
      <div className="flex-1 min-w-0">
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          {editMode.type === "none" && (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Selectează un element</p>
              <p className="text-sm">
                Folosește arborele din stânga pentru a naviga prin clase, capitole și lecții.
                <br />
                Apasă pe <Plus className="w-3 h-3 inline mx-1" /> pentru a adăuga sau pe <Pencil className="w-3 h-3 inline mx-1" /> pentru a edita.
              </p>
            </div>
          )}

          {editMode.type === "new-chapter" && (
            <ChapterForm
              grades={grades}
              defaultGradeId={editMode.gradeId}
              onSave={handleSave}
              onCancel={() => setEditMode({ type: "none" })}
            />
          )}

          {editMode.type === "edit-chapter" && (
            <ChapterForm
              grades={grades}
              chapter={editMode.chapter}
              onSave={handleSave}
              onCancel={() => setEditMode({ type: "none" })}
            />
          )}

          {editMode.type === "new-lesson" && (
            <LessonForm
              chapters={chapters}
              defaultChapterId={editMode.chapterId}
              onSave={handleSave}
              onCancel={() => setEditMode({ type: "none" })}
            />
          )}

          {editMode.type === "edit-lesson" && editingLesson && (
            <LessonForm
              chapters={chapters}
              lesson={editingLesson}
              onSave={handleSave}
              onCancel={() => {
                setEditMode({ type: "none" })
                setEditingLesson(null)
              }}
            />
          )}

          {editMode.type === "edit-lesson" && loadingLesson && !editingLesson && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-white mr-3" />
              <span className="text-gray-400">Se încarcă lecția...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

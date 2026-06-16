"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  getLearningPathItemLabel,
  type FizicaChapter,
  type FizicaLesson,
  type FizicaLessonItemAssignment,
  type FizicaRoute,
} from "@/lib/supabase-fizica-learning-map"
import type {
  LearningPathChapter,
  LearningPathLesson,
  LearningPathLessonItem,
} from "@/lib/supabase-learning-paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { FIZICA_LESSON_TYPE_LABEL, type FizicaLessonType } from "@/lib/invata-fizica-config"

const LESSON_TYPES = ["invata", "scrie", "exerseaza"] as const

export function FizicaMapManager() {
  const [routes, setRoutes] = useState<FizicaRoute[]>([])
  const [chapters, setChapters] = useState<FizicaChapter[]>([])
  const [lessons, setLessons] = useState<FizicaLesson[]>([])
  const [assignments, setAssignments] = useState<FizicaLessonItemAssignment[]>([])
  const [lpChapters, setLpChapters] = useState<LearningPathChapter[]>([])
  const [lpLessons, setLpLessons] = useState<LearningPathLesson[]>([])
  const [lpItems, setLpItems] = useState<LearningPathLessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [selectedRouteId, setSelectedRouteId] = useState<string>("")
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [selectedLessonId, setSelectedLessonId] = useState<string>("")

  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [newChapterSlug, setNewChapterSlug] = useState("")
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonDuration, setNewLessonDuration] = useState("10")
  const [newLessonType, setNewLessonType] = useState<(typeof LESSON_TYPES)[number]>("invata")
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonDuration, setEditLessonDuration] = useState("0")
  const [editLessonType, setEditLessonType] = useState<FizicaLessonType>("invata")
  const [editLessonOrderIndex, setEditLessonOrderIndex] = useState("0")
  const [editLessonIsActive, setEditLessonIsActive] = useState(true)
  const [itemSearch, setItemSearch] = useState("")
  const [expandedLpChapters, setExpandedLpChapters] = useState<Set<string>>(new Set())
  const [expandedLpLessons, setExpandedLpLessons] = useState<Set<string>>(new Set())

  const selectedRouteIdRef = useRef(selectedRouteId)
  const selectedChapterIdRef = useRef(selectedChapterId)
  const selectedLessonIdRef = useRef(selectedLessonId)

  useEffect(() => {
    selectedRouteIdRef.current = selectedRouteId
  }, [selectedRouteId])

  useEffect(() => {
    selectedChapterIdRef.current = selectedChapterId
  }, [selectedChapterId])

  useEffect(() => {
    selectedLessonIdRef.current = selectedLessonId
  }, [selectedLessonId])

  const getAccessToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token ?? null
  }, [])

  const refreshData = useCallback(
    async (options?: { showFullScreenLoader?: boolean }) => {
      if (options?.showFullScreenLoader) {
        setLoading(true)
      }
      setError(null)
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          setError("Sesiune invalidă.")
          return
        }

        const [fizicaRes, lpRes] = await Promise.all([
          fetch("/api/admin/fizica-map", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch("/api/admin/learning-paths", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        if (!fizicaRes.ok || !lpRes.ok) {
          setError("Nu am putut încărca datele.")
          return
        }

        const fizicaData = await fizicaRes.json()
        const lpData = await lpRes.json()

        const nextRoutes: FizicaRoute[] = fizicaData.routes ?? []
        const nextChapters: FizicaChapter[] = fizicaData.chapters ?? []
        const nextLessons: FizicaLesson[] = fizicaData.lessons ?? []

        setRoutes(nextRoutes)
        setChapters(nextChapters)
        setLessons(nextLessons)
        setAssignments(fizicaData.assignments ?? [])
        setLpChapters(lpData.chapters ?? [])
        setLpLessons(lpData.lessons ?? [])
        setLpItems(lpData.items ?? [])

        const currentRouteId = selectedRouteIdRef.current
        const currentChapterId = selectedChapterIdRef.current
        const currentLessonId = selectedLessonIdRef.current

        const nextRouteId =
          nextRoutes.find((route) => route.id === currentRouteId)?.id || nextRoutes[0]?.id || ""
        const routeChapters = nextChapters.filter((chapter) => chapter.route_id === nextRouteId)
        const nextChapterId =
          routeChapters.find((chapter) => chapter.id === currentChapterId)?.id ||
          routeChapters[0]?.id ||
          ""
        const chapterLessonsForSelection = nextLessons.filter(
          (lesson) => lesson.chapter_id === nextChapterId,
        )
        const nextLessonId =
          chapterLessonsForSelection.find((lesson) => lesson.id === currentLessonId)?.id ||
          chapterLessonsForSelection[0]?.id ||
          ""

        setSelectedRouteId(nextRouteId)
        setSelectedChapterId(nextChapterId)
        setSelectedLessonId(nextLessonId)
      } catch (err) {
        console.error(err)
        setError("Eroare la încărcarea datelor.")
      } finally {
        if (options?.showFullScreenLoader) {
          setLoading(false)
        }
      }
    },
    [getAccessToken],
  )

  useEffect(() => {
    void refreshData({ showFullScreenLoader: true })
  }, [refreshData])

  const routeChapters = useMemo(
    () => chapters.filter((chapter) => chapter.route_id === selectedRouteId),
    [chapters, selectedRouteId],
  )

  const chapterLessons = useMemo(
    () => lessons.filter((lesson) => lesson.chapter_id === selectedChapterId),
    [lessons, selectedChapterId],
  )

  useEffect(() => {
    if (chapterLessons.length === 0) {
      if (selectedLessonId) setSelectedLessonId("")
      return
    }
    if (!chapterLessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(chapterLessons[0].id)
    }
  }, [chapterLessons, selectedLessonId])

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  )

  useEffect(() => {
    if (!selectedLesson) return
    setEditLessonTitle(selectedLesson.title)
    setEditLessonDuration(String(selectedLesson.duration_minutes))
    setEditLessonType(selectedLesson.lesson_type)
    setEditLessonOrderIndex(String(selectedLesson.order_index))
    setEditLessonIsActive(selectedLesson.is_active)
  }, [selectedLesson])

  const lessonAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.fizica_lesson_id === selectedLessonId)
        .sort((a, b) => a.order_index - b.order_index),
    [assignments, selectedLessonId],
  )

  const lpChapterById = useMemo(
    () => new Map(lpChapters.map((chapter) => [chapter.id, chapter])),
    [lpChapters],
  )
  const lpLessonById = useMemo(
    () => new Map(lpLessons.map((lesson) => [lesson.id, lesson])),
    [lpLessons],
  )

  const assignedToCurrentLesson = useMemo(
    () => new Set(lessonAssignments.map((assignment) => assignment.learning_path_lesson_item_id)),
    [lessonAssignments],
  )

  const learningPathTree = useMemo(() => {
    const itemsByLesson = new Map<string, LearningPathLessonItem[]>()
    for (const item of lpItems) {
      const list = itemsByLesson.get(item.lesson_id) ?? []
      list.push(item)
      itemsByLesson.set(item.lesson_id, list)
    }
    for (const list of itemsByLesson.values()) {
      list.sort((a, b) => a.order_index - b.order_index)
    }

    const lessonsByChapter = new Map<string, LearningPathLesson[]>()
    for (const lesson of lpLessons) {
      const list = lessonsByChapter.get(lesson.chapter_id) ?? []
      list.push(lesson)
      lessonsByChapter.set(lesson.chapter_id, list)
    }
    for (const list of lessonsByChapter.values()) {
      list.sort((a, b) => a.order_index - b.order_index)
    }

    return [...lpChapters]
      .sort((a, b) => a.order_index - b.order_index)
      .map((chapter) => ({
        chapter,
        lessons: (lessonsByChapter.get(chapter.id) ?? []).map((lesson) => ({
          lesson,
          items: (itemsByLesson.get(lesson.id) ?? []).map((item) => ({
            item,
            label: getLearningPathItemLabel(item, lesson, chapter),
          })),
        })),
      }))
  }, [lpChapters, lpLessons, lpItems])

  const filteredLearningPathTree = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    if (!query) return learningPathTree

    return learningPathTree
      .map(({ chapter, lessons }) => {
        const chapterMatches =
          chapter.title.toLowerCase().includes(query) ||
          (chapter.slug?.toLowerCase().includes(query) ?? false)

        const filteredLessons = lessons
          .map(({ lesson, items }) => {
            const lessonMatches = lesson.title.toLowerCase().includes(query)
            const filteredItems = items.filter(
              ({ item, label }) =>
                chapterMatches ||
                lessonMatches ||
                label.toLowerCase().includes(query) ||
                item.item_type.toLowerCase().includes(query),
            )

            if (filteredItems.length === 0 && !lessonMatches && !chapterMatches) {
              return null
            }

            return {
              lesson,
              items: chapterMatches || lessonMatches ? items : filteredItems,
            }
          })
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

        if (filteredLessons.length === 0 && !chapterMatches) return null

        return { chapter, lessons: filteredLessons }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  }, [itemSearch, learningPathTree])

  useEffect(() => {
    if (!itemSearch.trim()) return

    const nextChapters = new Set<string>()
    const nextLessons = new Set<string>()
    for (const { chapter, lessons } of filteredLearningPathTree) {
      nextChapters.add(chapter.id)
      for (const { lesson } of lessons) {
        nextLessons.add(lesson.id)
      }
    }
    setExpandedLpChapters(nextChapters)
    setExpandedLpLessons(nextLessons)
  }, [filteredLearningPathTree, itemSearch])

  useEffect(() => {
    if (learningPathTree.length === 0) return
    setExpandedLpChapters((current) => {
      if (current.size > 0) return current
      return new Set(learningPathTree.map(({ chapter }) => chapter.id))
    })
  }, [learningPathTree])

  const toggleLpChapter = (chapterId: string) => {
    setExpandedLpChapters((current) => {
      const next = new Set(current)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }

  const toggleLpLesson = (lessonId: string) => {
    setExpandedLpLessons((current) => {
      const next = new Set(current)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }

  const apiRequest = useCallback(
    async (method: "POST" | "PUT" | "DELETE", body: Record<string, unknown>) => {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          setError("Sesiune invalidă.")
          return false
        }

        const response = await fetch("/api/admin/fizica-map", {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          const details =
            typeof data.details === "string" && data.details.trim()
              ? `: ${data.details}`
              : ""
          setError(`${data.error || "Operația a eșuat."}${details}`)
          return false
        }

        await refreshData()
        return true
      } catch (err) {
        console.error(err)
        setError("Eroare la salvare.")
        return false
      } finally {
        setSaving(false)
      }
    },
    [getAccessToken, refreshData],
  )

  const handleCreateChapter = async () => {
    if (!selectedRouteId || !newChapterTitle.trim()) return
    const ok = await apiRequest("POST", {
      type: "chapter",
      route_id: selectedRouteId,
      title: newChapterTitle.trim(),
      slug: newChapterSlug.trim() || undefined,
      order_index: routeChapters.length,
    })
    if (ok) {
      setNewChapterTitle("")
      setNewChapterSlug("")
      setSuccessMessage("Capitol creat.")
    }
  }

  const handleCreateLesson = async () => {
    if (!selectedChapterId || !newLessonTitle.trim()) return
    const ok = await apiRequest("POST", {
      type: "lesson",
      chapter_id: selectedChapterId,
      title: newLessonTitle.trim(),
      duration_minutes: Number.parseInt(newLessonDuration, 10) || 0,
      lesson_type: newLessonType,
      order_index: chapterLessons.length,
    })
    if (ok) {
      setNewLessonTitle("")
      setNewLessonDuration("10")
      setSuccessMessage("Lecție creată.")
    }
  }

  const handleSaveLesson = async () => {
    if (!selectedLessonId || !editLessonTitle.trim()) return
    const ok = await apiRequest("PUT", {
      type: "lesson",
      id: selectedLessonId,
      title: editLessonTitle.trim(),
      duration_minutes: Number.parseInt(editLessonDuration, 10) || 0,
      lesson_type: editLessonType,
      order_index: Number.parseInt(editLessonOrderIndex, 10) || 0,
      is_active: editLessonIsActive,
    })
    if (ok) setSuccessMessage("Lecție actualizată.")
  }

  const handleAssignItem = async (learningPathItemId: string) => {
    if (!selectedLessonId) {
      setError("Selectează mai întâi o lecție din secțiunea „Lecții” (harta fizică).")
      return
    }
    const ok = await apiRequest("POST", {
      type: "assignment",
      fizica_lesson_id: selectedLessonId,
      learning_path_lesson_item_id: learningPathItemId,
      order_index: lessonAssignments.length,
    })
    if (ok) setSuccessMessage("Item asignat.")
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    const ok = await apiRequest("DELETE", { type: "assignment", id: assignmentId })
    if (ok) setSuccessMessage("Asignare eliminată.")
  }

  const handleMoveAssignment = async (assignmentId: string, fromIndex: number, direction: "up" | "down") => {
    const neighborIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1
    if (neighborIndex < 0 || neighborIndex >= lessonAssignments.length) return

    const targetOrderIndex = lessonAssignments[neighborIndex].order_index

    const ok = await apiRequest("PUT", {
      type: "assignment",
      id: assignmentId,
      order_index: targetOrderIndex,
    })
    if (ok) setSuccessMessage("Ordinea itemilor a fost actualizată.")
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm("Ștergi capitolul și toate lecțiile lui?")) return
    const ok = await apiRequest("DELETE", { type: "chapter", id: chapterId })
    if (ok) setSuccessMessage("Capitol șters.")
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Ștergi lecția și asignările ei?")) return
    const ok = await apiRequest("DELETE", { type: "lesson", id: lessonId })
    if (ok) setSuccessMessage("Lecție ștearsă.")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-4 text-lg font-semibold">Traseu</h2>
          <Select
            value={selectedRouteId}
            onValueChange={(value) => {
              setSelectedRouteId(value)
              const firstChapter = chapters.find((chapter) => chapter.route_id === value)
              setSelectedChapterId(firstChapter?.id ?? "")
              const firstLesson = lessons.find((lesson) => lesson.chapter_id === firstChapter?.id)
              setSelectedLessonId(firstLesson?.id ?? "")
            }}
          >
            <SelectTrigger className="bg-black/40 text-white">
              <SelectValue placeholder="Alege traseu" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Capitole</h3>
            <div className="space-y-2">
              {routeChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    selectedChapterId === chapter.id
                      ? "bg-white/15 text-white"
                      : "bg-black/20 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChapterId(chapter.id)
                      const firstLesson = lessons.find((lesson) => lesson.chapter_id === chapter.id)
                      setSelectedLessonId(firstLesson?.id ?? "")
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    {chapter.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteChapter(chapter.id)}
                    className="rounded p-1 text-red-300 hover:bg-red-500/10"
                    aria-label={`Șterge ${chapter.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 p-3">
              <Label htmlFor="new-chapter-title">Capitol nou</Label>
              <Input
                id="new-chapter-title"
                value={newChapterTitle}
                onChange={(event) => setNewChapterTitle(event.target.value)}
                placeholder="Titlu capitol"
                className="bg-black/40 text-white"
              />
              <Input
                value={newChapterSlug}
                onChange={(event) => setNewChapterSlug(event.target.value)}
                placeholder="Slug (opțional)"
                className="bg-black/40 text-white"
              />
              <Button onClick={() => void handleCreateChapter()} disabled={saving} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adaugă capitol
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-1 text-lg font-semibold">Lecții</h2>
            <p className="mb-4 text-sm text-gray-400">
              Selectează lecția căreia îi asignezi itemii din learning paths.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {chapterLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`rounded-lg px-3 py-2 text-sm ring-2 ring-transparent ${
                    selectedLessonId === lesson.id
                      ? "bg-white/15 text-white ring-[#ffc800]"
                      : "bg-black/20 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  {lesson.title} · {lesson.duration_minutes}m
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label htmlFor="new-lesson-title">Titlu lecție</Label>
                <Input
                  id="new-lesson-title"
                  value={newLessonTitle}
                  onChange={(event) => setNewLessonTitle(event.target.value)}
                  className="bg-black/40 text-white"
                />
              </div>
              <div>
                <Label htmlFor="new-lesson-duration">Durată (minute)</Label>
                <Input
                  id="new-lesson-duration"
                  type="number"
                  min={0}
                  value={newLessonDuration}
                  onChange={(event) => setNewLessonDuration(event.target.value)}
                  className="bg-black/40 text-white"
                />
              </div>
              <div>
                <Label>Tip lecție</Label>
                <Select value={newLessonType} onValueChange={(value) => setNewLessonType(value as (typeof LESSON_TYPES)[number])}>
                  <SelectTrigger className="bg-black/40 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {FIZICA_LESSON_TYPE_LABEL[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void handleCreateLesson()} disabled={saving} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adaugă lecție
                </Button>
              </div>
            </div>

            {selectedLesson ? (
              <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-300">
                  Editează lecția selectată
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                  Modificările apar pe harta de la /invata/fizica.
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-lesson-title">Titlu</Label>
                    <Input
                      id="edit-lesson-title"
                      value={editLessonTitle}
                      onChange={(event) => setEditLessonTitle(event.target.value)}
                      className="bg-black/40 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lesson-duration">Durată (minute)</Label>
                    <Input
                      id="edit-lesson-duration"
                      type="number"
                      min={0}
                      value={editLessonDuration}
                      onChange={(event) => setEditLessonDuration(event.target.value)}
                      className="bg-black/40 text-white"
                    />
                  </div>
                  <div>
                    <Label>Tip lecție</Label>
                    <Select
                      value={editLessonType}
                      onValueChange={(value) => setEditLessonType(value as FizicaLessonType)}
                    >
                      <SelectTrigger className="bg-black/40 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LESSON_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {FIZICA_LESSON_TYPE_LABEL[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-lesson-order">Ordine în capitol</Label>
                    <Input
                      id="edit-lesson-order"
                      type="number"
                      min={0}
                      value={editLessonOrderIndex}
                      onChange={(event) => setEditLessonOrderIndex(event.target.value)}
                      className="bg-black/40 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                      <span className="text-sm text-gray-200">Activă pe hartă</span>
                      <Switch
                        checked={editLessonIsActive}
                        onCheckedChange={setEditLessonIsActive}
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => void handleSaveLesson()} disabled={saving || !editLessonTitle.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvează modificările
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-400/40 text-red-200 hover:bg-red-500/10"
                    onClick={() => void handleDeleteLesson(selectedLesson.id)}
                    disabled={saving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Șterge lecția
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-1 text-lg font-semibold">Itemi asignați lecției</h2>
            <p className="mb-4 text-sm text-gray-400">
              Primul item din listă este cel deschis la click pe lecție în hartă.
            </p>
            {!selectedLessonId ? (
              <p className="text-sm text-gray-400">Selectează o lecție pentru a gestiona itemii.</p>
            ) : lessonAssignments.length === 0 ? (
              <p className="text-sm text-gray-400">Niciun item asignat încă.</p>
            ) : (
              <div className="space-y-2">
                {lessonAssignments.map((assignment, index) => {
                  const item = lpItems.find((entry) => entry.id === assignment.learning_path_lesson_item_id)
                  const lesson = item ? lpLessonById.get(item.lesson_id) : undefined
                  const chapter = lesson ? lpChapterById.get(lesson.chapter_id) : undefined
                  const label = item ? getLearningPathItemLabel(item, lesson, chapter) : assignment.learning_path_lesson_item_id

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {index + 1}. {label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {chapter?.title ?? "—"} · {lesson?.title ?? "—"} · {item?.item_type ?? "item"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                          onClick={() => void handleMoveAssignment(assignment.id, index, "up")}
                          disabled={saving || index === 0}
                          aria-label="Mută itemul mai sus"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                          onClick={() => void handleMoveAssignment(assignment.id, index, "down")}
                          disabled={saving || index === lessonAssignments.length - 1}
                          aria-label="Mută itemul mai jos"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                          onClick={() => void handleRemoveAssignment(assignment.id)}
                          disabled={saving}
                          aria-label="Elimină asignarea"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Learning paths — selectează item</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Capitole → lecții → itemi. Asignează itemii la lecția selectată mai sus.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-gray-200"
                  onClick={() => {
                    setExpandedLpChapters(new Set(learningPathTree.map(({ chapter }) => chapter.id)))
                    setExpandedLpLessons(
                      new Set(
                        learningPathTree.flatMap(({ lessons }) => lessons.map(({ lesson }) => lesson.id)),
                      ),
                    )
                  }}
                >
                  Extinde tot
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-gray-200"
                  onClick={() => {
                    setExpandedLpChapters(new Set())
                    setExpandedLpLessons(new Set())
                  }}
                >
                  Restrânge tot
                </Button>
              </div>
            </div>

            <Input
              value={itemSearch}
              onChange={(event) => setItemSearch(event.target.value)}
              placeholder="Caută capitol, lecție sau item..."
              className="mb-4 bg-black/40 text-white"
            />

            {!selectedLessonId ? (
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Selectează mai întâi o lecție din secțiunea „Lecții” de mai sus.
              </p>
            ) : (
              <p className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Itemii se asignează lecției:{" "}
                <span className="font-semibold">
                  {chapterLessons.find((lesson) => lesson.id === selectedLessonId)?.title ?? "—"}
                </span>
              </p>
            )}

            <div className="max-h-[560px] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
              {filteredLearningPathTree.length === 0 ? (
                <p className="px-3 py-6 text-sm text-gray-400">Niciun rezultat pentru căutare.</p>
              ) : (
                filteredLearningPathTree.map(({ chapter, lessons }) => {
                  const chapterExpanded = expandedLpChapters.has(chapter.id)
                  const lessonCount = lessons.length
                  const itemCount = lessons.reduce((sum, entry) => sum + entry.items.length, 0)

                  return (
                    <div key={chapter.id} className="rounded-lg border border-white/10 bg-black/30">
                      <button
                        type="button"
                        onClick={() => toggleLpChapter(chapter.id)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5"
                      >
                        {chapterExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{chapter.title}</p>
                          <p className="text-xs text-gray-400">
                            {chapter.slug ? `/${chapter.slug}` : chapter.id.slice(0, 8)} · {lessonCount}{" "}
                            lecții · {itemCount} itemi
                            {!chapter.is_active ? " · inactiv" : ""}
                          </p>
                        </div>
                      </button>

                      {chapterExpanded ? (
                        <div className="space-y-1 border-t border-white/10 px-2 py-2">
                          {lessons.length === 0 ? (
                            <p className="px-2 py-2 text-xs text-gray-500">Nicio lecție în acest capitol.</p>
                          ) : (
                            lessons.map(({ lesson, items }) => {
                              const lessonExpanded = expandedLpLessons.has(lesson.id)

                              return (
                                <div key={lesson.id} className="rounded-md border border-white/5 bg-black/20">
                                  <button
                                    type="button"
                                    onClick={() => toggleLpLesson(lesson.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/5"
                                  >
                                    {lessonExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-100">{lesson.title}</p>
                                      <p className="text-xs text-gray-500">
                                        {lesson.slug ? `/${lesson.slug}` : lesson.id.slice(0, 8)} ·{" "}
                                        {items.length} itemi · {lesson.lesson_type}
                                        {!lesson.is_active ? " · inactiv" : ""}
                                      </p>
                                    </div>
                                  </button>

                                  {lessonExpanded ? (
                                    <div className="space-y-1 border-t border-white/5 px-2 py-2">
                                      {items.length === 0 ? (
                                        <p className="px-2 py-1 text-xs text-gray-500">
                                          Niciun item în această lecție.
                                        </p>
                                      ) : (
                                        items.map(({ item, label }, itemIndex) => {
                                          const alreadyAssigned = assignedToCurrentLesson.has(item.id)

                                          return (
                                            <div
                                              key={item.id}
                                              className="flex items-center justify-between gap-3 rounded-md bg-black/30 px-3 py-2"
                                            >
                                              <div className="min-w-0">
                                                <p className="text-sm text-white">
                                                  {itemIndex + 1}. {label}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {item.item_type}
                                                  {!item.is_active ? " · inactiv" : ""}
                                                </p>
                                              </div>
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant={alreadyAssigned ? "outline" : "default"}
                                                disabled={saving || !selectedLessonId || alreadyAssigned}
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  void handleAssignItem(item.id)
                                                }}
                                              >
                                                {alreadyAssigned ? "Asignat" : "Asignează"}
                                              </Button>
                                            </div>
                                          )
                                        })
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

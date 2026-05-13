"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { LearningPathChapter, LearningPathLesson, LearningPathLessonItem, LearningPathLessonType } from "@/lib/supabase-learning-paths"
import { ITEM_TYPE_LABEL, getItemIcon } from "@/components/invata/learning-path-item-body"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { TEST_ICON_OPTIONS } from "@/components/invata/test-icons"
import {
  isTestImageUrl,
  validateTestContent,
  type TestProblem,
  type TestProblemOption,
} from "@/lib/learning-path-test"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react"

type FormMode = "none" | "create-item" | "edit-item"

interface ProblemResult {
  id: string
  title: string
  difficulty: string
  category: string
  class?: number
}

interface QuizQuestionResult {
  id: string
  question_id: string
  class: number
  statement: string
  difficulty: number
  correct_answer: string
}

interface PollOption {
  id: string
  label: string
  feedback: string
}

interface ItemFormState {
  id?: string
  lesson_id: string
  item_type: LearningPathLessonType
  title: string
  order_index: number
  is_active: boolean
  cursuri_lesson_slug: string
  youtube_url: string
  quiz_question_id: string
  problem_id: string
  custom_text_body: string
  poll_image_src: string
  poll_image_alt: string
  poll_question: string
  poll_correct_answer_id: string
  poll_options: PollOption[]
  simulation_embed_url: string
  simulation_intro_markdown: string
  simulation_aspect_ratio: string
  test_icon: string
  test_description: string
  test_difficulty: number
  test_time_limit_seconds: number
  test_problems: TestProblem[]
}

const ITEM_TYPES: LearningPathLessonType[] = [
  "custom_text",
  "text",
  "video",
  "grila",
  "problem",
  "poll",
  "simulation",
  "test",
]

const MARKERS = ["FORMULA", "ENUNT", "IMPORTANT", "DEFINITIE", "EXEMPLU", "INDENT"] as const

function createPollOption(index: number): PollOption {
  const labelByIndex = ["A", "B", "C", "D", "E", "F"]
  const letter = labelByIndex[index] || `O${index + 1}`
  return {
    id: `opt_${Date.now()}_${index}`,
    label: `Varianta ${letter}`,
    feedback: "",
  }
}

function createDefaultPollOptions() {
  return [createPollOption(0), createPollOption(1)]
}

let testIdCounter = 0

function nextTestUid(prefix: string) {
  testIdCounter += 1
  return `${prefix}_${Date.now()}_${testIdCounter}`
}

function createTestProblemOption(index: number): TestProblemOption {
  const labels = ["A", "B", "C", "D"]
  const letter = labels[index] || `O${index + 1}`
  return {
    id: nextTestUid("opt"),
    label: `Varianta ${letter}`,
  }
}

function createTestProblem(): TestProblem {
  const options = [createTestProblemOption(0), createTestProblemOption(1)]
  return {
    id: nextTestUid("prob"),
    statement: "",
    imageUrl: null,
    options,
    correctOptionId: options[0].id,
  }
}

function parseTestProblemsForForm(value: unknown): TestProblem[] {
  if (!Array.isArray(value)) return []
  const problems: TestProblem[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue
    const record = entry as Record<string, unknown>
    const id = typeof record.id === "string" ? record.id.trim() : ""
    const statement = typeof record.statement === "string" ? record.statement : ""
    const correctOptionId =
      typeof record.correctOptionId === "string" ? record.correctOptionId : ""
    const rawOptions = Array.isArray(record.options) ? record.options : []
    const options: TestProblemOption[] = []
    for (const opt of rawOptions) {
      if (!opt || typeof opt !== "object") continue
      const optRecord = opt as Record<string, unknown>
      const optId = typeof optRecord.id === "string" ? optRecord.id.trim() : ""
      const label = typeof optRecord.label === "string" ? optRecord.label : ""
      if (!optId) continue
      options.push({ id: optId, label })
    }
    if (!id || options.length < 2) continue
    const imageUrlRaw = typeof record.imageUrl === "string" ? record.imageUrl.trim() : ""
    const imageUrl = imageUrlRaw ? imageUrlRaw : null
    problems.push({
      id,
      statement,
      imageUrl,
      options,
      correctOptionId: correctOptionId || options[0]?.id || "",
    })
  }
  return problems
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function parsePollOptions(value: unknown): PollOption[] {
  if (!Array.isArray(value)) return createDefaultPollOptions()
  const parsed = value
    .map((entry) => {
      const record = toRecord(entry)
      if (!record) return null
      const id = toStringSafe(record.id).trim()
      const label = toStringSafe(record.label)
      const feedback = toStringSafe(record.feedback)
      if (!id || !label.trim()) return null
      return { id, label, feedback }
    })
    .filter(Boolean) as PollOption[]

  return parsed.length > 0 ? parsed : createDefaultPollOptions()
}

function createEmptyForm(lessonId: string, nextOrderIndex: number): ItemFormState {
  const options = createDefaultPollOptions()
  return {
    lesson_id: lessonId,
    item_type: "custom_text",
    title: "",
    order_index: nextOrderIndex,
    is_active: true,
    cursuri_lesson_slug: "",
    youtube_url: "",
    quiz_question_id: "",
    problem_id: "",
    custom_text_body: "",
    poll_image_src: "",
    poll_image_alt: "",
    poll_question: "",
    poll_correct_answer_id: options[0]?.id || "",
    poll_options: options,
    simulation_embed_url: "",
    simulation_intro_markdown: "",
    simulation_aspect_ratio: "16/9",
    test_icon: "ClipboardList",
    test_description: "",
    test_difficulty: 3,
    test_time_limit_seconds: 600,
    test_problems: [createTestProblem()],
  }
}

function createFormFromItem(item: LearningPathLessonItem): ItemFormState {
  const content = toRecord(item.content_json ?? null)
  const pollOptions = parsePollOptions(content?.options)
  const pollCorrectAnswerId = toStringSafe(content?.correctAnswerId) || pollOptions[0]?.id || ""
  const testProblems =
    item.item_type === "test" ? parseTestProblemsForForm(content?.problems) : []
  const testDifficultyRaw =
    typeof content?.difficulty === "number" ? Math.floor(content.difficulty) : 3
  const testDifficulty = Math.min(5, Math.max(1, testDifficultyRaw))
  const testTimeRaw =
    typeof content?.timeLimitSeconds === "number"
      ? Math.floor(content.timeLimitSeconds)
      : 600
  const testTime = Math.min(4 * 60 * 60, Math.max(30, testTimeRaw))

  return {
    id: item.id,
    lesson_id: item.lesson_id,
    item_type: item.item_type,
    title: item.title || "",
    order_index: item.order_index,
    is_active: item.is_active,
    cursuri_lesson_slug: item.cursuri_lesson_slug || "",
    youtube_url: item.youtube_url || "",
    quiz_question_id: item.quiz_question_id || "",
    problem_id: item.problem_id || "",
    custom_text_body: toStringSafe(content?.body),
    poll_image_src: toStringSafe(content?.imageSrc),
    poll_image_alt: toStringSafe(content?.imageAlt),
    poll_question: toStringSafe(content?.question),
    poll_correct_answer_id: pollCorrectAnswerId,
    poll_options: pollOptions,
    simulation_embed_url: toStringSafe(content?.embedUrl),
    simulation_intro_markdown: toStringSafe(content?.introMarkdown),
    simulation_aspect_ratio: toStringSafe(content?.aspectRatio) || "16/9",
    test_icon: toStringSafe(content?.icon) || "ClipboardList",
    test_description: toStringSafe(content?.description),
    test_difficulty: testDifficulty,
    test_time_limit_seconds: testTime,
    test_problems: testProblems.length > 0 ? testProblems : [createTestProblem()],
  }
}

function normalizeNullable(value: string): string | null {
  const normalized = value.trim()
  return normalized ? normalized : null
}

function validateSimulationUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === "https:") return true
    const isLocalDev = process.env.NODE_ENV !== "production"
    const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
    return isLocalDev && isLocalHost && parsed.protocol === "http:"
  } catch {
    return false
  }
}

export function LearningPathsManager() {
  const [chapters, setChapters] = useState<LearningPathChapter[]>([])
  const [lessons, setLessons] = useState<LearningPathLesson[]>([])
  const [items, setItems] = useState<LearningPathLessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>("none")
  const [form, setForm] = useState<ItemFormState | null>(null)

  const [problemSearch, setProblemSearch] = useState("")
  const [problemResults, setProblemResults] = useState<ProblemResult[]>([])
  const [problemLoading, setProblemLoading] = useState(false)
  const [quizSearch, setQuizSearch] = useState("")
  const [quizClass, setQuizClass] = useState<string>("")
  const [quizResults, setQuizResults] = useState<QuizQuestionResult[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [previewCustomText, setPreviewCustomText] = useState(false)
  const [previewSimulationIntro, setPreviewSimulationIntro] = useState(false)

  const customTextRef = useRef<HTMLTextAreaElement>(null)
  const simulationIntroRef = useRef<HTMLTextAreaElement>(null)

  const getAccessToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token || null
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune expirată. Reîncarcă pagina.")
        return
      }

      const response = await fetch("/api/admin/learning-paths", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut încărca datele.")
      }

      const data = await response.json()
      setChapters(data.chapters || [])
      setLessons(data.lessons || [])
      setItems(data.items || [])

      const chapterIds = new Set((data.chapters || []).map((chapter: LearningPathChapter) => chapter.id))
      setExpandedChapters(chapterIds)
    } catch (err: any) {
      setError(err.message || "Eroare la încărcarea datelor.")
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.order_index - b.order_index), [chapters])

  useEffect(() => {
    if (!selectedLessonId && lessons.length > 0) {
      setSelectedLessonId(lessons[0].id)
      return
    }

    if (selectedLessonId && !lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(lessons[0]?.id ?? null)
      setFormMode("none")
      setForm(null)
    }
  }, [lessons, selectedLessonId])

  const getLessonsForChapter = useCallback(
    (chapterId: string) => lessons.filter((lesson) => lesson.chapter_id === chapterId).sort((a, b) => a.order_index - b.order_index),
    [lessons]
  )

  const getItemsForLesson = useCallback(
    (lessonId: string) => items.filter((item) => item.lesson_id === lessonId).sort((a, b) => a.order_index - b.order_index),
    [items]
  )

  const selectedLesson = useMemo(() => lessons.find((lesson) => lesson.id === selectedLessonId) || null, [lessons, selectedLessonId])
  const selectedChapter = useMemo(() => {
    if (!selectedLesson) return null
    return chapters.find((chapter) => chapter.id === selectedLesson.chapter_id) || null
  }, [chapters, selectedLesson])
  const selectedLessonItems = useMemo(() => {
    if (!selectedLessonId) return []
    return getItemsForLesson(selectedLessonId)
  }, [getItemsForLesson, selectedLessonId])

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }

  const openCreateItem = (lessonId: string) => {
    const lessonItems = getItemsForLesson(lessonId)
    const nextOrderIndex = lessonItems.length ? Math.max(...lessonItems.map((item) => item.order_index)) + 1 : 0
    setSelectedLessonId(lessonId)
    setForm(createEmptyForm(lessonId, nextOrderIndex))
    setFormMode("create-item")
    setError(null)
  }

  /** Inserează la poziția dată; API-ul mută automat order_index pentru itemii existenți cu index >= țintă. */
  const openCreateItemAtOrderIndex = (lessonId: string, targetOrderIndex: number) => {
    setSelectedLessonId(lessonId)
    setForm(createEmptyForm(lessonId, targetOrderIndex))
    setFormMode("create-item")
    setError(null)
  }

  const openEditItem = (item: LearningPathLessonItem) => {
    setSelectedLessonId(item.lesson_id)
    setForm(createFormFromItem(item))
    setFormMode("edit-item")
    setError(null)
  }

  const resetForm = () => {
    setFormMode("none")
    setForm(null)
    setProblemSearch("")
    setProblemResults([])
    setQuizSearch("")
    setQuizClass("")
    setQuizResults([])
    setPreviewCustomText(false)
    setPreviewSimulationIntro(false)
  }

  const updateForm = <K extends keyof ItemFormState>(key: K, value: ItemFormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const insertIntoField = (field: "custom_text_body" | "simulation_intro_markdown", text: string, selectOffset = 0, selectLength = 0) => {
    const targetRef = field === "custom_text_body" ? customTextRef : simulationIntroRef
    const textarea = targetRef.current
    if (!form || !textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = form[field]
    const nextValue = current.slice(0, start) + text + current.slice(end)
    updateForm(field, nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const selectionStart = start + selectOffset
      const selectionEnd = selectionStart + selectLength
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  const insertMarker = (field: "custom_text_body" | "simulation_intro_markdown", marker: (typeof MARKERS)[number]) => {
    const targetRef = field === "custom_text_body" ? customTextRef : simulationIntroRef
    const textarea = targetRef.current
    if (!form || !textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = form[field].slice(start, end)
    const insertion = `[${marker}]${selectedText || "..."}[/${marker}]`
    const placeholderOffset = selectedText ? insertion.length : `[${marker}]`.length
    const placeholderLength = selectedText ? 0 : 3
    insertIntoField(field, insertion, placeholderOffset, placeholderLength)
  }

  const insertInlineLatex = (field: "custom_text_body" | "simulation_intro_markdown") => {
    insertIntoField(field, "$...$", 1, 3)
  }

  const insertBlockLatex = (field: "custom_text_body" | "simulation_intro_markdown") => {
    insertIntoField(field, "$$...$$", 2, 3)
  }

  const validateForm = (currentForm: ItemFormState): string | null => {
    if (!currentForm.lesson_id) return "Selectează o lecție."

    switch (currentForm.item_type) {
      case "custom_text":
        if (!currentForm.custom_text_body.trim()) return "Conținutul pentru text personalizat este obligatoriu."
        break
      case "text":
        if (!currentForm.cursuri_lesson_slug.trim()) return "Slug-ul lecției din /cursuri este obligatoriu."
        break
      case "video":
        if (!currentForm.youtube_url.trim()) return "URL-ul YouTube este obligatoriu."
        break
      case "grila":
        if (!currentForm.quiz_question_id.trim()) return "Selectează o întrebare grilă."
        break
      case "problem":
        if (!currentForm.problem_id.trim()) return "Selectează o problemă."
        break
      case "poll":
        if (!currentForm.poll_question.trim()) return "Întrebarea pentru poll este obligatorie."
        if (currentForm.poll_options.length < 2) return "Poll-ul trebuie să aibă cel puțin 2 opțiuni."
        if (!currentForm.poll_correct_answer_id.trim()) return "Selectează răspunsul corect pentru poll."
        if (!currentForm.poll_options.some((option) => option.id === currentForm.poll_correct_answer_id)) {
          return "Răspunsul corect selectat nu există în lista de opțiuni."
        }
        break
      case "simulation":
        if (!currentForm.simulation_embed_url.trim()) return "Embed URL este obligatoriu pentru simulare."
        if (!validateSimulationUrl(currentForm.simulation_embed_url.trim())) {
          return "Embed URL pentru simulare trebuie să fie HTTPS valid (sau http://localhost în development)."
        }
        break
      case "test": {
        if (currentForm.test_problems.length === 0) {
          return "Testul trebuie să aibă cel puțin o problemă."
        }
        if (currentForm.test_difficulty < 1 || currentForm.test_difficulty > 5) {
          return "Dificultatea testului trebuie să fie între 1 și 5."
        }
        if (currentForm.test_time_limit_seconds < 30) {
          return "Timpul testului trebuie să fie de minim 30 de secunde."
        }
        const payloadForValidation = {
          icon: currentForm.test_icon,
          description: currentForm.test_description,
          difficulty: currentForm.test_difficulty,
          timeLimitSeconds: currentForm.test_time_limit_seconds,
          problems: currentForm.test_problems,
        }
        const testError = validateTestContent(payloadForValidation)
        if (testError) return testError
        break
      }
    }

    return null
  }

  const buildItemPayload = (currentForm: ItemFormState) => {
    const payload: Record<string, unknown> = {
      type: "item",
      lesson_id: currentForm.lesson_id,
      item_type: currentForm.item_type,
      title: normalizeNullable(currentForm.title),
      order_index: currentForm.order_index,
      is_active: currentForm.is_active,
    }

    if (currentForm.id) payload.id = currentForm.id

    switch (currentForm.item_type) {
      case "custom_text":
        payload.content_json = { body: currentForm.custom_text_body }
        payload.cursuri_lesson_slug = null
        payload.youtube_url = null
        payload.quiz_question_id = null
        payload.problem_id = null
        break
      case "text":
        payload.cursuri_lesson_slug = normalizeNullable(currentForm.cursuri_lesson_slug)
        payload.youtube_url = null
        payload.quiz_question_id = null
        payload.problem_id = null
        payload.content_json = null
        break
      case "video":
        payload.youtube_url = normalizeNullable(currentForm.youtube_url)
        payload.cursuri_lesson_slug = null
        payload.quiz_question_id = null
        payload.problem_id = null
        payload.content_json = null
        break
      case "grila":
        payload.quiz_question_id = normalizeNullable(currentForm.quiz_question_id)
        payload.cursuri_lesson_slug = null
        payload.youtube_url = null
        payload.problem_id = null
        payload.content_json = null
        break
      case "problem":
        payload.problem_id = normalizeNullable(currentForm.problem_id)
        payload.cursuri_lesson_slug = null
        payload.youtube_url = null
        payload.quiz_question_id = null
        payload.content_json = null
        break
      case "poll": {
        const pollImageSrc = currentForm.poll_image_src.trim()
        const pollImageAlt = currentForm.poll_image_alt.trim()
        payload.content_json = {
          question: currentForm.poll_question,
          correctAnswerId: currentForm.poll_correct_answer_id,
          options: currentForm.poll_options.map((option) => ({
            id: option.id,
            label: option.label,
            feedback: option.feedback,
          })),
        }
        if (pollImageSrc) {
          ;(payload.content_json as Record<string, unknown>).imageSrc = pollImageSrc
          ;(payload.content_json as Record<string, unknown>).imageAlt = pollImageAlt
        }
        payload.cursuri_lesson_slug = null
        payload.youtube_url = null
        payload.quiz_question_id = null
        payload.problem_id = null
        break
      }
      case "simulation":
        payload.content_json = {
          embedUrl: currentForm.simulation_embed_url.trim(),
          introMarkdown: normalizeNullable(currentForm.simulation_intro_markdown),
          aspectRatio: normalizeNullable(currentForm.simulation_aspect_ratio),
        }
        payload.cursuri_lesson_slug = null
        payload.youtube_url = null
        payload.quiz_question_id = null
        payload.problem_id = null
        break
      case "test":
        payload.content_json = {
          icon: currentForm.test_icon || null,
          description: currentForm.test_description,
          difficulty: currentForm.test_difficulty,
          timeLimitSeconds: currentForm.test_time_limit_seconds,
          problems: currentForm.test_problems.map((problem) => ({
            id: problem.id,
            statement: problem.statement,
            imageUrl: problem.imageUrl ?? null,
            options: problem.options.map((option) => ({
              id: option.id,
              label: option.label,
            })),
            correctOptionId: problem.correctOptionId,
          })),
        }
        payload.cursuri_lesson_slug = null
        payload.youtube_url = null
        payload.quiz_question_id = null
        payload.problem_id = null
        break
    }

    return payload
  }

  const handleSaveItem = async () => {
    if (!form) return

    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError(null)
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Sesiune expirată.")

      const method = form.id ? "PUT" : "POST"
      const response = await fetch("/api/admin/learning-paths", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(buildItemPayload(form)),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut salva itemul.")
      }

      setSuccessMessage(form.id ? "Item actualizat cu succes." : "Item creat cu succes.")
      setTimeout(() => setSuccessMessage(null), 3000)
      await fetchData()
      resetForm()
    } catch (err: any) {
      setError(err.message || "Eroare la salvarea itemului.")
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (itemId: string, hardDelete = false) => {
    const confirmed = window.confirm(
      hardDelete
        ? "Sigur vrei să ștergi definitiv acest item?"
        : "Sigur vrei să dezactivezi acest item? Va putea fi recuperat din DB."
    )
    if (!confirmed) return

    try {
      setSaving(true)
      setError(null)
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Sesiune expirată.")

      const response = await fetch("/api/admin/learning-paths", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ type: "item", id: itemId, hard: hardDelete }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut șterge itemul.")
      }

      setSuccessMessage(hardDelete ? "Item șters definitiv." : "Item dezactivat.")
      setTimeout(() => setSuccessMessage(null), 3000)
      await fetchData()
      if (form?.id === itemId) {
        resetForm()
      }
    } catch (err: any) {
      setError(err.message || "Eroare la ștergere.")
    } finally {
      setSaving(false)
    }
  }

  const moveItem = async (itemId: string, direction: "up" | "down") => {
    if (!selectedLessonId) return
    const lessonItems = getItemsForLesson(selectedLessonId)
    const index = lessonItems.findIndex((item) => item.id === itemId)
    if (index < 0) return

    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= lessonItems.length) return

    const current = lessonItems[index]
    const target = lessonItems[targetIndex]

    try {
      setSaving(true)
      setError(null)
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Sesiune expirată.")

      const requests = [
        fetch("/api/admin/learning-paths", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            type: "item",
            id: current.id,
            order_index: target.order_index,
          }),
        }),
        fetch("/api/admin/learning-paths", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            type: "item",
            id: target.id,
            order_index: current.order_index,
          }),
        }),
      ]

      const responses = await Promise.all(requests)
      const failed = responses.find((res) => !res.ok)
      if (failed) {
        const failedBody = await failed.json()
        throw new Error(failedBody.error || "Nu am putut reordona itemii.")
      }

      await fetchData()
    } catch (err: any) {
      setError(err.message || "Eroare la reordonare.")
    } finally {
      setSaving(false)
    }
  }

  const fetchProblems = useCallback(async () => {
    if (!form || form.item_type !== "problem") return

    try {
      setProblemLoading(true)
      const accessToken = await getAccessToken()
      if (!accessToken) return

      const params = new URLSearchParams()
      if (problemSearch.trim()) {
        params.set("search", problemSearch.trim())
      }

      const response = await fetch(`/api/admin/problems?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut încărca problemele.")
      }

      const data = await response.json()
      setProblemResults(data.problems || [])
    } catch (err: any) {
      setError(err.message || "Eroare la căutarea problemelor.")
    } finally {
      setProblemLoading(false)
    }
  }, [form, getAccessToken, problemSearch])

  const fetchQuizQuestions = useCallback(async () => {
    if (!form || form.item_type !== "grila") return

    try {
      setQuizLoading(true)
      const accessToken = await getAccessToken()
      if (!accessToken) return

      const params = new URLSearchParams()
      params.set("action", "quiz-questions")
      if (quizSearch.trim()) {
        params.set("search", quizSearch.trim())
      }
      if (quizClass.trim()) {
        params.set("class", quizClass.trim())
      }

      const response = await fetch(`/api/admin/learning-paths?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Nu am putut încărca întrebările grilă.")
      }

      const data = await response.json()
      setQuizResults(data.quizQuestions || [])
    } catch (err: any) {
      setError(err.message || "Eroare la căutarea întrebărilor grilă.")
    } finally {
      setQuizLoading(false)
    }
  }, [form, getAccessToken, quizClass, quizSearch])

  useEffect(() => {
    if (!form || form.item_type !== "problem") return
    const timer = setTimeout(() => {
      fetchProblems()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchProblems, form, problemSearch])

  useEffect(() => {
    if (!form || form.item_type !== "grila") return
    const timer = setTimeout(() => {
      fetchQuizQuestions()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchQuizQuestions, form, quizClass, quizSearch])

  const renderMarkerToolbar = (field: "custom_text_body" | "simulation_intro_markdown") => (
    <div className="flex flex-wrap gap-2">
      {MARKERS.map((marker) => (
        <Button
          key={marker}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertMarker(field, marker)}
          className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
        >
          [{marker}]
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertInlineLatex(field)}
        className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
      >
        LaTeX $
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => insertBlockLatex(field)}
        className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
      >
        LaTeX $$
      </Button>
    </div>
  )

  const renderTypeSpecificFields = () => {
    if (!form) return null

    if (form.item_type === "custom_text") {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Conținut text personalizat</p>
          {renderMarkerToolbar("custom_text_body")}
          <Textarea
            ref={customTextRef}
            value={form.custom_text_body}
            onChange={(e) => updateForm("custom_text_body", e.target.value)}
            rows={14}
            placeholder="Scrie textul itemului aici. Suportă [FORMULA], [IMPORTANT], markdown și LaTeX."
            className="font-mono bg-black/40 border-white/20 text-gray-100"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewCustomText((prev) => !prev)}
            className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
          >
            {previewCustomText ? "Ascunde preview" : "Arată preview"}
          </Button>
          {previewCustomText && (
            <div className="rounded-lg border border-white/15 bg-white p-4">
              <LessonRichContent content={form.custom_text_body} theme="light" />
            </div>
          )}
        </div>
      )
    }

    if (form.item_type === "text") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Lecție text din /cursuri</p>
          <Input
            value={form.cursuri_lesson_slug}
            onChange={(e) => updateForm("cursuri_lesson_slug", e.target.value)}
            placeholder="slug-lectie-cursuri"
            className="bg-black/40 border-white/20 text-gray-100"
          />
        </div>
      )
    }

    if (form.item_type === "video") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Video YouTube</p>
          <Input
            value={form.youtube_url}
            onChange={(e) => updateForm("youtube_url", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-black/40 border-white/20 text-gray-100"
          />
        </div>
      )
    }

    if (form.item_type === "problem") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              value={problemSearch}
              onChange={(e) => setProblemSearch(e.target.value)}
              placeholder="Caută problemă după titlu"
              className="bg-black/40 border-white/20 text-gray-100"
            />
          </div>

          {form.problem_id && (
            <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <span>Problem ID selectat: {form.problem_id}</span>
              <button type="button" onClick={() => updateForm("problem_id", "")}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-white/10 p-2">
            {problemLoading ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Se caută probleme...
              </div>
            ) : problemResults.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">Nu există rezultate.</div>
            ) : (
              problemResults.map((problem) => (
                <button
                  key={problem.id}
                  type="button"
                  onClick={() => updateForm("problem_id", problem.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    form.problem_id === problem.id
                      ? "border-emerald-500/70 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{problem.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {problem.id} | Dificultate: {problem.difficulty} | Clasa: {problem.class ?? "-"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )
    }

    if (form.item_type === "grila") {
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              placeholder="Caută întrebare grilă după enunț sau question_id"
              className="bg-black/40 border-white/20 text-gray-100"
            />
            <select
              value={quizClass}
              onChange={(e) => setQuizClass(e.target.value)}
              className="rounded-md border border-white/20 bg-black/40 px-3 text-sm text-gray-100"
            >
              <option value="">Toate clasele</option>
              <option value="9">Clasa 9</option>
              <option value="10">Clasa 10</option>
              <option value="11">Clasa 11</option>
              <option value="12">Clasa 12</option>
            </select>
          </div>

          {form.quiz_question_id && (
            <div className="flex items-center justify-between rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              <span>Quiz question ID selectat: {form.quiz_question_id}</span>
              <button type="button" onClick={() => updateForm("quiz_question_id", "")}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-white/10 p-2">
            {quizLoading ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                Se caută întrebări...
              </div>
            ) : quizResults.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">Nu există rezultate.</div>
            ) : (
              quizResults.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => updateForm("quiz_question_id", question.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    form.quiz_question_id === question.id
                      ? "border-cyan-500/70 bg-cyan-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm font-semibold text-white line-clamp-2">{question.statement}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {question.id} | QID: {question.question_id} | Clasa: {question.class}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )
    }

    if (form.item_type === "poll") {
      return (
        <div className="space-y-3">
          <Input
            value={form.poll_image_src}
            onChange={(e) => updateForm("poll_image_src", e.target.value)}
            placeholder="URL imagine (opțional)"
            className="bg-black/40 border-white/20 text-gray-100"
          />
          <Input
            value={form.poll_image_alt}
            onChange={(e) => updateForm("poll_image_alt", e.target.value)}
            placeholder="Alt text imagine (opțional)"
            className="bg-black/40 border-white/20 text-gray-100"
          />
          <Textarea
            value={form.poll_question}
            onChange={(e) => updateForm("poll_question", e.target.value)}
            rows={3}
            placeholder="Întrebarea pentru sondaj"
            className="bg-black/40 border-white/20 text-gray-100"
          />

          <div className="space-y-2">
            {form.poll_options.map((option, index) => (
              <div key={option.id} className="rounded-md border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-300">Opțiunea {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOptions = form.poll_options.filter((current) => current.id !== option.id)
                      updateForm("poll_options", nextOptions)
                      if (form.poll_correct_answer_id === option.id) {
                        updateForm("poll_correct_answer_id", nextOptions[0]?.id || "")
                      }
                    }}
                    className="text-gray-400 hover:text-red-300 disabled:opacity-50"
                    disabled={form.poll_options.length <= 2}
                    title="Șterge opțiunea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={option.id}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    const nextOptions = form.poll_options.map((current) =>
                      current.id === option.id ? { ...current, id: nextValue } : current
                    )
                    updateForm("poll_options", nextOptions)
                    if (form.poll_correct_answer_id === option.id) {
                      updateForm("poll_correct_answer_id", nextValue)
                    }
                  }}
                  placeholder="ID opțiune (ex: opt_a)"
                  className="bg-black/40 border-white/20 text-gray-100"
                />
                <Input
                  value={option.label}
                  onChange={(e) => {
                    const nextOptions = form.poll_options.map((current) =>
                      current.id === option.id ? { ...current, label: e.target.value } : current
                    )
                    updateForm("poll_options", nextOptions)
                  }}
                  placeholder="Label opțiune"
                  className="bg-black/40 border-white/20 text-gray-100"
                />
                <Textarea
                  value={option.feedback}
                  onChange={(e) => {
                    const nextOptions = form.poll_options.map((current) =>
                      current.id === option.id ? { ...current, feedback: e.target.value } : current
                    )
                    updateForm("poll_options", nextOptions)
                  }}
                  rows={2}
                  placeholder="Feedback după selectare"
                  className="bg-black/40 border-white/20 text-gray-100"
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const nextOptions = [...form.poll_options, createPollOption(form.poll_options.length)]
                updateForm("poll_options", nextOptions)
                if (!form.poll_correct_answer_id) {
                  updateForm("poll_correct_answer_id", nextOptions[0]?.id || "")
                }
              }}
              className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adaugă opțiune
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-300">Răspuns corect</p>
            <select
              value={form.poll_correct_answer_id}
              onChange={(e) => updateForm("poll_correct_answer_id", e.target.value)}
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100"
            >
              <option value="">Selectează opțiunea corectă</option>
              {form.poll_options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.id} - {option.label || "Fără label"}
                </option>
              ))}
            </select>
          </div>
        </div>
      )
    }

    if (form.item_type === "test") {
      const updateProblem = (problemId: string, updater: (problem: TestProblem) => TestProblem) => {
        const next = form.test_problems.map((problem) =>
          problem.id === problemId ? updater(problem) : problem
        )
        updateForm("test_problems", next)
      }

      const removeProblem = (problemId: string) => {
        const next = form.test_problems.filter((problem) => problem.id !== problemId)
        updateForm("test_problems", next)
      }

      const minutes = Math.floor(form.test_time_limit_seconds / 60)
      const seconds = form.test_time_limit_seconds % 60

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-300">Icon</p>
              <select
                value={form.test_icon}
                onChange={(e) => updateForm("test_icon", e.target.value)}
                className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100"
              >
                {TEST_ICON_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id} - {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-300">Dificultate (1-5)</p>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.test_difficulty}
                onChange={(e) =>
                  updateForm(
                    "test_difficulty",
                    Math.min(5, Math.max(1, Number.parseInt(e.target.value || "1", 10)))
                  )
                }
                className="bg-black/40 border-white/20 text-gray-100"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-300">Timp rezolvare</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={240}
                  value={minutes}
                  onChange={(e) => {
                    const nextMinutes = Math.max(0, Number.parseInt(e.target.value || "0", 10))
                    updateForm(
                      "test_time_limit_seconds",
                      Math.max(30, nextMinutes * 60 + seconds)
                    )
                  }}
                  className="bg-black/40 border-white/20 text-gray-100"
                  placeholder="min"
                />
                <span className="text-xs text-gray-400">min</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={(e) => {
                    const nextSeconds = Math.max(
                      0,
                      Math.min(59, Number.parseInt(e.target.value || "0", 10))
                    )
                    updateForm(
                      "test_time_limit_seconds",
                      Math.max(30, minutes * 60 + nextSeconds)
                    )
                  }}
                  className="bg-black/40 border-white/20 text-gray-100"
                  placeholder="sec"
                />
                <span className="text-xs text-gray-400">sec</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-300">Descriere test (afișată în pop-up)</p>
            <Textarea
              value={form.test_description}
              onChange={(e) => updateForm("test_description", e.target.value)}
              rows={3}
              placeholder="Descriere scurtă pentru pop-up. Suportă markdown / [FORMULA] / LaTeX."
              className="bg-black/40 border-white/20 text-gray-100"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Probleme ({form.test_problems.length})
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateForm("test_problems", [...form.test_problems, createTestProblem()])
                }
                className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adaugă problemă
              </Button>
            </div>

            {form.test_problems.map((problem, problemIndex) => {
              const imageInvalid =
                !!problem.imageUrl && problem.imageUrl.trim() !== "" && !isTestImageUrl(problem.imageUrl)
              return (
                <div
                  key={problem.id}
                  className="rounded-md border border-white/10 bg-white/5 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-300">Problema {problemIndex + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeProblem(problem.id)}
                      className="text-gray-400 hover:text-red-300 disabled:opacity-50"
                      disabled={form.test_problems.length <= 1}
                      title="Șterge problema"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Textarea
                    value={problem.statement}
                    onChange={(e) =>
                      updateProblem(problem.id, (current) => ({
                        ...current,
                        statement: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Enunțul problemei"
                    className="bg-black/40 border-white/20 text-gray-100"
                  />

                  <div className="space-y-1">
                    <Input
                      value={problem.imageUrl ?? ""}
                      onChange={(e) =>
                        updateProblem(problem.id, (current) => ({
                          ...current,
                          imageUrl: e.target.value.trim() ? e.target.value.trim() : null,
                        }))
                      }
                      placeholder="URL imagine (opțional, https://...)"
                      className="bg-black/40 border-white/20 text-gray-100"
                    />
                    {imageInvalid ? (
                      <p className="text-[11px] text-red-300">URL-ul nu este valid (folosește http(s) sau lasă gol).</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {problem.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-2 sm:flex-row sm:items-center"
                      >
                        <input
                          type="radio"
                          name={`correct_${problem.id}`}
                          checked={problem.correctOptionId === option.id}
                          onChange={() =>
                            updateProblem(problem.id, (current) => ({
                              ...current,
                              correctOptionId: option.id,
                            }))
                          }
                          className="h-4 w-4 cursor-pointer accent-emerald-500"
                          title="Variantă corectă"
                        />
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            updateProblem(problem.id, (current) => ({
                              ...current,
                              options: current.options.map((current_option) =>
                                current_option.id === option.id
                                  ? { ...current_option, label: e.target.value }
                                  : current_option
                              ),
                            }))
                          }
                          placeholder={`Varianta ${optionIndex + 1}`}
                          className="bg-black/40 border-white/20 text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateProblem(problem.id, (current) => {
                              const nextOptions = current.options.filter(
                                (current_option) => current_option.id !== option.id
                              )
                              return {
                                ...current,
                                options: nextOptions,
                                correctOptionId:
                                  current.correctOptionId === option.id
                                    ? nextOptions[0]?.id || ""
                                    : current.correctOptionId,
                              }
                            })
                          }
                          disabled={problem.options.length <= 2}
                          className="text-gray-400 hover:text-red-300 disabled:opacity-30"
                          title="Șterge varianta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={problem.options.length >= 4}
                      onClick={() =>
                        updateProblem(problem.id, (current) => ({
                          ...current,
                          options: [
                            ...current.options,
                            createTestProblemOption(current.options.length),
                          ],
                        }))
                      }
                      className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adaugă variantă (max 4)
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (form.item_type === "simulation") {
      return (
        <div className="space-y-3">
          <Input
            value={form.simulation_embed_url}
            onChange={(e) => updateForm("simulation_embed_url", e.target.value)}
            placeholder="https://..."
            className="bg-black/40 border-white/20 text-gray-100"
          />
          <Input
            value={form.simulation_aspect_ratio}
            onChange={(e) => updateForm("simulation_aspect_ratio", e.target.value)}
            placeholder="16/9"
            className="bg-black/40 border-white/20 text-gray-100"
          />
          <p className="text-xs text-gray-400">Intro opțional deasupra simulării</p>
          {renderMarkerToolbar("simulation_intro_markdown")}
          <Textarea
            ref={simulationIntroRef}
            value={form.simulation_intro_markdown}
            onChange={(e) => updateForm("simulation_intro_markdown", e.target.value)}
            rows={8}
            placeholder="Text introductiv (opțional) cu aceiași marcatori ca în lecții."
            className="font-mono bg-black/40 border-white/20 text-gray-100"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewSimulationIntro((prev) => !prev)}
            className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
          >
            {previewSimulationIntro ? "Ascunde preview intro" : "Arată preview intro"}
          </Button>
          {previewSimulationIntro && (
            <div className="rounded-lg border border-white/15 bg-white p-4">
              <LessonRichContent content={form.simulation_intro_markdown} theme="light" />
            </div>
          )}
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)]">
      <aside className="w-full lg:w-[420px] flex-shrink-0">
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Structură learning paths</h3>
          </div>

          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            {sortedChapters.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm text-center">Nu există capitole.</div>
            ) : (
              sortedChapters.map((chapter) => {
                const chapterLessons = getLessonsForChapter(chapter.id)
                const isExpanded = expandedChapters.has(chapter.id)
                return (
                  <div key={chapter.id} className="border-b border-white/10 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <BookOpen className="w-4 h-4 text-purple-300" />
                      <span className={`flex-1 text-sm ${chapter.is_active ? "text-white" : "text-gray-500 line-through"}`}>
                        {chapter.title}
                      </span>
                      {!chapter.is_active ? <EyeOff className="w-3.5 h-3.5 text-gray-500" /> : <Eye className="w-3.5 h-3.5 text-gray-500" />}
                      <span className="text-xs text-gray-500">{chapterLessons.length}</span>
                    </button>

                    {isExpanded && (
                      <div className="bg-white/[0.02]">
                        {chapterLessons.length === 0 ? (
                          <div className="pl-10 pr-4 py-2 text-xs text-gray-500 italic">Nicio lecție</div>
                        ) : (
                          chapterLessons.map((lesson) => {
                            const lessonItems = getItemsForLesson(lesson.id)
                            const selected = selectedLessonId === lesson.id
                            return (
                              <div
                                key={lesson.id}
                                className={`group flex items-center gap-2 pl-9 pr-3 py-2 cursor-pointer transition-colors ${
                                  selected ? "bg-violet-500/15 border-l-2 border-violet-400" : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedLessonId(lesson.id)
                                  setFormMode("none")
                                  setForm(null)
                                }}
                              >
                                <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className={`text-xs flex-1 truncate ${lesson.is_active ? "text-gray-200" : "text-gray-500 line-through"}`}>
                                  {lesson.title}
                                </span>
                                <span className="text-[10px] text-gray-500">{lessonItems.length}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-gray-200 hover:text-green-300 hover:bg-green-500/10 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openCreateItem(lesson.id)
                                  }}
                                  title="Adaugă item"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
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
      </aside>

      <section className="flex-1 min-w-0">
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">{successMessage}</div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-white/5 p-5">
          {!selectedLesson ? (
            <div className="text-center py-16 text-gray-400">
              Selectează o lecție din panoul din stânga pentru a gestiona itemii.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">{selectedChapter?.title || "Capitol"}</p>
                  <h3 className="text-xl font-semibold text-white mt-1">{selectedLesson.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedLessonItems.length} itemi (ordonați după order_index). Treci cu mouse-ul între itemi pentru
                    „Inserează aici”.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => openCreateItem(selectedLesson.id)}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adaugă item
                </Button>
              </div>

              <div className="space-y-0">
                {selectedLessonItems.length === 0 ? (
                  <div className="space-y-2">
                    <div className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                      Lecția nu are itemi încă.
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openCreateItemAtOrderIndex(selectedLesson.id, 0)}
                      className="w-full rounded-md border border-dashed border-white/15 bg-white/[0.03] py-2 text-xs text-gray-400 transition-colors hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-200"
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Adaugă primul item (order_index 0)
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedLessonItems.map((item, index) => {
                      const ItemIcon = getItemIcon(item.item_type)
                      const insertTargetOrder = item.order_index
                      const isInsertActive =
                        formMode === "create-item" && form && !form.id && form.order_index === insertTargetOrder

                      return (
                        <div key={item.id} className="relative">
                          <div
                            className={`group/insert relative z-10 flex justify-center ${index === 0 ? "h-3 -mb-1.5" : "h-2 -my-1"}`}
                          >
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => openCreateItemAtOrderIndex(selectedLesson.id, insertTargetOrder)}
                              title="Inserează item aici (itemii următori își actualizează order_index automat)"
                              className={`absolute inset-x-0 top-0 flex h-full min-h-[1.25rem] items-center justify-center rounded border border-transparent transition-all ${
                                isInsertActive
                                  ? "border-violet-500/60 bg-violet-500/15"
                                  : "border-transparent hover:border-violet-500/40 hover:bg-violet-500/10"
                              }`}
                            >
                              <span
                                className={`pointer-events-none flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-violet-200/90 shadow-sm transition-opacity ${
                                  isInsertActive
                                    ? "bg-violet-600/40 opacity-100"
                                    : "bg-violet-600/30 opacity-0 group-hover/insert:opacity-100"
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                                Inserează aici
                              </span>
                            </button>
                          </div>

                          <div
                            className={`relative z-0 rounded-md border p-3 flex items-center gap-3 ${
                              form?.id === item.id ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-black/20"
                            }`}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10">
                              <ItemIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium ${item.is_active ? "text-white" : "text-gray-500 line-through"}`}>
                                {item.title || ITEM_TYPE_LABEL[item.item_type]}
                              </p>
                              <p className="text-xs text-gray-400">
                                {ITEM_TYPE_LABEL[item.item_type]} | order_index: {item.order_index}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10"
                                onClick={() => moveItem(item.id, "up")}
                                disabled={index === 0 || saving}
                                title="Mută sus"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-white/10"
                                onClick={() => moveItem(item.id, "down")}
                                disabled={index === selectedLessonItems.length - 1 || saving}
                                title="Mută jos"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                                onClick={() => openEditItem(item)}
                                title="Editează"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
                                onClick={() => deleteItem(item.id, false)}
                                title="Dezactivează item"
                              >
                                <EyeOff className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-300 hover:text-red-200 hover:bg-red-500/10"
                                onClick={() => deleteItem(item.id, true)}
                                title="Șterge definitiv"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {(() => {
                      const lastOrder = Math.max(...selectedLessonItems.map((i) => i.order_index))
                      const appendOrder = lastOrder + 1
                      const isAppendActive =
                        formMode === "create-item" && form && !form.id && form.order_index === appendOrder

                      return (
                        <div className="group/insertappend relative z-10 -mt-0.5 flex h-3 justify-center pt-0.5">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => openCreateItemAtOrderIndex(selectedLesson.id, appendOrder)}
                            title="Adaugă item la sfârșitul listei"
                            className={`absolute inset-x-0 top-0 flex min-h-[1.25rem] items-center justify-center rounded border border-transparent transition-all ${
                              isAppendActive
                                ? "border-violet-500/60 bg-violet-500/15"
                                : "border-transparent hover:border-violet-500/40 hover:bg-violet-500/10"
                            }`}
                          >
                            <span
                              className={`pointer-events-none flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-violet-200/90 transition-opacity ${
                                isAppendActive
                                  ? "bg-violet-600/40 opacity-100"
                                  : "bg-violet-600/30 opacity-0 group-hover/insertappend:opacity-100"
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              Adaugă la final
                            </span>
                          </button>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>

              {formMode !== "none" && form && (
                <div className="rounded-lg border border-white/15 bg-black/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      {formMode === "create-item" ? "Adaugă item nou" : "Editează item"}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-white/10"
                      onClick={resetForm}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Închide
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-300">Tip item</p>
                      <select
                        value={form.item_type}
                        onChange={(e) => updateForm("item_type", e.target.value as LearningPathLessonType)}
                        className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-gray-100"
                      >
                        {ITEM_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {ITEM_TYPE_LABEL[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-300">Titlu item</p>
                      <Input
                        value={form.title}
                        onChange={(e) => updateForm("title", e.target.value)}
                        placeholder="Titlu (opțional)"
                        className="bg-black/40 border-white/20 text-gray-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-300">Order index</p>
                      <Input
                        type="number"
                        value={form.order_index}
                        onChange={(e) => updateForm("order_index", Number.parseInt(e.target.value || "0", 10))}
                        className="bg-black/40 border-white/20 text-gray-100"
                      />
                      {formMode === "create-item" && !form.id ? (
                        <p className="text-[11px] text-gray-500 leading-snug">
                          La salvare, itemii existenți cu același order_index sau mai mare sunt incrementați automat (+1), apoi noul item ocupă poziția setată.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-300">Status</p>
                      <label className="flex items-center gap-2 text-sm text-gray-100 pt-2">
                        <Checkbox
                          checked={form.is_active}
                          onCheckedChange={(checked) => updateForm("is_active", !!checked)}
                        />
                        Item activ
                      </label>
                    </div>
                  </div>

                  <div className="rounded-md border border-white/10 bg-black/20 p-3">{renderTypeSpecificFields()}</div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button onClick={handleSaveItem} disabled={saving} className="bg-violet-600 hover:bg-violet-500 text-white">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {form.id ? "Salvează modificările" : "Creează item"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
                    >
                      Anulează
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

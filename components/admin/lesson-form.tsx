"use client"

import { useState, useEffect, useRef, Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Save, X, Eye, EyeOff, BookOpen, AlertTriangle, FileText, Lightbulb, Type, MoveRight } from "lucide-react"
import type { Lesson } from "@/lib/supabase-physics"

const LessonViewer = lazy(() => import("@/components/lesson-viewer").then((m) => ({ default: m.LessonViewer })))

interface Chapter {
  id: string
  grade_id: string
  title: string
}

interface LessonFormProps {
  chapters: Chapter[]
  lesson?: Lesson | null
  defaultChapterId?: string
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

const MARKERS = [
  { tag: "FORMULA", label: "Formula", icon: Type, description: "Formule matematice" },
  { tag: "ENUNT", label: "Enunț", icon: FileText, description: "Enunțuri / teoreme" },
  { tag: "IMPORTANT", label: "Important", icon: AlertTriangle, description: "Info importantă" },
  { tag: "DEFINITIE", label: "Definiție", icon: BookOpen, description: "Definiții" },
  { tag: "EXEMPLU", label: "Exemplu", icon: Lightbulb, description: "Exemple practice" },
  { tag: "INDENT", label: "Indent", icon: MoveRight, description: "Text indentat" },
]

export function LessonForm({ chapters, lesson, defaultChapterId, onSave, onCancel }: LessonFormProps) {
  const [chapterId, setChapterId] = useState(lesson?.chapter_id || defaultChapterId || "")
  const [title, setTitle] = useState(lesson?.title || "")
  const [content, setContent] = useState(lesson?.content || "")
  const [orderIndex, setOrderIndex] = useState(lesson?.order_index ?? 0)
  const [difficultyLevel, setDifficultyLevel] = useState<number | "">(lesson?.difficulty_level ?? "")
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">(lesson?.estimated_duration ?? "")
  const [isActive, setIsActive] = useState(lesson?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (lesson) {
      setChapterId(lesson.chapter_id)
      setTitle(lesson.title)
      setContent(lesson.content)
      setOrderIndex(lesson.order_index)
      setDifficultyLevel(lesson.difficulty_level ?? "")
      setEstimatedDuration(lesson.estimated_duration ?? "")
      setIsActive(lesson.is_active)
    }
  }, [lesson])

  const insertMarker = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const insertion = `[${tag}]${selectedText || "..."}[/${tag}]`

    const newContent = content.substring(0, start) + insertion + content.substring(end)
    setContent(newContent)

    // Setează cursorul în interiorul marcatorului
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = selectedText ? start + insertion.length : start + `[${tag}]`.length
      const cursorEnd = selectedText ? start + insertion.length : start + `[${tag}]`.length + 3
      textarea.setSelectionRange(cursorPos, cursorEnd)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!chapterId) {
      setError("Selectează un capitol.")
      return
    }
    if (!title.trim()) {
      setError("Titlul este obligatoriu.")
      return
    }

    setSaving(true)
    try {
      await onSave({
        type: "lesson",
        id: lesson?.id,
        chapter_id: chapterId,
        title: title.trim(),
        content,
        order_index: orderIndex,
        difficulty_level: difficultyLevel === "" ? null : Number(difficultyLevel),
        estimated_duration: estimatedDuration === "" ? null : Number(estimatedDuration),
        is_active: isActive,
      })
    } catch (err: any) {
      setError(err.message || "Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  // Build a fake Lesson object for preview
  const previewLesson: Lesson = {
    id: lesson?.id || "preview",
    chapter_id: chapterId,
    title: title || "Preview lecție",
    content: content,
    order_index: orderIndex,
    difficulty_level: difficultyLevel === "" ? null : Number(difficultyLevel),
    estimated_duration: estimatedDuration === "" ? null : Number(estimatedDuration),
    is_active: isActive,
    created_at: lesson?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {lesson ? "Editează Lecție" : "Lecție Nouă"}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-white/30 bg-white/5 text-gray-100 hover:bg-white/10 hover:text-white text-xs"
          >
            {showPreview ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showPreview ? "Ascunde preview" : "Preview"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-gray-200 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-gray-300">Capitol</Label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full h-10 rounded-md border border-white/20 bg-white/5 px-3 text-white text-sm"
          >
            <option value="">Selectează capitolul...</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Titlu</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Legile lui Newton"
            className="bg-white/5 border-white/20 text-white"
          />
        </div>

        {/* Marker buttons */}
        <div className="space-y-2">
          <Label className="text-gray-300">Marcatori rapizi</Label>
          <div className="flex flex-wrap gap-1.5">
            {MARKERS.map((m) => (
              <Button
                key={m.tag}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertMarker(m.tag)}
                className="border-white/30 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white text-xs h-8"
                title={m.description}
              >
                <m.icon className="w-3 h-3 mr-1" />
                {m.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const textarea = textareaRef.current
                if (!textarea) return
                const start = textarea.selectionStart
                const insertion = "$$...$$"
                const newContent = content.substring(0, start) + insertion + content.substring(textarea.selectionEnd)
                setContent(newContent)
                requestAnimationFrame(() => {
                  textarea.focus()
                  textarea.setSelectionRange(start + 2, start + 5)
                })
              }}
              className="border-white/30 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white text-xs h-8"
              title="LaTeX block math"
            >
              LaTeX $$
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const textarea = textareaRef.current
                if (!textarea) return
                const start = textarea.selectionStart
                const insertion = "$...$"
                const newContent = content.substring(0, start) + insertion + content.substring(textarea.selectionEnd)
                setContent(newContent)
                requestAnimationFrame(() => {
                  textarea.focus()
                  textarea.setSelectionRange(start + 1, start + 4)
                })
              }}
              className="border-white/30 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white text-xs h-8"
              title="LaTeX inline math"
            >
              LaTeX $
            </Button>
          </div>
        </div>

        {/* Content textarea */}
        <div className="space-y-2">
          <Label className="text-gray-300">Conținut lecție</Label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Scrie conținutul lecției aici...\n\nExemple de marcatori:\n[FORMULA]$$F = ma$$[/FORMULA]\n[IMPORTANT]Aceasta este o informație importantă![/IMPORTANT]\n[DEFINITIE]Forța este...[/DEFINITIE]\n[EXEMPLU]Dacă aplicăm...[/EXEMPLU]\n[ENUNT]Legea spune că...[/ENUNT]\n\n# Heading 1\n## Heading 2\n**bold** *italic*`}
            rows={20}
            className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white text-sm font-mono resize-y min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-xs text-gray-500">
            Suportă: Markdown (# headings, **bold**, *italic*), LaTeX ($...$ inline, $$...$$ block), marcatori speciali
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Ordine</Label>
            <Input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              min={0}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Dificultate</Label>
            <Input
              type="number"
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value === "" ? "" : parseInt(e.target.value))}
              min={1}
              max={5}
              placeholder="1-5"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Durată (min)</Label>
            <Input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value === "" ? "" : parseInt(e.target.value))}
              min={0}
              placeholder="—"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label className="text-gray-300">Activă (vizibilă pe platformă)</Label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white flex-1">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {lesson ? "Salvează modificările" : "Creează lecție"}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="border-white/30 bg-white/5 text-gray-100 hover:bg-white/10 hover:text-white">
            Anulează
          </Button>
        </div>
      </form>

      {/* Preview */}
      {showPreview && (
        <div className="mt-6 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Preview lecție</span>
          </div>
          <div className="h-[700px] max-h-[75vh] overflow-hidden bg-[#101010]">
            <Suspense fallback={<div className="p-6 text-gray-400 text-center">Se încarcă preview-ul...</div>}>
              <LessonViewer
                lesson={previewLesson}
                hasPrevious={false}
                hasNext={false}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}

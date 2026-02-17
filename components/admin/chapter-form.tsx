"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Save, X } from "lucide-react"

interface Grade {
  id: string
  grade_number: number
  name: string
}

interface Chapter {
  id: string
  grade_id: string
  title: string
  description: string | null
  order_index: number
  is_active: boolean
  estimated_duration: number | null
}

interface ChapterFormProps {
  grades: Grade[]
  chapter?: Chapter | null
  defaultGradeId?: string
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export function ChapterForm({ grades, chapter, defaultGradeId, onSave, onCancel }: ChapterFormProps) {
  const [gradeId, setGradeId] = useState(chapter?.grade_id || defaultGradeId || "")
  const [title, setTitle] = useState(chapter?.title || "")
  const [description, setDescription] = useState(chapter?.description || "")
  const [orderIndex, setOrderIndex] = useState(chapter?.order_index ?? 0)
  const [isActive, setIsActive] = useState(chapter?.is_active ?? true)
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">(chapter?.estimated_duration ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (chapter) {
      setGradeId(chapter.grade_id)
      setTitle(chapter.title)
      setDescription(chapter.description || "")
      setOrderIndex(chapter.order_index)
      setIsActive(chapter.is_active)
      setEstimatedDuration(chapter.estimated_duration ?? "")
    }
  }, [chapter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!gradeId) {
      setError("Selectează o clasă.")
      return
    }
    if (!title.trim()) {
      setError("Titlul este obligatoriu.")
      return
    }

    setSaving(true)
    try {
      await onSave({
        type: "chapter",
        id: chapter?.id,
        grade_id: gradeId,
        title: title.trim(),
        description: description.trim() || null,
        order_index: orderIndex,
        is_active: isActive,
        estimated_duration: estimatedDuration === "" ? null : Number(estimatedDuration),
      })
    } catch (err: any) {
      setError(err.message || "Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {chapter ? "Editează Capitol" : "Capitol Nou"}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-gray-200 hover:text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-gray-300">Clasă</Label>
        <select
          value={gradeId}
          onChange={(e) => setGradeId(e.target.value)}
          className="w-full h-10 rounded-md border border-white/20 bg-white/5 px-3 text-white text-sm"
        >
          <option value="">Selectează clasa...</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name || `Clasa ${g.grade_number}`}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Titlu</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Mecanica clasică"
          className="bg-white/5 border-white/20 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Descriere (opțional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descriere scurtă a capitolului..."
          rows={3}
          className="bg-white/5 border-white/20 text-white resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label className="text-gray-300">Durată estimată (min)</Label>
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
        <Label className="text-gray-300">Activ (vizibil pe platformă)</Label>
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
              {chapter ? "Salvează modificările" : "Creează capitol"}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/30 bg-white/5 text-gray-100 hover:bg-white/10 hover:text-white">
          Anulează
        </Button>
      </div>
    </form>
  )
}

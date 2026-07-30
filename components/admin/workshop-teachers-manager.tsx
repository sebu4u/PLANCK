"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Loader2, Pencil, Plus, Save, Trash2, Upload } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { WorkshopTeacher } from "@/lib/pregatire/types"

const EMPTY_FORM = {
  name: "",
  description: "",
  icon_url: "",
  is_active: true,
}

export function WorkshopTeachersManager() {
  const [teachers, setTeachers] = useState<WorkshopTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const refresh = useCallback(async () => {
    setError(null)
    const accessToken = await getAccessToken()
    if (!accessToken) {
      setError("Sesiune invalidă.")
      return
    }
    const response = await fetch("/api/admin/workshop-teachers", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      setError("Nu am putut încărca profesorii.")
      return
    }
    const data = await response.json()
    setTeachers(data.teachers ?? [])
  }, [getAccessToken])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleEdit = (teacher: WorkshopTeacher) => {
    setEditingId(teacher.id)
    setForm({
      name: teacher.name,
      description: teacher.description ?? "",
      icon_url: teacher.icon_url ?? "",
      is_active: teacher.is_active,
    })
    setSuccessMessage(null)
    setError(null)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune invalidă.")
        return
      }
      const body = new FormData()
      body.append("file", file)
      const response = await fetch("/api/admin/workshop-teachers/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Upload eșuat.")
        return
      }
      setForm((current) => ({ ...current, icon_url: data.url }))
    } catch {
      setError("Upload eșuat.")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune invalidă.")
        return
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon_url: form.icon_url.trim() || null,
        is_active: form.is_active,
        ...(editingId ? { id: editingId } : {}),
      }
      const response = await fetch("/api/admin/workshop-teachers", {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Nu am putut salva.")
        return
      }
      setSuccessMessage(editingId ? "Profesor actualizat." : "Profesor creat.")
      resetForm()
      await refresh()
    } catch {
      setError("Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sigur vrei să ștergi acest profesor?")) return
    setSaving(true)
    setError(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch(`/api/admin/workshop-teachers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Nu am putut șterge.")
        return
      }
      if (editingId === id) resetForm()
      setSuccessMessage("Profesor șters.")
      await refresh()
    } catch {
      setError("Eroare la ștergere.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Editează profesor" : "Profesor nou"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Entități CMS pentru pregătiri — separate de conturile de profesor din app.
            </p>
          </div>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="border-white/20 bg-transparent text-gray-200 hover:bg-white/10"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nou
            </Button>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher_name">Nume</Label>
            <Input
              id="teacher_name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              className="border-white/20 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher_description">Descriere</Label>
            <Textarea
              id="teacher_description"
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              rows={4}
              className="border-white/20 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher_icon">Icon URL</Label>
            <div className="flex gap-2">
              <Input
                id="teacher_icon"
                value={form.icon_url}
                onChange={(e) => setForm((c) => ({ ...c, icon_url: e.target.value }))}
                className="border-white/20 bg-black/40 text-white"
                placeholder="https://..."
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 px-3 text-sm text-gray-200 hover:bg-white/10">
                <Upload className="h-4 w-4" />
                {uploading ? "..." : "Upload"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleUpload(file)
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
            {form.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.icon_url} alt="" className="mt-2 h-14 w-14 rounded-full object-cover" />
            ) : null}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
            <Label htmlFor="teacher_active">Activ</Label>
            <Switch
              id="teacher_active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((c) => ({ ...c, is_active: checked }))}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-300">{successMessage}</p>
          ) : null}

          <Button type="button" onClick={() => void handleSave()} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvează
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Profesori ({teachers.length})</h2>
        <div className="mt-4 space-y-3">
          {teachers.length === 0 ? (
            <p className="text-sm text-gray-400">Niciun profesor încă.</p>
          ) : (
            teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3"
              >
                {teacher.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={teacher.icon_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                    {teacher.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{teacher.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {teacher.is_active ? "Activ" : "Inactiv"}
                    {teacher.description ? ` · ${teacher.description}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-gray-300"
                  onClick={() => handleEdit(teacher)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-red-300"
                  onClick={() => void handleDelete(teacher.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader2, Pencil, Plus, Save, Trash2, Zap } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  WORKSHOP_DEFAULT_DURATION_MINUTES,
  WORKSHOP_DEFAULT_ENERGY_COST,
  WORKSHOP_SUBJECTS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopSubject,
  type WorkshopTeacher,
} from "@/lib/pregatire/types"
import { bucharestLocalToIso, formatWorkshopDateTime, isoToBucharestLocalParts } from "@/lib/pregatire/dates"

interface AdminWorkshop {
  id: string
  title: string
  slug: string
  description: string
  subject: WorkshopSubject
  teacher_id: string
  starts_at: string
  duration_minutes: number
  energy_cost: number
  meet_url: string
  recording_url: string | null
  max_seats: number | null
  is_published: boolean
  workshop_teachers?: { id: string; name: string; icon_url: string | null } | null
}

const EMPTY_FORM = {
  title: "",
  description: "",
  subject: "fizica" as WorkshopSubject,
  teacher_id: "",
  event_date: "",
  event_time: "18:00",
  duration_minutes: String(WORKSHOP_DEFAULT_DURATION_MINUTES),
  energy_cost: String(WORKSHOP_DEFAULT_ENERGY_COST),
  meet_url: "",
  recording_url: "",
  max_seats: "",
  unlimited_seats: true,
  is_published: false,
}

export function PregatireManager() {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([])
  const [teachers, setTeachers] = useState<WorkshopTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    const headers = { Authorization: `Bearer ${accessToken}` }
    const [workshopsRes, teachersRes] = await Promise.all([
      fetch("/api/admin/pregatiri", { headers }),
      fetch("/api/admin/workshop-teachers", { headers }),
    ])
    if (!workshopsRes.ok || !teachersRes.ok) {
      setError("Nu am putut încărca datele.")
      return
    }
    const workshopsData = await workshopsRes.json()
    const teachersData = await teachersRes.json()
    setWorkshops(workshopsData.workshops ?? [])
    setTeachers(teachersData.teachers ?? [])
  }, [getAccessToken])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const activeTeachers = useMemo(
    () => teachers.filter((t) => t.is_active || t.id === form.teacher_id),
    [teachers, form.teacher_id],
  )

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleEdit = (workshop: AdminWorkshop) => {
    const local = isoToBucharestLocalParts(workshop.starts_at)
    setEditingId(workshop.id)
    setForm({
      title: workshop.title,
      description: workshop.description ?? "",
      subject: workshop.subject,
      teacher_id: workshop.teacher_id,
      event_date: local.date,
      event_time: local.time,
      duration_minutes: String(workshop.duration_minutes),
      energy_cost: String(workshop.energy_cost),
      meet_url: workshop.meet_url,
      recording_url: workshop.recording_url ?? "",
      max_seats: workshop.max_seats != null ? String(workshop.max_seats) : "",
      unlimited_seats: workshop.max_seats == null,
      is_published: workshop.is_published,
    })
    setSuccessMessage(null)
    setError(null)
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
      if (!form.teacher_id) {
        setError("Selectează un profesor.")
        return
      }
      if (!form.event_date || !form.event_time) {
        setError("Data și ora sunt obligatorii.")
        return
      }

      let startsAt: string
      try {
        startsAt = bucharestLocalToIso(form.event_date, form.event_time)
      } catch {
        setError("Data și ora sunt invalide.")
        return
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        teacher_id: form.teacher_id,
        starts_at: startsAt,
        duration_minutes: Number(form.duration_minutes) || WORKSHOP_DEFAULT_DURATION_MINUTES,
        energy_cost: Number(form.energy_cost) || WORKSHOP_DEFAULT_ENERGY_COST,
        meet_url: form.meet_url.trim(),
        recording_url: form.recording_url.trim() || null,
        max_seats: form.unlimited_seats
          ? null
          : Math.max(1, Number(form.max_seats) || 1),
        is_published: form.is_published,
        ...(editingId ? { id: editingId } : {}),
      }

      const response = await fetch("/api/admin/pregatiri", {
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
      setSuccessMessage(editingId ? "Pregătire actualizată." : "Pregătire creată.")
      resetForm()
      await refresh()
    } catch {
      setError("Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sigur vrei să ștergi această pregătire?")) return
    setSaving(true)
    setError(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch(`/api/admin/pregatiri?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Nu am putut șterge.")
        return
      }
      if (editingId === id) resetForm()
      setSuccessMessage("Pregătire ștearsă.")
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
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Editează pregătire" : "Pregătire nouă"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Link Google Meet lipit manual. Costul de energie e configurabil.
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
            <Label htmlFor="ws_title">Titlu</Label>
            <Input
              id="ws_title"
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              className="border-white/20 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws_description">Descriere</Label>
            <Textarea
              id="ws_description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              className="border-white/20 bg-black/40 text-white"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Materie</Label>
              <Select
                value={form.subject}
                onValueChange={(value) =>
                  setForm((c) => ({ ...c, subject: value as WorkshopSubject }))
                }
              >
                <SelectTrigger className="border-white/20 bg-black/40 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSHOP_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {WORKSHOP_SUBJECT_LABELS[subject]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profesor</Label>
              <Select
                value={form.teacher_id || undefined}
                onValueChange={(value) => setForm((c) => ({ ...c, teacher_id: value }))}
              >
                <SelectTrigger className="border-white/20 bg-black/40 text-white">
                  <SelectValue placeholder="Selectează" />
                </SelectTrigger>
                <SelectContent>
                  {activeTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ws_date">Dată (Bucharest)</Label>
              <Input
                id="ws_date"
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((c) => ({ ...c, event_date: e.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws_time">Oră</Label>
              <Input
                id="ws_time"
                type="time"
                value={form.event_time}
                onChange={(e) => setForm((c) => ({ ...c, event_time: e.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ws_duration">Durată (minute)</Label>
              <Input
                id="ws_duration"
                type="number"
                min={15}
                max={480}
                value={form.duration_minutes}
                onChange={(e) => setForm((c) => ({ ...c, duration_minutes: e.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws_energy" className="inline-flex items-center gap-1">
                Cost energie <Zap className="h-3.5 w-3.5 text-amber-400" />
              </Label>
              <Input
                id="ws_energy"
                type="number"
                min={1}
                max={500}
                value={form.energy_cost}
                onChange={(e) => setForm((c) => ({ ...c, energy_cost: e.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws_meet">Google Meet URL</Label>
            <Input
              id="ws_meet"
              value={form.meet_url}
              onChange={(e) => setForm((c) => ({ ...c, meet_url: e.target.value }))}
              className="border-white/20 bg-black/40 text-white"
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws_recording">Înregistrare URL (opțional)</Label>
            <Input
              id="ws_recording"
              value={form.recording_url}
              onChange={(e) => setForm((c) => ({ ...c, recording_url: e.target.value }))}
              className="border-white/20 bg-black/40 text-white"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
            <Label htmlFor="ws_unlimited">Locuri nelimitate</Label>
            <Switch
              id="ws_unlimited"
              checked={form.unlimited_seats}
              onCheckedChange={(checked) =>
                setForm((c) => ({ ...c, unlimited_seats: checked }))
              }
            />
          </div>
          {!form.unlimited_seats ? (
            <div className="space-y-2">
              <Label htmlFor="ws_seats">Număr maxim locuri</Label>
              <Input
                id="ws_seats"
                type="number"
                min={1}
                value={form.max_seats}
                onChange={(e) => setForm((c) => ({ ...c, max_seats: e.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
            <Label htmlFor="ws_published">Publicată</Label>
            <Switch
              id="ws_published"
              checked={form.is_published}
              onCheckedChange={(checked) => setForm((c) => ({ ...c, is_published: checked }))}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}
          {successMessage ? <p className="text-sm text-emerald-300">{successMessage}</p> : null}

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !form.title.trim() || !form.meet_url.trim()}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvează
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Pregătiri ({workshops.length})</h2>
        <div className="mt-4 space-y-3">
          {workshops.length === 0 ? (
            <p className="text-sm text-gray-400">Nicio pregătire încă.</p>
          ) : (
            workshops.map((workshop) => (
              <div
                key={workshop.id}
                className="rounded-lg border border-white/10 bg-black/20 px-3 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{workshop.title}</p>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-gray-300">
                        {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] ${
                          workshop.is_published
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {workshop.is_published ? "Publicată" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatWorkshopDateTime(workshop.starts_at)} ·{" "}
                      {workshop.workshop_teachers?.name ?? "—"} · {workshop.energy_cost} energie
                      {workshop.max_seats != null ? ` · max ${workshop.max_seats}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-gray-300"
                    onClick={() => handleEdit(workshop)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-red-300"
                    onClick={() => void handleDelete(workshop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

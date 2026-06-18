"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  FIZICA_CALENDAR_EVENT_TYPES,
  FIZICA_CALENDAR_EVENT_TYPE_LIST,
  type FizicaCalendarEventType,
} from "@/lib/invata-fizica-config"
import { formatFizicaEventTime } from "@/lib/supabase-fizica-calendar"
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
import { AlertCircle, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react"

interface AdminCalendarEvent {
  id: string
  event_date: string
  event_type: FizicaCalendarEventType
  title: string
  description: string | null
  start_time: string
  color: string
  image_url: string | null
  is_active: boolean
}

const EMPTY_FORM = {
  event_date: "",
  event_type: "pregatire" as FizicaCalendarEventType,
  title: "",
  description: "",
  start_time: "18:00",
  color: FIZICA_CALENDAR_EVENT_TYPES.pregatire.defaultColor,
  image_url: "",
  is_active: true,
}

function formatEventDate(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateIso
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function FizicaCalendarManager() {
  const [events, setEvents] = useState<AdminCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const getAccessToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token ?? null
  }, [])

  const refreshEvents = useCallback(async () => {
    setError(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune invalidă.")
        return
      }

      const response = await fetch("/api/admin/fizica-calendar", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        setError("Nu am putut încărca evenimentele.")
        return
      }

      const data = await response.json()
      setEvents(data.events ?? [])
    } catch (err) {
      console.error(err)
      setError("Eroare la încărcarea evenimentelor.")
    }
  }, [getAccessToken])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await refreshEvents()
      setLoading(false)
    }
    void load()
  }, [refreshEvents])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }, [])

  const handleEdit = useCallback((event: AdminCalendarEvent) => {
    setEditingId(event.id)
    setForm({
      event_date: event.event_date,
      event_type: event.event_type,
      title: event.title,
      description: event.description ?? "",
      start_time: formatFizicaEventTime(event.start_time),
      color: event.color,
      image_url: event.image_url ?? "",
      is_active: event.is_active,
    })
    setSuccessMessage(null)
    setError(null)
  }, [])

  const handleTypeChange = useCallback((eventType: FizicaCalendarEventType) => {
    setForm((current) => ({
      ...current,
      event_type: eventType,
      color: FIZICA_CALENDAR_EVENT_TYPES[eventType].defaultColor,
    }))
  }, [])

  const handleSave = useCallback(async () => {
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
        ...form,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        ...(editingId ? { id: editingId } : {}),
      }

      const response = await fetch("/api/admin/fizica-calendar", {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Nu am putut salva evenimentul.")
        return
      }

      setSuccessMessage(editingId ? "Eveniment actualizat." : "Eveniment creat.")
      resetForm()
      await refreshEvents()
    } catch (err) {
      console.error(err)
      setError("Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }, [editingId, form, getAccessToken, refreshEvents, resetForm])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Sigur vrei să ștergi acest eveniment?")) return

      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          setError("Sesiune invalidă.")
          return
        }

        const response = await fetch(`/api/admin/fizica-calendar?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error ?? "Nu am putut șterge evenimentul.")
          return
        }

        if (editingId === id) resetForm()
        setSuccessMessage("Eveniment șters.")
        await refreshEvents()
      } catch (err) {
        console.error(err)
        setError("Eroare la ștergere.")
      } finally {
        setSaving(false)
      }
    },
    [editingId, getAccessToken, refreshEvents, resetForm],
  )

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [events],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Editează eveniment" : "Eveniment nou"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Maxim un eveniment per dată. Tipul setează culoarea implicită.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event_date">Dată</Label>
              <Input
                id="event_date"
                type="date"
                value={form.event_date}
                onChange={(event) => setForm((current) => ({ ...current, event_date: event.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Oră</Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tip eveniment</Label>
            <Select value={form.event_type} onValueChange={(value) => handleTypeChange(value as FizicaCalendarEventType)}>
              <SelectTrigger className="border-white/20 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIZICA_CALENDAR_EVENT_TYPE_LIST.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FIZICA_CALENDAR_EVENT_TYPES[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titlu</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="border-white/20 bg-black/40 text-white"
              placeholder="Ex: Pregătire mecanică"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descriere (opțional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-[96px] border-white/20 bg-black/40 text-white"
              placeholder="Detalii suplimentare despre eveniment"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="color">Culoare</Label>
              <Input
                id="color"
                type="color"
                value={form.color}
                onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                className="h-10 cursor-pointer border-white/20 bg-black/40 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color_hex">Cod hex</Label>
              <Input
                id="color_hex"
                value={form.color}
                onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                className="border-white/20 bg-black/40 text-white"
                placeholder="#2563eb"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL imagine transparentă (opțional)</Label>
            <Input
              id="image_url"
              value={form.image_url}
              onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
              className="border-white/20 bg-black/40 text-white"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Activ</p>
              <p className="text-xs text-gray-400">Evenimentele inactive nu apar în calendar.</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {editingId ? "Salvează modificările" : "Adaugă eveniment"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Evenimente programate</h2>
        <p className="mt-1 mb-6 text-sm text-gray-400">
          {sortedEvents.length} evenimente în total.
        </p>

        {sortedEvents.length === 0 ? (
          <p className="text-sm text-gray-500">Nu există evenimente încă.</p>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-lg border border-white/10 bg-black/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: event.color }}
                      >
                        {FIZICA_CALENDAR_EVENT_TYPES[event.event_type].label}
                      </span>
                      {!event.is_active ? (
                        <span className="text-xs text-gray-500">Inactiv</span>
                      ) : null}
                    </div>
                    <h3 className="font-semibold text-white">{event.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {formatEventDate(event.event_date)} · {formatFizicaEventTime(event.start_time)}
                    </p>
                    {event.description ? (
                      <p className="mt-2 text-sm text-gray-300">{event.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(event)}
                      className="border-white/20 bg-transparent text-gray-200 hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(event.id)}
                      className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

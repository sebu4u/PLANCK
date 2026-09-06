"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  CalendarIcon,
  ExternalLink,
  Loader2,
  Save,
  Upload,
  Users,
} from "lucide-react"
import { ro } from "react-day-picker/locale"
import { Navigation } from "@/components/navigation"
import {
  EMPTY_WORKSHOP_MATERIALS_FORM,
  WorkshopMaterialsFields,
  type WorkshopMaterialsFormValue,
} from "@/components/admin/workshop-materials-fields"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { bucharestLocalToIso, formatWorkshopDateTime } from "@/lib/pregatire/dates"
import {
  WORKSHOP_DEFAULT_DURATION_MINUTES,
  WORKSHOP_DEFAULT_ENERGY_COST,
  WORKSHOP_SUBJECTS,
  WORKSHOP_SUBJECT_LABELS,
  WORKSHOP_TZ,
  type WorkshopHomeworkItem,
  type WorkshopSubject,
  type WorkshopTeacher,
} from "@/lib/pregatire/types"

type MentorWorkshop = {
  id: string
  title: string
  description: string
  subject: WorkshopSubject
  starts_at: string
  duration_minutes: number
  energy_cost: number
  meet_url: string
  max_seats: number | null
  is_published: boolean
  is_bac: boolean
  whiteboard_url?: string | null
  notes_markdown?: string | null
  notes_pdf_path?: string | null
  homework_pdf_path?: string | null
  notes_pdf_url?: string | null
  homework_pdf_url?: string | null
  homework_items?: WorkshopHomeworkItem[]
  unlock_count?: number
}

type MentorStudent = {
  name: string
  enrolled_at: string
}

type DashboardPayload = {
  teacher: WorkshopTeacher
  workshop: MentorWorkshop | null
  students: MentorStudent[]
}

const EMPTY_CREATE_FORM = {
  title: "",
  description: "",
  subject: "fizica" as WorkshopSubject,
  event_date: "",
  event_time: "18:00",
  duration_minutes: String(WORKSHOP_DEFAULT_DURATION_MINUTES),
  energy_cost: String(WORKSHOP_DEFAULT_ENERGY_COST),
  meet_url: "",
  max_seats: "",
  unlimited_seats: true,
  is_published: true,
  is_bac: false,
}

function ymdToLocalDate(ymd: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined
  const [year, month, day] = ymd.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  return date
}

function localDateToYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function formatEventDateLabel(ymd: string): string {
  const date = ymdToLocalDate(ymd)
  if (!date) return ymd
  return date.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatEnrollmentDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("ro-RO", {
    timeZone: WORKSHOP_TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function materialsFromWorkshop(workshop: MentorWorkshop): WorkshopMaterialsFormValue {
  return {
    whiteboard_url: workshop.whiteboard_url ?? "",
    notes_markdown: workshop.notes_markdown ?? "",
    notes_pdf_path: workshop.notes_pdf_path ?? "",
    notes_pdf_url: workshop.notes_pdf_url ?? "",
    homework_pdf_path: workshop.homework_pdf_path ?? "",
    homework_pdf_url: workshop.homework_pdf_url ?? "",
    homework_items: workshop.homework_items ?? [],
  }
}

export function MentorDashboard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [creating, setCreating] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<WorkshopTeacher | null>(null)
  const [workshop, setWorkshop] = useState<MentorWorkshop | null>(null)
  const [students, setStudents] = useState<MentorStudent[]>([])
  const [meetUrl, setMeetUrl] = useState("")
  const [materials, setMaterials] = useState<WorkshopMaterialsFormValue>(EMPTY_WORKSHOP_MATERIALS_FORM)
  const [profile, setProfile] = useState({ name: "", description: "", icon_url: "" })
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const applyDashboard = useCallback((data: DashboardPayload) => {
    setTeacher(data.teacher)
    setProfile({
      name: data.teacher.name ?? "",
      description: data.teacher.description ?? "",
      icon_url: data.teacher.icon_url ?? "",
    })
    setWorkshop(data.workshop)
    setStudents(data.students ?? [])
    setMeetUrl(data.workshop?.meet_url ?? "")
    setMaterials(data.workshop ? materialsFromWorkshop(data.workshop) : EMPTY_WORKSHOP_MATERIALS_FORM)
  }, [])

  const refresh = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setError("Sesiune invalidă.")
      return
    }
    const response = await fetch("/api/mentor/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Nu am putut încărca dashboard-ul.")
      return
    }
    applyDashboard(data as DashboardPayload)
  }, [applyDashboard, getAccessToken])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const saveProfile = async () => {
    setSavingProfile(true)
    setError(null)
    setSuccess(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch("/api/mentor/teacher", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          description: profile.description.trim(),
          icon_url: profile.icon_url.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Nu am putut salva profilul.")
        return
      }
      setTeacher(data.teacher)
      setSuccess("Profilul de pe /pregatire a fost actualizat.")
    } finally {
      setSavingProfile(false)
    }
  }

  const uploadIcon = async (file: File) => {
    setUploadingIcon(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const body = new FormData()
      body.append("file", file)
      const response = await fetch("/api/mentor/teacher/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Nu am putut încărca imaginea.")
        return
      }
      setProfile((current) => ({ ...current, icon_url: data.url ?? "" }))
    } finally {
      setUploadingIcon(false)
    }
  }

  const saveWorkshop = async () => {
    if (!workshop) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch(`/api/mentor/workshops/${workshop.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meet_url: meetUrl.trim(),
          whiteboard_url: materials.whiteboard_url,
          notes_markdown: materials.notes_markdown,
          notes_pdf_path: materials.notes_pdf_path || null,
          homework_pdf_path: materials.homework_pdf_path || null,
          homework_items: materials.homework_items,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Nu am putut salva meditația.")
        return
      }
      setWorkshop(data.workshop)
      setMeetUrl(data.workshop?.meet_url ?? meetUrl)
      setMaterials(materialsFromWorkshop(data.workshop))
      setSuccess("Meditația a fost actualizată.")
    } finally {
      setSaving(false)
    }
  }

  const createWorkshop = async () => {
    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      if (!createForm.event_date || !createForm.event_time) {
        setError("Data și ora sunt obligatorii.")
        return
      }
      const durationMinutes = Number(createForm.duration_minutes)
      const energyCost = Number(createForm.energy_cost)
      if (!Number.isFinite(durationMinutes) || durationMinutes < 15) {
        setError("Durata este invalidă.")
        return
      }
      if (!Number.isFinite(energyCost) || energyCost < 1) {
        setError("Costul de energie este invalid.")
        return
      }
      let maxSeats: number | null = null
      if (!createForm.unlimited_seats) {
        maxSeats = Number(createForm.max_seats)
        if (!Number.isFinite(maxSeats) || maxSeats < 1) {
          setError("Numărul de locuri este invalid.")
          return
        }
      }
      let startsAt: string
      try {
        startsAt = bucharestLocalToIso(createForm.event_date, createForm.event_time)
      } catch {
        setError("Data și ora sunt invalide.")
        return
      }
      const response = await fetch("/api/mentor/workshops", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          subject: createForm.subject,
          starts_at: startsAt,
          duration_minutes: durationMinutes,
          energy_cost: energyCost,
          meet_url: createForm.meet_url.trim(),
          max_seats: maxSeats,
          is_published: createForm.is_published,
          is_bac: createForm.is_bac,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Nu am putut crea meditația.")
        return
      }
      setCreateForm(EMPTY_CREATE_FORM)
      setShowCreate(false)
      setSuccess("Meditația a fost creată.")
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-24">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-gray-400">Dashboard mentor</p>
            <h1 className="mt-1 text-3xl font-bold">{teacher?.name || "Mentor"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Următoarea meditație, materialele pentru elevi și profilul tău de pe /pregatire.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowCreate((value) => !value)}>
            {showCreate ? "Ascunde formularul" : "Creează meditație"}
          </Button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        {showCreate ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold">Meditație nouă</h2>
            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="mentor_title">Titlu</Label>
                <Input
                  id="mentor_title"
                  value={createForm.title}
                  onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  className="border-white/20 bg-black/40 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor_description">Descriere</Label>
                <Textarea
                  id="mentor_description"
                  rows={4}
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="border-white/20 bg-black/40 text-white"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Materie</Label>
                  <Select
                    value={createForm.subject}
                    onValueChange={(value) =>
                      setCreateForm((current) => ({ ...current, subject: value as WorkshopSubject }))
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
                  <Label htmlFor="mentor_duration">Durată (minute)</Label>
                  <Input
                    id="mentor_duration"
                    type="number"
                    min={15}
                    max={480}
                    value={createForm.duration_minutes}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, duration_minutes: event.target.value }))
                    }
                    className="border-white/20 bg-black/40 text-white"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dată (Bucharest)</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start border-white/20 bg-black/40 font-normal text-white hover:bg-white/10 hover:text-white"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-gray-300" />
                        {createForm.event_date ? (
                          <span className="capitalize">{formatEventDateLabel(createForm.event_date)}</span>
                        ) : (
                          <span className="text-gray-400">Alege data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto border-white/15 bg-zinc-950 p-0 text-white">
                      <Calendar
                        mode="single"
                        locale={ro}
                        weekStartsOn={1}
                        selected={ymdToLocalDate(createForm.event_date)}
                        defaultMonth={ymdToLocalDate(createForm.event_date) ?? new Date()}
                        onSelect={(date) => {
                          if (!date) return
                          setCreateForm((current) => ({ ...current, event_date: localDateToYmd(date) }))
                          setDatePickerOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentor_time">Oră</Label>
                  <Input
                    id="mentor_time"
                    type="time"
                    value={createForm.event_time}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, event_time: event.target.value }))
                    }
                    className="border-white/20 bg-black/40 text-white"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mentor_energy">Cost energie</Label>
                  <Input
                    id="mentor_energy"
                    type="number"
                    min={1}
                    max={500}
                    value={createForm.energy_cost}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, energy_cost: event.target.value }))
                    }
                    className="border-white/20 bg-black/40 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentor_create_meet">Google Meet</Label>
                  <Input
                    id="mentor_create_meet"
                    value={createForm.meet_url}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, meet_url: event.target.value }))
                    }
                    className="border-white/20 bg-black/40 text-white"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <Label htmlFor="mentor_unlimited">Locuri nelimitate</Label>
                <Switch
                  id="mentor_unlimited"
                  checked={createForm.unlimited_seats}
                  onCheckedChange={(checked) =>
                    setCreateForm((current) => ({ ...current, unlimited_seats: checked }))
                  }
                />
              </div>
              {!createForm.unlimited_seats ? (
                <div className="space-y-2">
                  <Label htmlFor="mentor_seats">Număr maxim locuri</Label>
                  <Input
                    id="mentor_seats"
                    type="number"
                    min={1}
                    value={createForm.max_seats}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, max_seats: event.target.value }))
                    }
                    className="border-white/20 bg-black/40 text-white"
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <Label htmlFor="mentor_bac">Tag BAC</Label>
                <Switch
                  id="mentor_bac"
                  checked={createForm.is_bac}
                  onCheckedChange={(checked) =>
                    setCreateForm((current) => ({ ...current, is_bac: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <Label htmlFor="mentor_published">Publicată pe /pregatire</Label>
                <Switch
                  id="mentor_published"
                  checked={createForm.is_published}
                  onCheckedChange={(checked) =>
                    setCreateForm((current) => ({ ...current, is_published: checked }))
                  }
                />
              </div>
              <Button
                type="button"
                onClick={() => void createWorkshop()}
                disabled={creating || !createForm.title.trim() || !createForm.meet_url.trim()}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Creează meditația
              </Button>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xl font-semibold">Următoarea meditație</h2>
          {!workshop ? (
            <p className="mt-3 text-sm text-gray-400">
              Nu ai nicio meditație viitoare. Creează una ca să poți adăuga Meet, suport de curs și temă.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
                  {workshop.is_published ? "" : " · draft"}
                  {workshop.is_bac ? " · BAC" : ""}
                </p>
                <h3 className="mt-1 text-2xl font-bold">{workshop.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{formatWorkshopDateTime(workshop.starts_at)}</p>
                {workshop.description ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">{workshop.description}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor_meet">Link Google Meet</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="mentor_meet"
                    value={meetUrl}
                    onChange={(event) => setMeetUrl(event.target.value)}
                    className="border-white/20 bg-black/40 text-white"
                  />
                  {meetUrl ? (
                    <Button type="button" variant="outline" asChild>
                      <a href={meetUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Deschide
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
              <WorkshopMaterialsFields
                value={materials}
                onChange={setMaterials}
                workshopId={workshop.id}
                getAccessToken={getAccessToken}
                uploadUrl={`/api/mentor/workshops/${workshop.id}/upload`}
                catalogSearchUrl="/api/mentor/catalog-search"
              />
              <Button type="button" onClick={() => void saveWorkshop()} disabled={saving || !meetUrl.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvează Meet și materialele
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-300" />
            <h2 className="text-xl font-semibold">Elevi înscriși</h2>
          </div>
          {!workshop ? (
            <p className="mt-3 text-sm text-gray-400">Lista apare când ai o meditație viitoare.</p>
          ) : students.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">Niciun elev înscris încă.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
              {students.map((student, index) => (
                <li key={`${student.name}-${index}`} className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium">{student.name}</span>
                  <span className="text-xs text-gray-500">{formatEnrollmentDate(student.enrolled_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xl font-semibold">Profil /pregatire</h2>
          <p className="mt-1 text-sm text-gray-400">Modificările apar pe cardul tău public. Doar datele tale.</p>
          <div className="mt-4 grid gap-4">
            <div className="flex items-center gap-4">
              {profile.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.icon_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-semibold">
                  {(profile.name || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm hover:bg-white/5">
                {uploadingIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Schimbă poza
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadIcon(file)
                    event.target.value = ""
                  }}
                />
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentor_profile_name">Nume</Label>
              <Input
                id="mentor_profile_name"
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentor_profile_bio">Descriere</Label>
              <Textarea
                id="mentor_profile_bio"
                rows={4}
                value={profile.description}
                onChange={(event) => setProfile((current) => ({ ...current, description: event.target.value }))}
                className="border-white/20 bg-black/40 text-white"
              />
            </div>
            <Button type="button" onClick={() => void saveProfile()} disabled={savingProfile || profile.name.trim().length < 2}>
              {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvează profilul
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

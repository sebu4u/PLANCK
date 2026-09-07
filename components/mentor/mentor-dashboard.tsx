"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Upload,
  Users,
  Video,
  Zap,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { bucharestLocalToIso, formatWorkshopDateTime, formatWorkshopTime } from "@/lib/pregatire/dates"
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

const FIELD =
  "border-[#e5e7eb] bg-white text-[#111827] placeholder:text-[#9ca3af]"

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

function sessionTiming(workshop: MentorWorkshop, now = Date.now()) {
  const start = new Date(workshop.starts_at).getTime()
  const end = start + workshop.duration_minutes * 60_000
  if (now >= start && now < end) return { kind: "live" as const, label: "În desfășurare" }
  if (now < start && start - now <= 60 * 60 * 1000) return { kind: "soon" as const, label: "Începe curând" }
  if (now < start) return { kind: "upcoming" as const, label: "Urmează" }
  return { kind: "upcoming" as const, label: "Urmează" }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
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

  const timing = useMemo(() => (workshop ? sessionTiming(workshop) : null), [workshop])

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
      <div className="flex min-h-screen items-center justify-center bg-white text-[#111827]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
      </div>
    )
  }

  const firstName = (teacher?.name || "mentor").trim().split(/\s+/)[0]

  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-[#111827] md:h-auto md:min-h-screen md:overflow-visible">
      <Navigation />
      <div className="flex-1 overflow-y-auto pt-24 md:overflow-visible">
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#1a73e8]">Dashboard mentor</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Bună, {firstName}!</h1>
            <p className="mt-1 max-w-xl text-sm text-[#6b7280]">
              Pregătește următoarea meditație, materialele și elevii. Profilul tău apare pe /pregatire.
            </p>
          </div>
          <Button type="button" onClick={() => setShowCreate(true)} className="bg-[#111827] text-white hover:bg-black">
            <Plus className="mr-2 h-4 w-4" />
            Meditație nouă
          </Button>
        </div>

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
          <div className="space-y-6">
            {!workshop ? (
              <Card className="border-dashed border-[#d1d5db] bg-white shadow-none">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#1a73e8]">
                    <Video className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold">Nicio meditație viitoare</p>
                  <p className="max-w-md text-sm text-[#6b7280]">
                    Creează următoarea ședință ca să poți pune link-ul de Meet, suportul de curs și tema.
                  </p>
                  <Button type="button" onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Creează meditație
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="overflow-hidden border-[#eceff3] bg-white shadow-sm">
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          timing?.kind === "live"
                            ? "bg-emerald-100 text-emerald-800"
                            : timing?.kind === "soon"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-[#eef4ff] text-[#1a73e8]"
                        }`}
                      >
                        {timing?.label}
                      </span>
                      <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-medium text-[#374151]">
                        {WORKSHOP_SUBJECT_LABELS[workshop.subject]}
                      </span>
                      {workshop.is_bac ? (
                        <span className="rounded-full bg-[#111827] px-2.5 py-1 text-xs font-medium text-white">
                          BAC
                        </span>
                      ) : null}
                      {!workshop.is_published ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <CardTitle className="text-2xl leading-tight">{workshop.title}</CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[#6b7280]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatWorkshopDateTime(workshop.starts_at)}
                        </span>
                        <span>· {workshop.duration_minutes} min</span>
                        <span>· de la {formatWorkshopTime(workshop.starts_at)}</span>
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {workshop.description ? (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[#4b5563]">{workshop.description}</p>
                    ) : null}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-[#f8f8fb] p-3">
                        <p className="text-xs text-[#6b7280]">Elevi</p>
                        <p className="mt-1 text-lg font-semibold">{students.length}</p>
                      </div>
                      <div className="rounded-xl bg-[#f8f8fb] p-3">
                        <p className="text-xs text-[#6b7280]">Locuri</p>
                        <p className="mt-1 text-lg font-semibold">
                          {workshop.max_seats == null ? "Nelimitat" : workshop.max_seats}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#f8f8fb] p-3">
                        <p className="text-xs text-[#6b7280]">Energie</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold">
                          <Zap className="h-4 w-4 text-amber-500" />
                          {workshop.energy_cost}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#eceff3] bg-[#f8f8fb] p-4">
                      <Label htmlFor="mentor_meet" className="text-[#374151]">
                        Google Meet
                      </Label>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="mentor_meet"
                          value={meetUrl}
                          onChange={(event) => setMeetUrl(event.target.value)}
                          className={FIELD}
                          placeholder="https://meet.google.com/..."
                        />
                        {meetUrl ? (
                          <Button asChild className="bg-[#1a73e8] text-white hover:bg-[#1557b0] sm:min-w-[160px]">
                            <a href={meetUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Intră pe Meet
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#eceff3] bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Suport de curs și temă</CardTitle>
                    <CardDescription>
                      Elevii văd materialele după ce se înscriu. Salvează după ce termini modificările.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <WorkshopMaterialsFields
                      value={materials}
                      onChange={setMaterials}
                      workshopId={workshop.id}
                      getAccessToken={getAccessToken}
                      uploadUrl={`/api/mentor/workshops/${workshop.id}/upload`}
                      catalogSearchUrl="/api/mentor/catalog-search"
                      tone="light"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => void saveWorkshop()}
                        disabled={saving || !meetUrl.trim()}
                        className="bg-[#111827] text-white hover:bg-black"
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvează Meet și materialele
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card className="border-[#eceff3] bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="inline-flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-[#1a73e8]" />
                    Elevi înscriși
                  </CardTitle>
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-semibold text-[#374151]">
                    {students.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {!workshop ? (
                  <p className="text-sm text-[#6b7280]">Lista apare când ai o meditație viitoare.</p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-[#6b7280]">Niciun elev înscris încă.</p>
                ) : (
                  <ul className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
                    {students.map((student, index) => (
                      <li
                        key={`${student.name}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-[#f8f8fb]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-xs font-semibold text-[#1a73e8]">
                            {initials(student.name)}
                          </span>
                          <span className="truncate text-sm font-medium">{student.name}</span>
                        </div>
                        <span className="shrink-0 text-[11px] text-[#9ca3af]">
                          {formatEnrollmentDate(student.enrolled_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#eceff3] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Profil /pregatire</CardTitle>
                <CardDescription>Se vede pe cardul tău public. Doar datele tale.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {profile.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.icon_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff] text-lg font-semibold text-[#1a73e8]">
                      {initials(profile.name || "?")}
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#374151] hover:bg-[#f8f8fb]">
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
                    className={FIELD}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentor_profile_bio">Descriere</Label>
                  <Textarea
                    id="mentor_profile_bio"
                    rows={4}
                    value={profile.description}
                    onChange={(event) => setProfile((current) => ({ ...current, description: event.target.value }))}
                    className={FIELD}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#e5e7eb]"
                  onClick={() => void saveProfile()}
                  disabled={savingProfile || profile.name.trim().length < 2}
                >
                  {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvează profilul
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#eceff3] bg-white text-[#111827] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Meditație nouă</DialogTitle>
            <DialogDescription>
              Apare pe /pregatire pe numele tău. Poți adăuga materialele după ce o salvezi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="mentor_title">Titlu</Label>
              <Input
                id="mentor_title"
                value={createForm.title}
                onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                className={FIELD}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentor_description">Descriere</Label>
              <Textarea
                id="mentor_description"
                rows={3}
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, description: event.target.value }))
                }
                className={FIELD}
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
                  <SelectTrigger className={FIELD}>
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
                  className={FIELD}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Dată</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-start border-[#e5e7eb] bg-white font-normal text-[#111827] hover:bg-[#f8f8fb]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#6b7280]" />
                      {createForm.event_date ? (
                        <span className="capitalize">{formatEventDateLabel(createForm.event_date)}</span>
                      ) : (
                        <span className="text-[#9ca3af]">Alege data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto border-[#eceff3] bg-white p-0">
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
                  className={FIELD}
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
                  className={FIELD}
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
                  className={FIELD}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#eceff3] bg-[#f8f8fb] px-3 py-2">
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
                  className={FIELD}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-xl border border-[#eceff3] bg-[#f8f8fb] px-3 py-2">
              <Label htmlFor="mentor_bac">Tag BAC</Label>
              <Switch
                id="mentor_bac"
                checked={createForm.is_bac}
                onCheckedChange={(checked) =>
                  setCreateForm((current) => ({ ...current, is_bac: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#eceff3] bg-[#f8f8fb] px-3 py-2">
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
              className="bg-[#111827] text-white hover:bg-black"
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Creează meditația
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

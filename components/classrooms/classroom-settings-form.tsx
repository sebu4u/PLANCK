"use client"

import { archiveClassroomAction, regenerateJoinCodeAction, updateClassroomSettingsAction } from "@/app/classrooms/teacher-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CLASSROOM_GRADE_LABELS,
  CLASSROOM_GRADE_LEVELS,
  CLASSROOM_SUBJECT_LABELS,
  CLASSROOM_SUBJECTS,
} from "@/lib/classrooms/constants"
import type { ClassroomDetails } from "@/lib/classrooms/types"
import type { SchoolSummary } from "@/lib/classrooms/types"

interface ClassroomSettingsFormProps {
  classroom: ClassroomDetails
  isOwner: boolean
  coverFilenames: string[]
  schools: SchoolSummary[]
  saved?: boolean
  errorMessage?: string
}

export function ClassroomSettingsForm({
  classroom,
  isOwner,
  coverFilenames,
  schools,
  saved,
  errorMessage,
}: ClassroomSettingsFormProps) {
  const currentCover = classroom.cover_image?.split("/").pop() ?? ""

  return (
    <div className="space-y-6">
      {saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Setările au fost salvate.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <form action={updateClassroomSettingsAction} className="space-y-4 rounded-xl border border-[#e8eaed] bg-white p-5">
        <input type="hidden" name="classroom_id" value={classroom.id} />
        <h2 className="text-lg font-semibold text-[#111827]">Datele clasei</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nume</label>
          <Input name="name" defaultValue={classroom.name} required maxLength={120} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Materie</label>
            <select name="subject" defaultValue={classroom.subject ?? ""} className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm">
              <option value="">—</option>
              {CLASSROOM_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {CLASSROOM_SUBJECT_LABELS[subject]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">An</label>
            <select name="grade_level" defaultValue={classroom.grade_level ?? ""} className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm">
              <option value="">—</option>
              {CLASSROOM_GRADE_LEVELS.map((grade) => (
                <option key={grade} value={grade}>
                  {CLASSROOM_GRADE_LABELS[grade]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Paralelă</label>
            <Input name="section" defaultValue={classroom.section ?? ""} maxLength={1} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">An școlar</label>
            <Input name="school_year" defaultValue={classroom.school_year ?? ""} />
          </div>
        </div>
        {schools.length > 0 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Școală</label>
            <select name="school_id" defaultValue={classroom.school_id ?? ""} className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm">
              <option value="">Fără școală</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="join_locked" defaultChecked={classroom.join_locked} />
          Blochează înscrierile cu cod
        </label>
        <div className="space-y-2">
          <p className="text-sm font-medium">Copertă</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {coverFilenames.map((filename) => (
              <label key={filename} className="cursor-pointer rounded-xl border p-2 has-[:checked]:border-[#1a73e8] has-[:checked]:ring-2 has-[:checked]:ring-[#1a73e8]">
                <input type="radio" name="cover_image" value={filename} defaultChecked={filename === currentCover} className="sr-only" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/clase/${filename}`} alt="" className="h-20 w-full rounded-lg object-cover" />
              </label>
            ))}
          </div>
        </div>
        <Button type="submit">Salvează</Button>
      </form>

      {isOwner ? (
        <div className="flex flex-wrap gap-3">
          <form action={regenerateJoinCodeAction}>
            <input type="hidden" name="classroom_id" value={classroom.id} />
            <Button type="submit" variant="outline">
              Regenerează codul
            </Button>
          </form>
          <form action={archiveClassroomAction}>
            <input type="hidden" name="classroom_id" value={classroom.id} />
            <input type="hidden" name="archived" value={classroom.archived_at ? "0" : "1"} />
            <Button type="submit" variant="outline">
              {classroom.archived_at ? "Reactivează clasa" : "Arhivează clasa"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

"use client"

import {
  deleteAssignmentAction,
  duplicateAssignmentAction,
  remindIncompleteStudentsAction,
  setAssignmentStatusAction,
  updateAssignmentAction,
} from "@/app/classrooms/teacher-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ASSIGNMENT_STATUS_LABELS, LATE_POLICY_LABELS } from "@/lib/classrooms/constants"
import type { AssignmentKind, AssignmentLatePolicy, AssignmentStatus, ClassroomSummary } from "@/lib/classrooms/types"

interface AssignmentTeacherToolbarProps {
  classroomId: string
  assignmentId: string
  title: string
  description: string
  deadline: string | null
  status: AssignmentStatus
  kind: AssignmentKind
  latePolicy: AssignmentLatePolicy
  submittedCount: number
  studentCount: number
  partialCount: number
  unreviewedPhotoCount: number
  classrooms: ClassroomSummary[]
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AssignmentTeacherToolbar({
  classroomId,
  assignmentId,
  title,
  description,
  deadline,
  status,
  kind,
  latePolicy,
  submittedCount,
  studentCount,
  partialCount,
  unreviewedPhotoCount,
  classrooms,
}: AssignmentTeacherToolbarProps) {
  const teacherClassrooms = classrooms.filter((classroom) => classroom.role === "teacher")

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#e8eaed] bg-white p-3">
          <p className="text-xs text-[#6b7280]">Trimiși</p>
          <p className="mt-1 text-lg font-semibold">
            {submittedCount}/{studentCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#e8eaed] bg-white p-3">
          <p className="text-xs text-[#6b7280]">Parțial</p>
          <p className="mt-1 text-lg font-semibold">{partialCount}</p>
        </div>
        <div className="rounded-xl border border-[#e8eaed] bg-white p-3">
          <p className="text-xs text-[#6b7280]">Poze nevizionate</p>
          <p className="mt-1 text-lg font-semibold">{unreviewedPhotoCount}</p>
        </div>
        <div className="rounded-xl border border-[#e8eaed] bg-white p-3">
          <p className="text-xs text-[#6b7280]">Status</p>
          <p className="mt-1 text-lg font-semibold">{ASSIGNMENT_STATUS_LABELS[status]}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "published" ? (
          <form action={setAssignmentStatusAction}>
            <input type="hidden" name="classroom_id" value={classroomId} />
            <input type="hidden" name="assignment_id" value={assignmentId} />
            <input type="hidden" name="status" value="published" />
            <Button type="submit" size="sm">Publică</Button>
          </form>
        ) : null}
        {status !== "closed" ? (
          <form action={setAssignmentStatusAction}>
            <input type="hidden" name="classroom_id" value={classroomId} />
            <input type="hidden" name="assignment_id" value={assignmentId} />
            <input type="hidden" name="status" value="closed" />
            <Button type="submit" size="sm" variant="outline">Închide</Button>
          </form>
        ) : (
          <form action={setAssignmentStatusAction}>
            <input type="hidden" name="classroom_id" value={classroomId} />
            <input type="hidden" name="assignment_id" value={assignmentId} />
            <input type="hidden" name="status" value="published" />
            <Button type="submit" size="sm" variant="outline">Redeschide</Button>
          </form>
        )}
        <form action={remindIncompleteStudentsAction}>
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <Button type="submit" size="sm" variant="outline">Amintește restanțierilor</Button>
        </form>
        <Button asChild size="sm" variant="outline">
          <a href={`/classrooms/${classroomId}/assignments/${assignmentId}/export`}>Export CSV</a>
        </Button>
        <form action={deleteAssignmentAction}>
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <Button type="submit" size="sm" variant="outline" className="text-rose-600">Șterge</Button>
        </form>
      </div>

      <form action={updateAssignmentAction} className="space-y-3 rounded-xl border border-[#e8eaed] bg-white p-4">
        <input type="hidden" name="classroom_id" value={classroomId} />
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <Input name="title" defaultValue={title} required />
        <Textarea name="description" defaultValue={description} rows={2} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="deadline" type="datetime-local" defaultValue={toDatetimeLocal(deadline)} />
          <select name="late_policy" defaultValue={latePolicy} className="h-10 rounded-md border border-[#d1d5db] px-3 text-sm">
            {Object.entries(LATE_POLICY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">Salvează detaliile</Button>
      </form>

      {teacherClassrooms.length > 1 ? (
        <form action={duplicateAssignmentAction} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e8eaed] bg-white p-4">
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6b7280]">Copiază {kind === "test" ? "testul" : "tema"} la</label>
            <select name="target_classroom_id" defaultValue={classroomId} className="h-10 rounded-md border border-[#d1d5db] px-3 text-sm">
              {teacherClassrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" variant="outline">Duplică</Button>
        </form>
      ) : (
        <form action={duplicateAssignmentAction}>
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <input type="hidden" name="target_classroom_id" value={classroomId} />
          <Button type="submit" size="sm" variant="outline">Duplică ca ciornă</Button>
        </form>
      )}
    </div>
  )
}

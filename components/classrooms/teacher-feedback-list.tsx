"use client"

import { updateSubmissionFeedbackAction } from "@/app/classrooms/teacher-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssignmentSubmission, ClassroomMemberOverview } from "@/lib/classrooms/types"

interface TeacherFeedbackListProps {
  classroomId: string
  assignmentId: string
  members: ClassroomMemberOverview[]
  submissions: AssignmentSubmission[]
}

export function TeacherFeedbackList({ classroomId, assignmentId, members, submissions }: TeacherFeedbackListProps) {
  const students = members.filter((member) => member.role === "student")
  const byStudent = new Map<string, AssignmentSubmission[]>()
  for (const submission of submissions) {
    const list = byStudent.get(submission.student_id) ?? []
    list.push(submission)
    byStudent.set(submission.student_id, list)
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#e8eaed] bg-white p-4">
      <h2 className="text-base font-semibold">Feedback și notă</h2>
      {students.map((student) => {
        const rows = byStudent.get(student.user_id) ?? []
        const first = rows[0]
        return (
          <form key={student.user_id} action={updateSubmissionFeedbackAction} className="grid gap-2 rounded-lg border border-[#f1f5f9] p-3 sm:grid-cols-[1fr_88px_auto]">
            <input type="hidden" name="classroom_id" value={classroomId} />
            <input type="hidden" name="assignment_id" value={assignmentId} />
            <input type="hidden" name="submission_id" value={first?.id ?? ""} />
            <div>
              <p className="text-sm font-medium">{student.name}</p>
              <Input name="teacher_comment" defaultValue={first?.teacher_comment ?? ""} placeholder="Comentariu pentru elev" disabled={!first} />
            </div>
            <Input name="teacher_grade" type="number" min={1} max={10} step={0.1} defaultValue={first?.teacher_grade ?? ""} placeholder="Notă" disabled={!first} />
            <Button type="submit" size="sm" disabled={!first}>
              Salvează
            </Button>
          </form>
        )
      })}
    </div>
  )
}

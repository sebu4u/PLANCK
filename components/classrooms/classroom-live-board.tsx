"use client"

import Link from "next/link"
import {
  createExitTicketAction,
  endClassroomSessionAction,
  markAttendanceAction,
  setSessionCurrentProblemAction,
  startClassroomSessionAction,
} from "@/app/classrooms/teacher-actions"
import { ClassroomRealtimeRefresh } from "@/components/classrooms/classroom-realtime-refresh"
import { JoinCodeQr } from "@/components/classrooms/join-code-qr"
import { Button } from "@/components/ui/button"
import { ATTENDANCE_STATUS_LABELS } from "@/lib/classrooms/constants"
import type {
  AssignmentProblem,
  AssignmentSubmission,
  AttendanceStatus,
  ClassroomAssignmentListItem,
  ClassroomAttendanceRow,
  ClassroomMemberOverview,
  ClassroomSession,
} from "@/lib/classrooms/types"

interface ProblemPoolItem {
  id: string
  title: string
}

interface ClassroomLiveBoardProps {
  classroomId: string
  joinCode: string
  session: ClassroomSession | null
  recentSessions: ClassroomSession[]
  assignments: ClassroomAssignmentListItem[]
  attendance: ClassroomAttendanceRow[]
  members: ClassroomMemberOverview[]
  problems: ProblemPoolItem[]
  liveAssignment: {
    id: string
    title: string
    problems: AssignmentProblem[]
  } | null
  liveSubmissions: AssignmentSubmission[]
}

export function ClassroomLiveBoard({
  classroomId,
  joinCode,
  session,
  recentSessions,
  assignments,
  attendance,
  members,
  problems,
  liveAssignment,
  liveSubmissions,
}: ClassroomLiveBoardProps) {
  const students = members.filter((member) => member.role === "student")
  const currentProblemId = session?.current_problem_id ?? liveAssignment?.problems[0]?.id ?? null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Ora de clasă</h1>
          <p className="text-sm text-[#6b7280]">Tablou live, prezență și exit ticket.</p>
        </div>
        {session ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/classrooms/${classroomId}/ora/proiector`}>Mod proiector</Link>
            </Button>
            <form action={endClassroomSessionAction}>
              <input type="hidden" name="classroom_id" value={classroomId} />
              <input type="hidden" name="session_id" value={session.id} />
              <input type="hidden" name="freeze" value="1" />
              <Button type="submit" size="sm">Închide ora</Button>
            </form>
          </div>
        ) : (
          <form action={startClassroomSessionAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="classroom_id" value={classroomId} />
            <select name="assignment_id" className="h-10 rounded-md border border-[#d1d5db] px-3 text-sm">
              <option value="">Fără temă legată</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
            <Button type="submit">Pornește ora</Button>
          </form>
        )}
      </div>

      {!session ? (
        <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">
          Nu există o oră activă. Pornește-o ca să vezi cine e prezent și cine a trimis.
        </div>
      ) : (
        <>
          <ClassroomRealtimeRefresh
            classroomId={classroomId}
            assignmentId={session.assignment_id ?? session.exit_ticket_assignment_id}
            sessionId={session.id}
          />
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-xl border border-[#e8eaed] bg-white p-4 text-center">
              <JoinCodeQr joinCode={joinCode} size={180} />
            </div>
            <LiveProgress
              students={students}
              submissions={liveSubmissions}
              totalProblems={liveAssignment?.problems.length ?? 0}
              currentProblemId={currentProblemId}
            />
          </div>

          {liveAssignment ? (
            <form action={setSessionCurrentProblemAction} className="rounded-xl border border-[#e8eaed] bg-white p-4 space-y-2">
              <input type="hidden" name="classroom_id" value={classroomId} />
              <input type="hidden" name="session_id" value={session.id} />
              <p className="text-sm font-semibold">Problema pe proiector</p>
              <select name="problem_id" defaultValue={currentProblemId ?? ""} className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm">
                {liveAssignment.problems.map((problem, index) => (
                  <option key={problem.id} value={problem.id}>
                    {index + 1}. {problem.title}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="outline">Afișează pe proiector</Button>
            </form>
          ) : null}

          <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Prezență</h2>
              <Button asChild size="sm" variant="outline">
                <a href={`/classrooms/${classroomId}/ora/${session.id}/export`}>Export CSV</a>
              </Button>
            </div>
            <div className="space-y-2">
              {attendance.map((row) => (
                <form key={row.student_id} action={markAttendanceAction} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#f1f5f9] px-3 py-2">
                  <input type="hidden" name="classroom_id" value={classroomId} />
                  <input type="hidden" name="session_id" value={session.id} />
                  <input type="hidden" name="student_id" value={row.student_id} />
                  <p className="text-sm font-medium">{row.student_name}</p>
                  <div className="flex items-center gap-2">
                    <select name="status" defaultValue={row.status} className="h-9 rounded-md border border-[#d1d5db] px-2 text-sm">
                      {(Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {ATTENDANCE_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">Salvează</Button>
                  </div>
                </form>
              ))}
            </div>
          </div>

          <form action={createExitTicketAction} className="space-y-3 rounded-xl border border-[#e8eaed] bg-white p-4">
            <input type="hidden" name="classroom_id" value={classroomId} />
            <input type="hidden" name="session_id" value={session.id} />
            <h2 className="text-sm font-semibold">Exit ticket (5 minute)</h2>
            <p className="text-xs text-[#6b7280]">Alege 1–3 grile din catalog.</p>
            <div className="grid max-h-56 gap-2 overflow-y-auto">
              {problems.map((problem) => (
                <label key={problem.id} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="problem_ids" value={problem.id} className="mt-1" />
                  <span>{problem.title}</span>
                </label>
              ))}
            </div>
            <Button type="submit" size="sm">Pornește exit ticket</Button>
          </form>
        </>
      )}

      {recentSessions.length > 0 ? (
        <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
          <h2 className="text-sm font-semibold">Ore recente</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#6b7280]">
            {recentSessions.map((item) => (
              <li key={item.id}>
                {new Date(item.started_at).toLocaleString("ro-RO")} · {item.status === "active" ? "activă" : "încheiată"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function LiveProgress({
  students,
  submissions,
  totalProblems,
  currentProblemId,
}: {
  students: ClassroomMemberOverview[]
  submissions: AssignmentSubmission[]
  totalProblems: number
  currentProblemId: string | null
}) {
  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white p-4">
      <h2 className="text-sm font-semibold">Progres live</h2>
      <div className="mt-3 space-y-2">
        {students.map((student) => {
          const rows = submissions.filter((entry) => entry.student_id === student.user_id)
          const current = currentProblemId ? rows.find((row) => row.problem_id === currentProblemId) : undefined
          return (
            <div key={student.user_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{student.name}</span>
              <span className="text-xs text-[#6b7280]">
                {rows.length}/{totalProblems}
                {current ? (current.is_correct ? " · corect" : " · greșit") : " · nu a trimis"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

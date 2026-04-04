import { redirect } from "next/navigation"
import { removeStudentAction } from "@/app/classrooms/actions"
import { CopyJoinCodeButton } from "@/components/classrooms/copy-join-code-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getClassroomDetailsForUser,
  getClassroomLeaderboard,
  getClassroomMembers,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"

export default async function ClassroomStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const { id: classroomId } = await params
  const classroom = await getClassroomDetailsForUser(classroomId, user.id)
  if (!classroom) {
    redirect("/classrooms")
  }

  const [members, leaderboard] = await Promise.all([
    getClassroomMembers(classroomId),
    getClassroomLeaderboard(classroomId),
  ])

  const students = members.filter((member) => member.role === "student")

  return (
    <div className="space-y-4">
      {classroom.role === "teacher" ? (
        <Card className="border-[#eceff3] bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Join code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#4b5563]">
              Students join with this code: <span className="font-semibold text-[#111827]">{classroom.join_code}</span>
            </p>
            <CopyJoinCodeButton joinCode={classroom.join_code} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-[#eceff3] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">People</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {students.length === 0 ? (
            <p className="text-sm text-[#6b7280]">No students joined yet.</p>
          ) : (
            students.map((student) => (
              <div
                key={student.member_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#111827]">{student.name}</p>
                  <p className="text-xs text-[#6b7280]">{student.email || "No email available"}</p>
                  <p className="text-xs text-[#9ca3af]">
                    Joined {new Date(student.joined_at).toLocaleDateString()}
                  </p>
                </div>
                {classroom.role === "teacher" ? (
                  <form action={removeStudentAction}>
                    <input type="hidden" name="classroom_id" value={classroomId} />
                    <input type="hidden" name="member_id" value={student.member_id} />
                    <Button type="submit" variant="outline" className="text-rose-600 hover:text-rose-700">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-[#eceff3] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.length === 0 ? (
            <p className="text-sm text-[#6b7280]">No data yet.</p>
          ) : (
            leaderboard.map((row, index) => (
              <div
                key={row.user_id}
                className="flex items-center justify-between rounded-lg border border-[#e5e7eb] px-3 py-2"
              >
                <p className="text-sm text-[#111827]">
                  <span className="mr-2 font-semibold">#{index + 1}</span>
                  {row.name}
                </p>
                <p className="text-sm font-medium text-[#4b5563]">{row.solved} solved</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

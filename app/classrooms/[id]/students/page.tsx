import Image from "next/image"
import { redirect } from "next/navigation"
import { removeStudentAction } from "@/app/classrooms/actions"
import { CopyJoinCodeButton } from "@/components/classrooms/copy-join-code-button"
import { Button } from "@/components/ui/button"
import {
  getClassroomDetailsForUser,
  getClassroomMembers,
  requireAuthenticatedUser,
} from "@/lib/classrooms/server"
import type { ClassroomMemberOverview } from "@/lib/classrooms/types"
import { getRankIconPath } from "@/lib/rank-icon"

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

  const members = await getClassroomMembers(classroomId)

  const people: ClassroomMemberOverview[] = [...members].sort((a, b) => {
    if (b.elo !== a.elo) {
      return b.elo - a.elo
    }
    return a.name.localeCompare(b.name, "ro")
  })

  return (
    <div className="space-y-4">
      {classroom.role === "teacher" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8eaed] bg-white px-3 py-2 shadow-sm">
          <p className="text-xs text-[#4b5563]">
            Cod intrare:{" "}
            <span className="font-semibold tracking-wide text-[#111827]">{classroom.join_code}</span>
          </p>
          <CopyJoinCodeButton joinCode={classroom.join_code} compact />
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-[#374151]">Persoane</h2>
        {people.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Nu există încă membri în această clasă.</p>
        ) : (
          people.map((member) => {
            const initial = (member.name || "U").trim().charAt(0).toUpperCase()
            const rankIconSrc = getRankIconPath(member.rank)
            return (
              <div
                key={member.member_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8eaed] bg-white px-4 py-2.5 shadow-sm"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#e5e7eb] bg-[#f3f4f6]">
                    {member.user_icon ? (
                      <img
                        src={member.user_icon}
                        alt={`Poza de profil: ${member.name}`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#4b5563]">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white">
                    <Image
                      src={rankIconSrc}
                      alt={member.rank}
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[#111827]">{member.name}</p>
                      {member.role === "teacher" ? (
                        <span className="rounded-full bg-[#ede9fe] px-2 py-0.5 text-xs font-medium text-[#5b47d6]">
                          Profesor
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-[#6b7280]">{member.email || "Fără adresă de e-mail"}</p>
                    <p className="text-[11px] text-[#9ca3af]">
                      Înscris la {new Date(member.joined_at).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-[#111827]">{member.elo} ELO</p>
                    <p className="text-xs text-[#6b7280]">{member.rank}</p>
                  </div>
                </div>
                {classroom.role === "teacher" && member.role === "student" ? (
                  <form action={removeStudentAction}>
                    <input type="hidden" name="classroom_id" value={classroomId} />
                    <input type="hidden" name="member_id" value={member.member_id} />
                    <Button type="submit" variant="outline" size="sm" className="text-rose-600 hover:text-rose-700">
                      Elimină
                    </Button>
                  </form>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

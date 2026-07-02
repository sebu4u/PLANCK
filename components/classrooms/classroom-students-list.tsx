"use client"

import { useMemo, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import { removeStudentAction } from "@/app/classrooms/actions"
import { ClassroomStudentProfileDialog } from "@/components/classrooms/classroom-student-profile-dialog"
import { CopyJoinCodeButton } from "@/components/classrooms/copy-join-code-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClassroomMemberOverview } from "@/lib/classrooms/types"
import { getRankIconPath } from "@/lib/rank-icon"
import type { TeacherStudentProfileSnapshot } from "@/lib/teacher/server"

interface ClassroomStudentsListProps {
  classroomId: string
  joinCode: string
  isTeacher: boolean
  members: ClassroomMemberOverview[]
  studentProfiles: TeacherStudentProfileSnapshot[]
}

export function ClassroomStudentsList({
  classroomId,
  joinCode,
  isTeacher,
  members,
  studentProfiles,
}: ClassroomStudentsListProps) {
  const [selectedProfile, setSelectedProfile] = useState<TeacherStudentProfileSnapshot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const profileByUserId = useMemo(
    () => new Map(studentProfiles.map((profile) => [profile.user_id, profile])),
    [studentProfiles],
  )

  const openStudentProfile = (member: ClassroomMemberOverview) => {
    if (!isTeacher || member.role !== "student") return
    const profile = profileByUserId.get(member.user_id)
    if (!profile) return
    setSelectedProfile(profile)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        {isTeacher ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8eaed] bg-white px-3 py-2 shadow-sm">
            <p className="text-xs text-[#4b5563]">
              Cod intrare:{" "}
              <span className="font-semibold tracking-wide text-[#111827]">{joinCode}</span>
            </p>
            <CopyJoinCodeButton joinCode={joinCode} compact />
          </div>
        ) : null}

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#374151]">Persoane</h2>
          {members.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Nu există încă membri în această clasă.</p>
          ) : (
            members.map((member) => {
              const initial = (member.name || "U").trim().charAt(0).toUpperCase()
              const rankIconSrc = getRankIconPath(member.rank)
              const isClickableStudent = isTeacher && member.role === "student"

              return (
                <div
                  key={member.member_id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8eaed] bg-white px-4 py-2.5 shadow-sm",
                    isClickableStudent &&
                      "cursor-pointer transition hover:border-[#c7d2fe] hover:bg-[#fafbff] hover:shadow-md",
                  )}
                  {...(isClickableStudent
                    ? {
                        role: "button" as const,
                        tabIndex: 0,
                        onClick: () => openStudentProfile(member),
                        onKeyDown: (event: KeyboardEvent) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            openStudentProfile(member)
                          }
                        },
                      }
                    : {})}
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
                      {isTeacher ? (
                        <p className="text-xs text-[#6b7280]">{member.email || "Fără adresă de e-mail"}</p>
                      ) : null}
                      <p className="text-[11px] text-[#9ca3af]">
                        Înscris la {new Date(member.joined_at).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-[#111827]">{member.elo} ELO</p>
                      <p className="text-xs text-[#6b7280]">{member.rank}</p>
                    </div>
                  </div>
                  {isTeacher && member.role === "student" ? (
                    <form
                      action={removeStudentAction}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input type="hidden" name="classroom_id" value={classroomId} />
                      <input type="hidden" name="member_id" value={member.member_id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700"
                      >
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

      <ClassroomStudentProfileDialog
        profile={selectedProfile}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}

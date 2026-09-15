"use client"

import { useMemo, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import { removeStudentAction } from "@/app/classrooms/actions"
import {
  importClassroomStudentsCsvAction,
  inviteClassroomMemberAction,
  sendParentMessageAction,
} from "@/app/classrooms/teacher-actions"
import { ClassroomStudentProfileDialog } from "@/components/classrooms/classroom-student-profile-dialog"
import { CopyJoinCodeButton } from "@/components/classrooms/copy-join-code-button"
import { JoinCodeQr } from "@/components/classrooms/join-code-qr"
import { PlanckUserAvatar } from "@/components/planckpass/planck-user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEquippedBorderPresets } from "@/lib/planckpass/equipped-borders"
import { cn } from "@/lib/utils"
import type { ClassroomInvite, ClassroomMemberOverview, ParentClassroomMessage } from "@/lib/classrooms/types"
import { getRankIconPath } from "@/lib/rank-icon"
import type { TeacherStudentProfileSnapshot } from "@/lib/teacher/server"

interface ClassroomStudentsListProps {
  classroomId: string
  joinCode: string
  isTeacher: boolean
  isOwner: boolean
  joinLocked: boolean
  members: ClassroomMemberOverview[]
  studentProfiles: TeacherStudentProfileSnapshot[]
  invites: ClassroomInvite[]
  parentMessages: ParentClassroomMessage[]
  notice?: string
}

export function ClassroomStudentsList({
  classroomId,
  joinCode,
  isTeacher,
  isOwner,
  joinLocked,
  members,
  studentProfiles,
  invites,
  parentMessages,
  notice,
}: ClassroomStudentsListProps) {
  const [selectedProfile, setSelectedProfile] = useState<TeacherStudentProfileSnapshot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [query, setQuery] = useState("")

  const profileByUserId = useMemo(
    () => new Map(studentProfiles.map((profile) => [profile.user_id, profile])),
    [studentProfiles],
  )

  const memberUserIds = useMemo(() => members.map((m) => m.user_id), [members])
  const borderByUserId = useEquippedBorderPresets(memberUserIds)
  const students = members.filter((member) => member.role === "student")

  const filteredMembers = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return members
    return members.filter((member) => {
      const haystack = `${member.name} ${member.email}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [members, query])

  const openStudentProfile = (member: ClassroomMemberOverview) => {
    if (!isTeacher || member.role !== "student") return
    const profile = profileByUserId.get(member.user_id)
    if (!profile) return
    setSelectedProfile(profile)
    setDialogOpen(true)
  }

  const pendingInvites = invites.filter((invite) => !invite.accepted_at)

  return (
    <>
      <div className="space-y-4">
        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        {isTeacher ? (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-xl border border-[#e8eaed] bg-white p-4 text-center">
              <JoinCodeQr joinCode={joinCode} size={180} />
              <div className="mt-3 flex justify-center">
                <CopyJoinCodeButton joinCode={joinCode} compact />
              </div>
              {joinLocked ? (
                <p className="mt-2 text-xs text-amber-700">Înscrierile sunt blocate. Deblochează din Setări.</p>
              ) : null}
            </div>

            <div className="space-y-4">
              <form action={inviteClassroomMemberAction} className="rounded-xl border border-[#e8eaed] bg-white p-4 space-y-3">
                <input type="hidden" name="classroom_id" value={classroomId} />
                <p className="text-sm font-semibold text-[#111827]">Invită după e-mail</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input name="full_name" placeholder="Nume (opțional)" />
                  <Input name="email" type="email" placeholder="email@liceu.ro" required />
                  <select name="role" className="h-10 rounded-md border border-[#d1d5db] bg-white px-3 text-sm" defaultValue="student">
                    <option value="student">Elev</option>
                    {isOwner ? <option value="teacher">Co-profesor</option> : null}
                  </select>
                </div>
                <Button type="submit" size="sm">
                  Invită
                </Button>
              </form>

              <form action={importClassroomStudentsCsvAction} className="rounded-xl border border-[#e8eaed] bg-white p-4 space-y-3">
                <input type="hidden" name="classroom_id" value={classroomId} />
                <p className="text-sm font-semibold text-[#111827]">Import CSV</p>
                <p className="text-xs text-[#6b7280]">Un elev pe rând: `Nume, email@liceu.ro` sau doar e-mail.</p>
                <Textarea name="csv" rows={4} placeholder={"Popescu Ana, ana@liceu.ro\nionescu@liceu.ro"} />
                <Button type="submit" size="sm" variant="outline">
                  Importă lista
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#374151]">Persoane</h2>
            {isTeacher ? (
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Caută după nume sau e-mail"
                className="h-9 max-w-xs"
              />
            ) : null}
          </div>
          {filteredMembers.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Nu există încă membri în această clasă.</p>
          ) : (
            filteredMembers.map((member) => {
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
                    <PlanckUserAvatar
                      size={36}
                      src={member.user_icon}
                      name={member.name}
                      borderPresetId={borderByUserId[member.user_id] ?? null}
                    />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white">
                      <Image src={rankIconSrc} alt={member.rank} width={28} height={28} className="object-contain" />
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
                    </div>
                  </div>
                  {isTeacher && member.role === "student" ? (
                    <form action={removeStudentAction} onClick={(event) => event.stopPropagation()}>
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

        {isTeacher && pendingInvites.length > 0 ? (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-4">
            <h3 className="text-sm font-semibold text-[#111827]">Invitați, încă nu s-au alăturat</h3>
            <ul className="mt-2 space-y-1 text-sm text-[#4b5563]">
              {pendingInvites.map((invite) => (
                <li key={invite.id}>
                  {invite.full_name ? `${invite.full_name} · ` : ""}
                  {invite.email} ({invite.role === "teacher" ? "profesor" : "elev"})
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {isTeacher ? (
          <form action={sendParentMessageAction} className="rounded-xl border border-[#e8eaed] bg-white p-4 space-y-3">
            <input type="hidden" name="classroom_id" value={classroomId} />
            <h3 className="text-sm font-semibold text-[#111827]">Mesaj către părinți</h3>
            <select name="student_id" className="h-10 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm" defaultValue="">
              <option value="">Toți părinții clasei</option>
              {students.map((student) => (
                <option key={student.user_id} value={student.user_id}>
                  Părinții lui {student.name}
                </option>
              ))}
            </select>
            <Textarea name="body" rows={3} placeholder="Ex: Tema de luni trebuie predată până vineri." required />
            <Button type="submit" size="sm">
              Trimite
            </Button>
            {parentMessages.length > 0 ? (
              <div className="space-y-2 border-t border-[#f1f5f9] pt-3">
                {parentMessages.slice(0, 5).map((message) => (
                  <p key={message.id} className="text-xs text-[#6b7280]">
                    {new Date(message.created_at).toLocaleString("ro-RO")} · {message.student_name ?? "Clasă"}: {message.body}
                  </p>
                ))}
              </div>
            ) : null}
          </form>
        ) : null}
      </div>

      <ClassroomStudentProfileDialog
        profile={selectedProfile}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        borderPresetId={selectedProfile ? borderByUserId[selectedProfile.user_id] ?? null : null}
      />
    </>
  )
}

"use client"

import { createSchoolAction, inviteSchoolTeacherAction } from "@/app/classrooms/teacher-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"
import type { SchoolSummary } from "@/lib/classrooms/types"

interface SchoolHubProps {
  schools: SchoolSummary[]
  members: Array<{ id: string; user_id: string; name: string; role: "admin" | "teacher"; joined_at: string }>
  saved?: boolean
  errorMessage?: string
}

export function SchoolHub({ schools, members, saved, errorMessage }: SchoolHubProps) {
  const school = schools[0] ?? null

  return (
    <div className={cn("min-h-[100dvh] bg-[#f8f9fa] pt-16", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Școala mea</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Opțional: grupează clasele sub o școală și invită alți profesori. Nu înlocuiește catalogul oficial.
          </p>
        </div>
        {saved ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Salvat.</p> : null}
        {errorMessage ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}

        {!school ? (
          <form action={createSchoolAction} className="space-y-3 rounded-2xl border border-[#e8eaed] bg-white p-5">
            <label className="text-sm font-medium">Numele școlii</label>
            <Input name="name" placeholder="Liceul Teoretic ..." required />
            <Button type="submit">Creează școala</Button>
          </form>
        ) : (
          <div className="space-y-4 rounded-2xl border border-[#e8eaed] bg-white p-5">
            <h2 className="text-lg font-semibold">{school.name}</h2>
            <p className="text-sm text-[#6b7280]">{school.member_count} profesori</p>
            <ul className="space-y-1 text-sm">
              {members.map((member) => (
                <li key={member.id}>
                  {member.name} · {member.role === "admin" ? "admin" : "profesor"}
                </li>
              ))}
            </ul>
            {school.role === "admin" ? (
              <form action={inviteSchoolTeacherAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="school_id" value={school.id} />
                <Input name="email" type="email" placeholder="profesor@liceu.ro" className="max-w-xs" required />
                <Button type="submit" size="sm">Invită profesor</Button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

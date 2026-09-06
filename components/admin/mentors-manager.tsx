"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Search, Unlink, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MentorRow = {
  user_id: string
  email: string | null
  name: string | null
  nickname: string | null
  teacher_id: string
  teacher_name: string
}

type TeacherOption = {
  id: string
  name: string
  is_active: boolean
  mentor_user_id: string | null
}

type SearchUser = {
  user_id: string
  email: string | null
  name: string | null
  nickname: string | null
  is_mentor: boolean
  teacher_id: string | null
  teacher_name: string | null
}

function displayName(user: { name: string | null; nickname: string | null; email: string | null; user_id: string }) {
  return user.nickname || user.name || user.email || user.user_id
}

export function MentorsManager() {
  const [mentors, setMentors] = useState<MentorRow[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [found, setFound] = useState<SearchUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const refresh = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setError("Sesiune invalidă.")
      return
    }
    const response = await fetch("/api/admin/mentors", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Nu am putut încărca mentorii.")
      return
    }
    setMentors(data.mentors ?? [])
    setTeachers(data.teachers ?? [])
  }, [getAccessToken])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const assignedTeacherIds = useMemo(() => new Set(mentors.map((row) => row.teacher_id)), [mentors])

  const searchUser = async () => {
    setError(null)
    setSuccess(null)
    setFound(null)
    const token = await getAccessToken()
    if (!token) {
      setError("Sesiune invalidă.")
      return
    }
    const trimmed = email.trim()
    if (!trimmed) {
      setError("Introdu un email.")
      return
    }
    const response = await fetch(`/api/admin/mentors?email=${encodeURIComponent(trimmed)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Nu am găsit utilizatorul.")
      return
    }
    setFound(data.user ?? null)
    if (data.user?.teacher_id) setTeacherId(data.user.teacher_id)
  }

  const assign = async (userId: string, nextTeacherId: string) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, teacher_id: nextTeacherId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Nu am putut atribui mentorul.")
        return
      }
      setSuccess("Mentorul a fost atribuit profesorului.")
      await refresh()
      if (found?.user_id === userId) {
        const teacher = teachers.find((row) => row.id === nextTeacherId)
        setFound({
          ...found,
          is_mentor: true,
          teacher_id: nextTeacherId,
          teacher_name: teacher?.name ?? found.teacher_name,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const unassign = async (userId: string) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, teacher_id: null }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Nu am putut scoate atribuirea.")
        return
      }
      setSuccess("Atribuirea a fost scoasă.")
      await refresh()
      if (found?.user_id === userId) {
        setFound({ ...found, is_mentor: false, teacher_id: null, teacher_name: null })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
      </div>
    )
  }

  return (
    <section className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">Atribuie un mentor</h2>
        <p className="mt-1 text-sm text-gray-400">
          Caută un cont existent după email și leagă-l de un profesor de pe /pregatire. Un mentor = un profesor.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchUser()
              }}
              placeholder="email@exemplu.com"
              className="border-white/10 bg-black/40 pl-9 text-white placeholder:text-gray-500"
            />
          </div>
          <Button type="button" onClick={() => void searchUser()} disabled={saving}>
            Caută
          </Button>
        </div>

        {found ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="font-semibold">{displayName(found)}</p>
            <p className="mt-1 text-sm text-gray-400">{found.email || found.user_id}</p>
            <p className="mt-1 text-xs text-gray-500">
              {found.teacher_name
                ? `Deja atribuit: ${found.teacher_name}`
                : "Niciun profesor atribuit."}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label>Profesor /pregatire</Label>
                <Select value={teacherId || undefined} onValueChange={setTeacherId}>
                  <SelectTrigger className="border-white/20 bg-black/40 text-white">
                    <SelectValue placeholder="Selectează profesorul" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                        {assignedTeacherIds.has(teacher.id) && teacher.mentor_user_id !== found.user_id
                          ? " (deja atribuit)"
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  onClick={() => void assign(found.user_id, teacherId)}
                  disabled={saving || !teacherId}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Atribuie
                </Button>
                {found.teacher_id ? (
                  <Button type="button" variant="outline" onClick={() => void unassign(found.user_id)} disabled={saving}>
                    <Unlink className="mr-2 h-4 w-4" />
                    Scoate
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">Mentori atribuiți</h2>
        <div className="mt-4 space-y-3">
          {mentors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-gray-500">
              Niciun mentor atribuit încă.
            </div>
          ) : (
            mentors.map((mentor) => (
              <article
                key={`${mentor.user_id}-${mentor.teacher_id}`}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-semibold">{displayName(mentor)}</h3>
                  <p className="mt-1 text-sm text-gray-400">{mentor.email || mentor.user_id}</p>
                  <p className="mt-1 text-sm text-gray-300">Profesor: {mentor.teacher_name}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => void unassign(mentor.user_id)} disabled={saving}>
                  <Unlink className="mr-2 h-4 w-4" />
                  Scoate
                </Button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  ALL_DEV_SUBJECTS,
  DEV_SUBJECT_LABELS,
  type DevSubjectKey,
} from "@/lib/dev-subjects"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Search } from "lucide-react"

type DevUserRow = {
  user_id: string
  email: string | null
  name: string | null
  nickname: string | null
  is_dev: boolean
  is_admin: boolean
  dev_subjects: DevSubjectKey[] | null
  is_super_dev: boolean
  subjects_label: string
}

function displayName(user: DevUserRow) {
  return user.nickname || user.name || user.email || user.user_id
}

export function DevUsersManager() {
  const [users, setUsers] = useState<DevUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Sesiune expirată.")
      setLoading(false)
      return
    }

    const response = await fetch("/api/admin/dev-users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Nu am putut încărca utilizatorii dev.")
      setLoading(false)
      return
    }

    setUsers(data.devUsers || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) => {
      return [user.email, user.name, user.nickname, user.user_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [query, users])

  const updateLocalUser = (userId: string, updater: (user: DevUserRow) => DevUserRow) => {
    setUsers((current) => current.map((user) => (user.user_id === userId ? updater(user) : user)))
  }

  const setSuperDev = (userId: string, superDev: boolean) => {
    updateLocalUser(userId, (user) => ({
      ...user,
      dev_subjects: superDev ? null : user.dev_subjects && user.dev_subjects.length > 0 ? user.dev_subjects : ["fizica"],
      is_super_dev: superDev,
    }))
  }

  const toggleSubject = (userId: string, subject: DevSubjectKey, checked: boolean) => {
    updateLocalUser(userId, (user) => {
      const current = user.dev_subjects ?? []
      const next = checked ? Array.from(new Set([...current, subject])) : current.filter((item) => item !== subject)
      return {
        ...user,
        dev_subjects: next,
        is_super_dev: false,
      }
    })
  }

  const saveUser = async (user: DevUserRow) => {
    setError(null)
    setSuccess(null)

    const selectedSubjects = user.dev_subjects ?? []
    if (!user.is_super_dev && selectedSubjects.length === 0) {
      setError("Alege cel puțin o materie pentru dev-ul specific.")
      return
    }

    setSavingUserId(user.user_id)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Sesiune expirată.")
      setSavingUserId(null)
      return
    }

    const response = await fetch("/api/admin/dev-users", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        is_dev: true,
        dev_subjects: user.is_super_dev ? null : selectedSubjects,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Nu am putut salva permisiunile dev.")
      setSavingUserId(null)
      return
    }

    updateLocalUser(user.user_id, (current) => ({
      ...current,
      dev_subjects: data.devUser?.dev_subjects ?? null,
      is_super_dev: data.devUser?.is_super_dev ?? false,
    }))
    setSuccess(`Permisiunile pentru ${displayName(user)} au fost salvate.`)
    setSavingUserId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Loader2 className="h-7 w-7 animate-spin text-violet-300" />
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Dev users</h2>
          <p className="mt-1 text-sm text-gray-400">
            Super-dev vede tot. Dev-ul specific vede doar materiile selectate.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după email sau nume"
            className="border-white/10 bg-black/40 pl-9 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      {success ? (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-gray-500">
            Nu există utilizatori dev pentru filtrul curent.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const selectedSubjects = user.dev_subjects ?? []
            const isSaving = savingUserId === user.user_id
            return (
              <article key={user.user_id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{displayName(user)}</h3>
                      {user.is_admin ? <Badge className="bg-violet-500/20 text-violet-100">admin</Badge> : null}
                      <Badge variant="outline" className="border-white/20 text-gray-200">
                        {user.is_super_dev ? "Super-dev" : "Dev per materie"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{user.email || user.user_id}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={user.is_super_dev ? "default" : "outline"}
                      onClick={() => setSuperDev(user.user_id, true)}
                    >
                      Super-dev
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!user.is_super_dev ? "default" : "outline"}
                      onClick={() => setSuperDev(user.user_id, false)}
                    >
                      Per materie
                    </Button>
                  </div>
                </div>

                {!user.is_super_dev ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {ALL_DEV_SUBJECTS.map((subject) => {
                      const checked = selectedSubjects.includes(subject)
                      return (
                        <label
                          key={subject}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-200"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => toggleSubject(user.user_id, subject, value === true)}
                          />
                          {DEV_SUBJECT_LABELS[subject]}
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-400">Acces la toate materiile: mate, fizică, info, bio și AI.</p>
                )}

                <div className="mt-4 flex justify-end">
                  <Button type="button" onClick={() => saveUser(user)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvează
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

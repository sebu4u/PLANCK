"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { allPhysicsCatalogCategories } from "@/lib/physics-catalog-chapters"
import { LearningPathsManager } from "@/components/admin/learning-paths-manager"
import { Loader2, ArrowLeft } from "lucide-react"

type SubjectKey = "fizica" | "informatica"
type ApiSubject = "physics" | "informatics"

function toApiSubject(key: SubjectKey): ApiSubject {
  return key === "fizica" ? "physics" : "informatics"
}

async function getAuthJsonHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function DevCatalogTools({ subjectKey }: { subjectKey: SubjectKey }) {
  const apiSubject = toApiSubject(subjectKey)
  const title = subjectKey === "fizica" ? "Fizică — catalog & learning path" : "Informatică — catalog & learning path"

  const physicsChapters = useMemo(() => allPhysicsCatalogCategories().sort((a, b) => a.localeCompare(b, "ro")), [])

  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [problems, setProblems] = useState<unknown[]>([])

  const [physForm, setPhysForm] = useState({
    id: "",
    title: "",
    statement: "",
    difficulty: "Ușor",
    category: physicsChapters[0] ?? "",
    class: "10",
    youtube_url: "",
    description: "",
  })

  const [infoForm, setInfoForm] = useState({
    slug: "",
    title: "",
    statement_markdown: "",
    difficulty: "Ușor",
    class: "10",
    chapter: "Capitol neclasificat",
    language: "cpp" as "cpp" | "python",
  })

  const reloadProblems = useCallback(async () => {
    const headers = await getAuthJsonHeaders()
    if (!headers) return
    const q = new URLSearchParams({ catalog: apiSubject })
    const res = await fetch(`/api/dev/problems?${q}`, { headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr(data.error || "Nu am putut încărca problemele.")
      return
    }
    setProblems(data.problems || [])
  }, [apiSubject])

  useEffect(() => {
    void reloadProblems()
  }, [reloadProblems])

  const run = async (fn: () => Promise<void>) => {
    setErr(null)
    setFlash(null)
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const submitPhysicsProblem = () =>
    run(async () => {
      const headers = await getAuthJsonHeaders()
      if (!headers) {
        setErr("Sesiune indisponibilă.")
        return
      }
      const res = await fetch("/api/dev/problems", {
        method: "POST",
        headers,
        body: JSON.stringify({
          catalog: "physics",
          id: physForm.id.trim(),
          title: physForm.title.trim(),
          statement: physForm.statement.trim(),
          difficulty: physForm.difficulty.trim(),
          category: physForm.category.trim(),
          class: Number.parseInt(physForm.class, 10),
          youtube_url: physForm.youtube_url.trim(),
          description: physForm.description.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "Eroare la salvare.")
        return
      }
      setFlash("Problema de fizică a fost adăugată.")
      setPhysForm((f) => ({ ...f, id: "", title: "", statement: "" }))
      await reloadProblems()
    })

  const submitInfoProblem = () =>
    run(async () => {
      const headers = await getAuthJsonHeaders()
      if (!headers) {
        setErr("Sesiune indisponibilă.")
        return
      }
      const res = await fetch("/api/dev/problems", {
        method: "POST",
        headers,
        body: JSON.stringify({
          catalog: "informatics",
          slug: infoForm.slug.trim().toLowerCase(),
          title: infoForm.title.trim(),
          statement_markdown: infoForm.statement_markdown.trim(),
          difficulty: infoForm.difficulty.trim(),
          class: Number.parseInt(infoForm.class, 10),
          chapter: infoForm.chapter.trim() || "Capitol neclasificat",
          language: infoForm.language,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "Eroare la salvare.")
        return
      }
      setFlash("Problema de informatică a fost adăugată.")
      setInfoForm((f) => ({ ...f, slug: "", title: "", statement_markdown: "" }))
      await reloadProblems()
    })

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-24">
        <Link
          href="/dashboard/dev"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la dev dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Mai jos poți <strong>adăuga probleme</strong> în catalog. Secțiunea learning path folosește același editor ca la
          admin (preview, itemi, salvare, reordonare), dar <strong>fără ștergere sau dezactivare</strong> itemi.
        </p>

        {flash ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {flash}
          </p>
        ) : null}
        {err ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{err}</p>
        ) : null}

        <section className="mt-10 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Catalog probleme</h2>
          {subjectKey === "fizica" ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="ID (ex: M501)" value={physForm.id} onChange={(e) => setPhysForm({ ...physForm, id: e.target.value })} />
                <Input placeholder="Titlu" value={physForm.title} onChange={(e) => setPhysForm({ ...physForm, title: e.target.value })} />
              </div>
              <Textarea
                placeholder="Enunț (statement)"
                rows={4}
                value={physForm.statement}
                onChange={(e) => setPhysForm({ ...physForm, statement: e.target.value })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Capitol catalog
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={physForm.category}
                    onChange={(e) => setPhysForm({ ...physForm, category: e.target.value })}
                  >
                    {physicsChapters.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Dificultate
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={physForm.difficulty}
                    onChange={(e) => setPhysForm({ ...physForm, difficulty: e.target.value })}
                  >
                    {["Inițiere", "Ușor", "Mediu", "Avansat"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Clasă (9–12)
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={physForm.class}
                    onChange={(e) => setPhysForm({ ...physForm, class: e.target.value })}
                  >
                    {["9", "10", "11", "12"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  placeholder="YouTube URL"
                  value={physForm.youtube_url}
                  onChange={(e) => setPhysForm({ ...physForm, youtube_url: e.target.value })}
                />
              </div>
              <Input
                placeholder="Descriere scurtă (opțional)"
                value={physForm.description}
                onChange={(e) => setPhysForm({ ...physForm, description: e.target.value })}
              />
              <Button type="button" disabled={busy} onClick={() => void submitPhysicsProblem()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adaugă problema de fizică"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="slug-url (ex: suma-n)" value={infoForm.slug} onChange={(e) => setInfoForm({ ...infoForm, slug: e.target.value })} />
                <Input placeholder="Titlu" value={infoForm.title} onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })} />
              </div>
              <Textarea
                placeholder="Enunț (markdown)"
                rows={5}
                value={infoForm.statement_markdown}
                onChange={(e) => setInfoForm({ ...infoForm, statement_markdown: e.target.value })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Clasă
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={infoForm.class}
                    onChange={(e) => setInfoForm({ ...infoForm, class: e.target.value })}
                  >
                    {["9", "10", "11", "12"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Limbă șablon
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={infoForm.language}
                    onChange={(e) => setInfoForm({ ...infoForm, language: e.target.value as "cpp" | "python" })}
                  >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                  </select>
                </label>
              </div>
              <Input placeholder="Capitol (text)" value={infoForm.chapter} onChange={(e) => setInfoForm({ ...infoForm, chapter: e.target.value })} />
              <Button type="button" disabled={busy} onClick={() => void submitInfoProblem()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adaugă problema de informatică"}
              </Button>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Ultimele înregistrări ({problems.length})</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-gray-600">
              {problems.slice(0, 40).map((p: { id?: string; slug?: string; title?: string }) => (
                <li key={p.slug ?? p.id}>
                  <span className="font-mono text-gray-800">{p.slug ?? p.id}</span>
                  {" — "}
                  {p.title}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <div className="min-h-screen bg-black text-white pb-16 pt-8">
        <div className="container mx-auto max-w-[1500px] px-4">
          <h2 className="mb-2 text-xl font-bold text-white">Learning paths (/invata)</h2>
          <p className="mb-6 text-sm text-gray-400">
            Același panou ca la admin: structură, preview lecție, formulare pentru toate tipurile de itemi. Pentru capitole
            noi sau alte operații doar admin, folosește contul admin.
          </p>
          <LearningPathsManager mode="dev" devSubject={apiSubject} />
        </div>
      </div>
    </>
  )
}

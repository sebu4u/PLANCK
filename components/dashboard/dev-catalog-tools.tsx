"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { allPhysicsCatalogCategories } from "@/lib/physics-catalog-chapters"
import { LearningPathsManager } from "@/components/admin/learning-paths-manager"
import { Loader2, ArrowLeft } from "lucide-react"

type SubjectKey = "fizica" | "informatica" | "matematica"
type ApiSubject = "physics" | "informatics" | "math"

function toApiSubject(key: SubjectKey): ApiSubject {
  if (key === "fizica") return "physics"
  if (key === "informatica") return "informatics"
  return "math"
}

const CODING_DIFFICULTIES = ["Inițiere", "Ușor", "Mediu", "Avansat", "Concurs"] as const

const MATH_DIFFICULTIES = ["Ușor", "Mediu", "Avansat"] as const

function initialMathForm() {
  return {
    id: "",
    title: "",
    description: "",
    statement: "",
    tags: "",
    difficulty: "Ușor" as (typeof MATH_DIFFICULTIES)[number],
    class: "10",
    image_url: "",
    youtube_url: "",
    sub1: { label: "a)", content: "" },
    sub2: { label: "b)", content: "" },
    sub3: { label: "c)", content: "" },
  }
}

function initialInformaticsForm() {
  return {
    slug: "",
    title: "",
    statement_markdown: "",
    requirement_markdown: "",
    input_format: "",
    output_format: "",
    constraints_markdown: "",
    difficulty: "Ușor" as (typeof CODING_DIFFICULTIES)[number],
    class: "10",
    chapter: "Capitol neclasificat",
    language: "python" as "cpp" | "python",
    time_limit_ms: 2000,
    memory_limit_kb: 256000,
    tags: "",
    sample_input: "",
    sample_output: "",
    explanation_markdown: "",
    boilerplate_cpp: "",
    boilerplate_python: "",
  }
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
  const title =
    subjectKey === "fizica"
      ? "Fizică — catalog & learning path"
      : subjectKey === "informatica"
        ? "Informatică — catalog & learning path"
        : "Matematică — catalog"

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

  const [infoForm, setInfoForm] = useState(initialInformaticsForm)

  const [mathForm, setMathForm] = useState(initialMathForm)

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
      const tagList = infoForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const res = await fetch("/api/dev/problems", {
        method: "POST",
        headers,
        body: JSON.stringify({
          catalog: "informatics",
          slug: infoForm.slug.trim().toLowerCase(),
          title: infoForm.title.trim(),
          statement_markdown: infoForm.statement_markdown.trim(),
          requirement_markdown: infoForm.requirement_markdown.trim(),
          input_format: infoForm.input_format.trim(),
          output_format: infoForm.output_format.trim(),
          constraints_markdown: infoForm.constraints_markdown.trim(),
          difficulty: infoForm.difficulty.trim(),
          class: Number.parseInt(infoForm.class, 10),
          chapter: infoForm.chapter.trim() || "Capitol neclasificat",
          language: infoForm.language,
          time_limit_ms: infoForm.time_limit_ms,
          memory_limit_kb: infoForm.memory_limit_kb,
          tags: tagList,
          sample_input: infoForm.sample_input,
          sample_output: infoForm.sample_output,
          explanation_markdown: infoForm.explanation_markdown.trim(),
          boilerplate_cpp: infoForm.boilerplate_cpp,
          boilerplate_python: infoForm.boilerplate_python,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "Eroare la salvare.")
        return
      }
      setFlash("Problema de informatică a fost adăugată.")
      setInfoForm(initialInformaticsForm())
      await reloadProblems()
    })

  const submitMathProblem = () =>
    run(async () => {
      const headers = await getAuthJsonHeaders()
      if (!headers) {
        setErr("Sesiune indisponibilă.")
        return
      }
      const subpoints: { label: string; content: string }[] = []
      for (const s of [mathForm.sub1, mathForm.sub2, mathForm.sub3]) {
        const label = s.label.trim()
        const content = s.content.trim()
        if (label && content) {
          subpoints.push({ label, content })
        }
      }
      const res = await fetch("/api/dev/problems", {
        method: "POST",
        headers,
        body: JSON.stringify({
          catalog: "math",
          id: mathForm.id.trim(),
          title: mathForm.title.trim(),
          description: mathForm.description.trim(),
          statement: mathForm.statement.trim(),
          difficulty: mathForm.difficulty.trim(),
          class: Number.parseInt(mathForm.class, 10),
          tags: mathForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          answer_subpoints: subpoints,
          image_url: mathForm.image_url.trim(),
          youtube_url: mathForm.youtube_url.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "Eroare la salvare.")
        return
      }
      setFlash("Problema de matematică a fost adăugată.")
      setMathForm(initialMathForm())
      await reloadProblems()
    })

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 pb-10 pt-24">
        <Link
          href="/dashboard/dev"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la dev dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {subjectKey === "matematica" ? (
            <>
              Adaugă probleme în catalogul de matematică.{" "}
              <strong>Răspunsurile (subpunctele)</strong> sunt stocate în baza de date dar{" "}
              <strong>nu apar</strong> în paginile publice ale site-ului.
            </>
          ) : (
            <>
              Mai jos poți <strong>adăuga probleme</strong> în catalog. Secțiunea learning path folosește același editor ca la
              admin (preview, itemi, salvare, reordonare), dar <strong>fără ștergere sau dezactivare</strong> itemi.
            </>
          )}
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
          ) : subjectKey === "matematica" ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                ID-ul este definit de tine (ex. <span className="font-mono">GEO001</span>). Poți adăuga până la trei subpuncte
                pentru răspuns; acestea nu apar în catalogul public.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="ID (ex: GEO001)"
                  value={mathForm.id}
                  onChange={(e) => setMathForm({ ...mathForm, id: e.target.value })}
                />
                <Input
                  placeholder="Titlu"
                  value={mathForm.title}
                  onChange={(e) => setMathForm({ ...mathForm, title: e.target.value })}
                />
              </div>
              <Input
                placeholder="Descriere scurtă (opțional)"
                value={mathForm.description}
                onChange={(e) => setMathForm({ ...mathForm, description: e.target.value })}
              />
              <Textarea
                placeholder="Enunț (markdown / LaTeX OK)"
                rows={5}
                value={mathForm.statement}
                onChange={(e) => setMathForm({ ...mathForm, statement: e.target.value })}
              />
              <Input
                placeholder="Tags (virgulă): geometrie, clasa-10"
                value={mathForm.tags}
                onChange={(e) => setMathForm({ ...mathForm, tags: e.target.value })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Dificultate
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={mathForm.difficulty}
                    onChange={(e) =>
                      setMathForm({
                        ...mathForm,
                        difficulty: e.target.value as (typeof MATH_DIFFICULTIES)[number],
                      })
                    }
                  >
                    {MATH_DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Clasă (9–12)
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                    value={mathForm.class}
                    onChange={(e) => setMathForm({ ...mathForm, class: e.target.value })}
                  >
                    {["9", "10", "11", "12"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="URL imagine (opțional)"
                  value={mathForm.image_url}
                  onChange={(e) => setMathForm({ ...mathForm, image_url: e.target.value })}
                />
                <Input
                  placeholder="YouTube URL (opțional)"
                  value={mathForm.youtube_url}
                  onChange={(e) => setMathForm({ ...mathForm, youtube_url: e.target.value })}
                />
              </div>
              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-xs font-semibold text-gray-700">Răspunsuri (max. 3, doar dev)</p>
                {(["sub1", "sub2", "sub3"] as const).map((key) => (
                  <div key={key} className="grid gap-2 sm:grid-cols-[100px_1fr]">
                    <Input
                      placeholder="Etichetă"
                      value={mathForm[key].label}
                      onChange={(e) =>
                        setMathForm({
                          ...mathForm,
                          [key]: { ...mathForm[key], label: e.target.value },
                        })
                      }
                    />
                    <Textarea
                      placeholder="Conținut (markdown)"
                      rows={2}
                      value={mathForm[key].content}
                      onChange={(e) =>
                        setMathForm({
                          ...mathForm,
                          [key]: { ...mathForm[key], content: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <Button type="button" disabled={busy} onClick={() => void submitMathProblem()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adaugă problema de matematică"}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-xs text-gray-500">
                Completează câmpurile obligatorii (slug, titlu, enunț). Restul sunt opționale. După creare, adaugă testele în
                Supabase (<span className="font-mono">coding_problem_tests</span>) ca problema să poată fi judecată.
              </p>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Identitate</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="info-slug">Slug URL</Label>
                    <Input
                      id="info-slug"
                      placeholder="ex: suma-cifrelor"
                      value={infoForm.slug}
                      onChange={(e) => setInfoForm({ ...infoForm, slug: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-title">Titlu</Label>
                    <Input
                      id="info-title"
                      placeholder="Titlul problemei"
                      value={infoForm.title}
                      onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Enunț</p>
                <div className="space-y-1.5">
                  <Label htmlFor="info-statement">Statement (markdown)</Label>
                  <Textarea
                    id="info-statement"
                    placeholder="Enunțul principal…"
                    rows={5}
                    value={infoForm.statement_markdown}
                    onChange={(e) => setInfoForm({ ...infoForm, statement_markdown: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="info-requirement">Cerință (markdown)</Label>
                  <Textarea
                    id="info-requirement"
                    placeholder="Ce trebuie să calculeze / să afișeze elevul…"
                    rows={3}
                    value={infoForm.requirement_markdown}
                    onChange={(e) => setInfoForm({ ...infoForm, requirement_markdown: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Intrare / ieșire</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="info-input-fmt">Format intrare</Label>
                    <Textarea
                      id="info-input-fmt"
                      placeholder="Descrierea formatului de intrare…"
                      rows={4}
                      value={infoForm.input_format}
                      onChange={(e) => setInfoForm({ ...infoForm, input_format: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-output-fmt">Format ieșire</Label>
                    <Textarea
                      id="info-output-fmt"
                      placeholder="Descrierea formatului de ieșire…"
                      rows={4}
                      value={infoForm.output_format}
                      onChange={(e) => setInfoForm({ ...infoForm, output_format: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="info-constraints">Constrângeri (markdown)</Label>
                  <Textarea
                    id="info-constraints"
                    placeholder="Limite pe n, timp, memorie în text…"
                    rows={3}
                    value={infoForm.constraints_markdown}
                    onChange={(e) => setInfoForm({ ...infoForm, constraints_markdown: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Catalog & limbă</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="info-class">Clasă</Label>
                    <select
                      id="info-class"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={infoForm.class}
                      onChange={(e) => setInfoForm({ ...infoForm, class: e.target.value })}
                    >
                      {["9", "10", "11", "12"].map((c) => (
                        <option key={c} value={c}>
                          Clasa {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-difficulty">Dificultate</Label>
                    <select
                      id="info-difficulty"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={infoForm.difficulty}
                      onChange={(e) =>
                        setInfoForm({
                          ...infoForm,
                          difficulty: e.target.value as (typeof CODING_DIFFICULTIES)[number],
                        })
                      }
                    >
                      {CODING_DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-language">Limbă (șablon IDE)</Label>
                    <select
                      id="info-language"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={infoForm.language}
                      onChange={(e) => setInfoForm({ ...infoForm, language: e.target.value as "cpp" | "python" })}
                    >
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="info-chapter">Capitol</Label>
                    <Input
                      id="info-chapter"
                      placeholder="Capitol neclasificat"
                      value={infoForm.chapter}
                      onChange={(e) => setInfoForm({ ...infoForm, chapter: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Limite judge</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="info-time-ms">Timp (ms)</Label>
                    <Input
                      id="info-time-ms"
                      type="number"
                      min={1}
                      step={100}
                      value={infoForm.time_limit_ms}
                      onChange={(e) =>
                        setInfoForm({
                          ...infoForm,
                          time_limit_ms: Number.parseInt(e.target.value, 10) || 2000,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-mem-kb">Memorie (KB)</Label>
                    <Input
                      id="info-mem-kb"
                      type="number"
                      min={1}
                      step={1024}
                      value={infoForm.memory_limit_kb}
                      onChange={(e) =>
                        setInfoForm({
                          ...infoForm,
                          memory_limit_kb: Number.parseInt(e.target.value, 10) || 256000,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Etichete & exemplu</p>
                <div className="space-y-1.5">
                  <Label htmlFor="info-tags">Tags (separate prin virgulă)</Label>
                  <Input
                    id="info-tags"
                    placeholder="arrays, greedy, clasa-10"
                    value={infoForm.tags}
                    onChange={(e) => setInfoForm({ ...infoForm, tags: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="info-sample-in">Exemplu intrare</Label>
                    <Textarea
                      id="info-sample-in"
                      rows={4}
                      className="font-mono text-xs"
                      value={infoForm.sample_input}
                      onChange={(e) => setInfoForm({ ...infoForm, sample_input: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-sample-out">Exemplu ieșire</Label>
                    <Textarea
                      id="info-sample-out"
                      rows={4}
                      className="font-mono text-xs"
                      value={infoForm.sample_output}
                      onChange={(e) => setInfoForm({ ...infoForm, sample_output: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Explicație & șabloane</p>
                <div className="space-y-1.5">
                  <Label htmlFor="info-explanation">Explicație / rezolvare (markdown)</Label>
                  <Textarea
                    id="info-explanation"
                    rows={4}
                    placeholder="Opțional: sketch de rezolvare pentru echipă…"
                    value={infoForm.explanation_markdown}
                    onChange={(e) => setInfoForm({ ...infoForm, explanation_markdown: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="info-boiler-cpp">Boilerplate C++</Label>
                    <Textarea
                      id="info-boiler-cpp"
                      rows={6}
                      className="font-mono text-xs"
                      placeholder={'#include <iostream>\n...'}
                      value={infoForm.boilerplate_cpp}
                      onChange={(e) => setInfoForm({ ...infoForm, boilerplate_cpp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="info-boiler-py">Boilerplate Python</Label>
                    <Textarea
                      id="info-boiler-py"
                      rows={6}
                      className="font-mono text-xs"
                      placeholder="# citește cu input()…"
                      value={infoForm.boilerplate_python}
                      onChange={(e) => setInfoForm({ ...infoForm, boilerplate_python: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="button" disabled={busy} onClick={() => void submitInfoProblem()} className="w-full sm:w-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adaugă problema de informatică"}
              </Button>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-800">Ultimele înregistrări ({problems.length})</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-gray-600">
              {problems.slice(0, 40).map((p) => {
                const row = p as { id?: string; slug?: string; title?: string }
                return (
                  <li key={row.slug ?? row.id}>
                    <span className="font-mono text-gray-800">{row.slug ?? row.id}</span>
                    {" — "}
                    {row.title}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </main>

      {subjectKey === "fizica" || subjectKey === "informatica" || subjectKey === "matematica" ? (
        <div className="min-h-screen bg-black pb-16 pt-8 text-white">
          <div className="container mx-auto max-w-[1500px] px-4">
            <h2 className="mb-2 text-xl font-bold text-white">Learning paths (/invata)</h2>
            <p className="mb-6 text-sm text-gray-400">
              Același panou ca la admin: structură, preview lecție, formulare pentru toate tipurile de itemi. Pentru capitole
              noi sau alte operații doar admin, folosește contul admin.
            </p>
            <LearningPathsManager mode="dev" />
          </div>
        </div>
      ) : null}
    </>
  )
}

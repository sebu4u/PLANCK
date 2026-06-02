"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CODING_DIFFICULTIES } from "@/lib/dev-informatics-problem"
import { InformaticsProblemLivePreview } from "@/components/dashboard/informatics-problem-live-preview"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"

type InformaticsTestRow = {
  stdin: string
  expected_stdout: string
  is_sample: boolean
  weight: number
}

type InformaticsFormState = {
  slug: string
  title: string
  statement_markdown: string
  requirement_markdown: string
  input_format: string
  output_format: string
  constraints_markdown: string
  difficulty: (typeof CODING_DIFFICULTIES)[number]
  class: string
  chapter: string
  language: "cpp" | "python"
  time_limit_ms: number
  memory_limit_kb: number
  points: number
  is_active: boolean
  tags: string
  sample_input: string
  sample_output: string
  explanation_markdown: string
  boilerplate_cpp: string
  boilerplate_python: string
  tests: InformaticsTestRow[]
}

function initialTestRow(isSample = false): InformaticsTestRow {
  return { stdin: "", expected_stdout: "", is_sample: isSample, weight: 1 }
}

function problemToForm(problem: Record<string, unknown>, tests: Array<Record<string, unknown>>): InformaticsFormState {
  const tags = Array.isArray(problem.tags)
    ? (problem.tags as string[]).join(", ")
    : typeof problem.tags === "string"
      ? problem.tags
      : ""

  return {
    slug: typeof problem.slug === "string" ? problem.slug : "",
    title: typeof problem.title === "string" ? problem.title : "",
    statement_markdown: typeof problem.statement_markdown === "string" ? problem.statement_markdown : "",
    requirement_markdown: typeof problem.requirement_markdown === "string" ? problem.requirement_markdown : "",
    input_format: typeof problem.input_format === "string" ? problem.input_format : "",
    output_format: typeof problem.output_format === "string" ? problem.output_format : "",
    constraints_markdown: typeof problem.constraints_markdown === "string" ? problem.constraints_markdown : "",
    difficulty: (typeof problem.difficulty === "string" ? problem.difficulty : "Ușor") as InformaticsFormState["difficulty"],
    class: String(problem.class ?? "10"),
    chapter: typeof problem.chapter === "string" ? problem.chapter : "Capitol neclasificat",
    language: problem.language === "cpp" ? "cpp" : "python",
    time_limit_ms: typeof problem.time_limit_ms === "number" ? problem.time_limit_ms : 2000,
    memory_limit_kb: typeof problem.memory_limit_kb === "number" ? problem.memory_limit_kb : 256000,
    points: typeof problem.points === "number" ? problem.points : 100,
    is_active: problem.is_active !== false,
    tags,
    sample_input: typeof problem.sample_input === "string" ? problem.sample_input : "",
    sample_output: typeof problem.sample_output === "string" ? problem.sample_output : "",
    explanation_markdown: typeof problem.explanation_markdown === "string" ? problem.explanation_markdown : "",
    boilerplate_cpp: typeof problem.boilerplate_cpp === "string" ? problem.boilerplate_cpp : "",
    boilerplate_python: typeof problem.boilerplate_python === "string" ? problem.boilerplate_python : "",
    tests:
      tests.length > 0
        ? tests.map((t) => ({
            stdin: typeof t.stdin === "string" ? t.stdin : "",
            expected_stdout: typeof t.expected_stdout === "string" ? t.expected_stdout : "",
            is_sample: t.is_sample === true,
            weight: typeof t.weight === "number" ? t.weight : Number.parseFloat(String(t.weight)) || 1,
          }))
        : [initialTestRow(true)],
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

export function InformaticsProblemEditorClient({ slug }: { slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<InformaticsFormState | null>(null)

  const loadProblem = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const headers = await getAuthJsonHeaders()
    if (!headers) {
      setErr("Sesiune indisponibilă.")
      setLoading(false)
      return
    }

    const res = await fetch(`/api/dev/problems/${encodeURIComponent(slug)}`, { headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr(data.error || "Nu am putut încărca problema.")
      setLoading(false)
      return
    }

    setForm(problemToForm(data.problem as Record<string, unknown>, (data.tests as Array<Record<string, unknown>>) ?? []))
    setLoading(false)
  }, [slug])

  useEffect(() => {
    void loadProblem()
  }, [loadProblem])

  const handleSave = async () => {
    if (!form) return
    setErr(null)
    setFlash(null)
    setBusy(true)

    try {
      const headers = await getAuthJsonHeaders()
      if (!headers) {
        setErr("Sesiune indisponibilă.")
        return
      }

      const tagList = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await fetch(`/api/dev/problems/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          slug: form.slug.trim().toLowerCase(),
          title: form.title.trim(),
          statement_markdown: form.statement_markdown.trim(),
          requirement_markdown: form.requirement_markdown.trim(),
          input_format: form.input_format,
          output_format: form.output_format,
          constraints_markdown: form.constraints_markdown.trim(),
          difficulty: form.difficulty.trim(),
          class: Number.parseInt(form.class, 10),
          chapter: form.chapter.trim() || "Capitol neclasificat",
          language: form.language,
          time_limit_ms: form.time_limit_ms,
          memory_limit_kb: form.memory_limit_kb,
          points: form.points,
          is_active: form.is_active,
          tags: tagList,
          sample_input: form.sample_input,
          sample_output: form.sample_output,
          explanation_markdown: form.explanation_markdown.trim(),
          boilerplate_cpp: form.boilerplate_cpp,
          boilerplate_python: form.boilerplate_python,
          tests: form.tests.map((t) => ({
            stdin: t.stdin,
            expected_stdout: t.expected_stdout,
            is_sample: t.is_sample,
            weight: t.weight,
          })),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "Eroare la salvare.")
        return
      }

      setFlash("Problema a fost actualizată.")
      const newSlug = typeof data.problem?.slug === "string" ? data.problem.slug : form.slug
      if (data.slug_changed && newSlug !== slug) {
        router.replace(`/dashboard/dev/catalog/informatica/edit/${newSlug}`)
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="mx-auto flex max-w-4xl items-center justify-center px-4 pb-10 pt-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </main>
      </>
    )
  }

  if (!form) {
    return (
      <>
        <Navigation />
        <main className="mx-auto max-w-[1800px] px-4 pb-10 pt-24">
          <p className="text-sm text-red-700">{err || "Problema nu a putut fi încărcată."}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/informatica/probleme">Înapoi la catalog</Link>
          </Button>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-[1800px] px-4 pb-10 pt-24">
        <Link
          href="/informatica/probleme"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la catalog
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Editează problema de informatică</h1>
        <p className="mt-2 text-sm text-gray-600">
          Modifică toate câmpurile problemei <span className="font-mono text-gray-800">{slug}</span>.
        </p>

        {flash ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {flash}
          </p>
        ) : null}
        {err ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{err}</p>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-2 xl:items-start">
          <section className="space-y-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Identitate</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-slug">Slug URL</Label>
                <Input
                  id="edit-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Titlu</Label>
                <Input
                  id="edit-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked === true })}
              />
              Activă în catalog
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Enunț</p>
            <div className="space-y-1.5">
              <Label htmlFor="edit-statement">Statement (markdown)</Label>
              <Textarea
                id="edit-statement"
                rows={5}
                value={form.statement_markdown}
                onChange={(e) => setForm({ ...form, statement_markdown: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-requirement">Cerință (markdown)</Label>
              <Textarea
                id="edit-requirement"
                rows={3}
                value={form.requirement_markdown}
                onChange={(e) => setForm({ ...form, requirement_markdown: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Intrare / ieșire</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-input-fmt">Format intrare</Label>
                <Textarea
                  id="edit-input-fmt"
                  rows={4}
                  value={form.input_format}
                  onChange={(e) => setForm({ ...form, input_format: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-output-fmt">Format ieșire</Label>
                <Textarea
                  id="edit-output-fmt"
                  rows={4}
                  value={form.output_format}
                  onChange={(e) => setForm({ ...form, output_format: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-constraints">Constrângeri (markdown)</Label>
              <Textarea
                id="edit-constraints"
                rows={3}
                value={form.constraints_markdown}
                onChange={(e) => setForm({ ...form, constraints_markdown: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Catalog & limbă</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-class">Clasă</Label>
                <select
                  id="edit-class"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                >
                  {["9", "10", "11", "12"].map((c) => (
                    <option key={c} value={c}>
                      Clasa {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-difficulty">Dificultate</Label>
                <select
                  id="edit-difficulty"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      difficulty: e.target.value as InformaticsFormState["difficulty"],
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
                <Label htmlFor="edit-language">Limbă</Label>
                <select
                  id="edit-language"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value as "cpp" | "python" })}
                >
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-chapter">Capitol</Label>
                <Input
                  id="edit-chapter"
                  value={form.chapter}
                  onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Limite judge</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-points">Puncte</Label>
                <Input
                  id="edit-points"
                  type="number"
                  min={0}
                  value={form.points}
                  onChange={(e) =>
                    setForm({ ...form, points: Number.parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-time-ms">Timp (ms)</Label>
                <Input
                  id="edit-time-ms"
                  type="number"
                  min={1}
                  value={form.time_limit_ms}
                  onChange={(e) =>
                    setForm({ ...form, time_limit_ms: Number.parseInt(e.target.value, 10) || 2000 })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-mem-kb">Memorie (KB)</Label>
                <Input
                  id="edit-mem-kb"
                  type="number"
                  min={1}
                  value={form.memory_limit_kb}
                  onChange={(e) =>
                    setForm({ ...form, memory_limit_kb: Number.parseInt(e.target.value, 10) || 256000 })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Etichete & exemplu</p>
            <div className="space-y-1.5">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-sample-in">Exemplu intrare</Label>
                <Textarea
                  id="edit-sample-in"
                  rows={4}
                  className="font-mono text-xs"
                  value={form.sample_input}
                  onChange={(e) => setForm({ ...form, sample_input: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-sample-out">Exemplu ieșire</Label>
                <Textarea
                  id="edit-sample-out"
                  rows={4}
                  className="font-mono text-xs"
                  value={form.sample_output}
                  onChange={(e) => setForm({ ...form, sample_output: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Explicație & șabloane</p>
            <div className="space-y-1.5">
              <Label htmlFor="edit-explanation">Explicație (markdown)</Label>
              <Textarea
                id="edit-explanation"
                rows={4}
                value={form.explanation_markdown}
                onChange={(e) => setForm({ ...form, explanation_markdown: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-boiler-cpp">Boilerplate C++</Label>
                <Textarea
                  id="edit-boiler-cpp"
                  rows={6}
                  className="font-mono text-xs"
                  value={form.boilerplate_cpp}
                  onChange={(e) => setForm({ ...form, boilerplate_cpp: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-boiler-py">Boilerplate Python</Label>
                <Textarea
                  id="edit-boiler-py"
                  rows={6}
                  className="font-mono text-xs"
                  value={form.boilerplate_python}
                  onChange={(e) => setForm({ ...form, boilerplate_python: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Teste judge</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setForm({ ...form, tests: [...form.tests, initialTestRow(false)] })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Adaugă test
              </Button>
            </div>

            <div className="space-y-4">
              {form.tests.map((test, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800">Test #{index + 1}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-gray-700">
                        <Checkbox
                          checked={test.is_sample}
                          onCheckedChange={(checked) =>
                            setForm({
                              ...form,
                              tests: form.tests.map((row, i) =>
                                i === index ? { ...row, is_sample: checked === true } : row
                              ),
                            })
                          }
                        />
                        Exemplu
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-700">
                        Pondere
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          className="h-8 w-20"
                          value={test.weight}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              tests: form.tests.map((row, i) =>
                                i === index
                                  ? { ...row, weight: Number.parseFloat(e.target.value) || 0 }
                                  : row
                              ),
                            })
                          }
                        />
                      </label>
                      {form.tests.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-600 hover:text-red-700"
                          disabled={busy}
                          onClick={() =>
                            setForm({ ...form, tests: form.tests.filter((_, i) => i !== index) })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Intrare (stdin)</Label>
                      <Textarea
                        rows={4}
                        className="font-mono text-xs"
                        value={test.stdin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tests: form.tests.map((row, i) =>
                              i === index ? { ...row, stdin: e.target.value } : row
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ieșire așteptată</Label>
                      <Textarea
                        rows={4}
                        className="font-mono text-xs"
                        value={test.expected_stdout}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tests: form.tests.map((row, i) =>
                              i === index ? { ...row, expected_stdout: e.target.value } : row
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={busy} onClick={() => void handleSave()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvează modificările"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/informatica/probleme/${form.slug}`} target="_blank" rel="noopener noreferrer">
                Vezi în catalog
              </Link>
            </Button>
          </div>
          </section>

          <div className="xl:sticky xl:top-24">
            <InformaticsProblemLivePreview
              input={{
                slug: form.slug,
                title: form.title,
                statement_markdown: form.statement_markdown,
                requirement_markdown: form.requirement_markdown,
                input_format: form.input_format,
                output_format: form.output_format,
                constraints_markdown: form.constraints_markdown,
                difficulty: form.difficulty,
                class: form.class,
                chapter: form.chapter,
                language: form.language,
                tags: form.tags,
                sample_input: form.sample_input,
                sample_output: form.sample_output,
                boilerplate_cpp: form.boilerplate_cpp,
                boilerplate_python: form.boilerplate_python,
                tests: form.tests,
                submitSlug: form.slug.trim() || slug,
              }}
            />
          </div>
        </div>
      </main>
    </>
  )
}

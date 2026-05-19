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
import { DevCelebrationCard } from "@/components/dashboard/dev-celebration-card"
import { pickRandomDevCelebrationMessage, type DevCelebrationMessage } from "@/lib/dev-celebration-messages"
import { Loader2, ArrowLeft, Plus, Trash2, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

type SubjectKey = "fizica" | "informatica" | "matematica" | "biologie"
type ApiSubject = "physics" | "informatics" | "math"
type DevLearningPathSubject = "physics" | "informatics" | "math" | "biology"

function toApiSubject(key: SubjectKey): ApiSubject {
  if (key === "fizica") return "physics"
  if (key === "informatica") return "informatics"
  return "math"
}

function toDevLearningPathSubject(key: SubjectKey): DevLearningPathSubject | undefined {
  if (key === "fizica") return "physics"
  if (key === "informatica") return "informatics"
  if (key === "matematica") return "math"
  if (key === "biologie") return "biology"
  return undefined
}

function publicCatalogHref(key: SubjectKey): string {
  if (key === "fizica") return "/probleme"
  if (key === "informatica") return "/informatica/probleme"
  return "/matematica/probleme"
}

const CODING_DIFFICULTIES = ["Inițiere", "Ușor", "Mediu", "Avansat", "Concurs"] as const

const MATH_DIFFICULTIES = ["Ușor", "Mediu", "Avansat"] as const

type MathValueSubpointForm = {
  label: string
  text_before: string
  text_after: string
  correct_value: string
}

function initialMathValueSubpoint(label: string): MathValueSubpointForm {
  return { label, text_before: "", text_after: "", correct_value: "" }
}

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
    sub1: initialMathValueSubpoint("a)"),
    sub2: initialMathValueSubpoint("b)"),
    sub3: initialMathValueSubpoint("c)"),
  }
}

type InformaticsTestRow = {
  stdin: string
  expected_stdout: string
  is_sample: boolean
  weight: number
}

function initialInformaticsTestRow(isSample = false): InformaticsTestRow {
  return { stdin: "", expected_stdout: "", is_sample: isSample, weight: 1 }
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
    tests: [initialInformaticsTestRow(true)],
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
  const devLearningPathSubject = toDevLearningPathSubject(subjectKey)
  const learningPathsOnly = subjectKey === "biologie"
  const title =
    subjectKey === "fizica"
      ? "Fizică — catalog & learning path"
      : subjectKey === "informatica"
        ? "Informatică — catalog & learning path"
        : subjectKey === "biologie"
          ? "Biologie — learning path"
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

  const [celebration, setCelebration] = useState<DevCelebrationMessage | null>(null)

  const triggerDevCelebration = useCallback(() => {
    setCelebration(pickRandomDevCelebrationMessage())
  }, [])

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
      triggerDevCelebration()
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

      const tests = infoForm.tests.map((t) => ({
        stdin: t.stdin,
        expected_stdout: t.expected_stdout,
        is_sample: t.is_sample,
        weight: t.weight,
      }))
      const totalWeight = tests.reduce((sum, t) => sum + (Number.isFinite(t.weight) && t.weight >= 0 ? t.weight : 0), 0)
      if (tests.length === 0) {
        setErr("Adaugă cel puțin un test pentru judge.")
        return
      }
      if (totalWeight <= 0) {
        setErr("Suma ponderilor testelor trebuie să fie mai mare decât 0.")
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
          tests,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || "Eroare la salvare.")
        return
      }
      const count = typeof data.tests_count === "number" ? data.tests_count : tests.length
      setFlash(`Problema de informatică a fost adăugată (${count} teste).`)
      triggerDevCelebration()
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
      const subpoints: {
        label: string
        text_before: string
        text_after: string
        correct_value: number
      }[] = []
      for (const s of [mathForm.sub1, mathForm.sub2, mathForm.sub3]) {
        const label = s.label.trim()
        const text_before = s.text_before
        const text_after = s.text_after
        const correctRaw = s.correct_value.trim().replace(",", ".")
        const hasAny =
          label.length > 0 ||
          text_before.trim().length > 0 ||
          text_after.trim().length > 0 ||
          correctRaw.length > 0
        if (!hasAny) continue
        if (!label) {
          setErr("Fiecare subpunct completat trebuie să aibă o etichetă (ex. a)).")
          return
        }
        const correct_value = Number.parseFloat(correctRaw)
        if (!Number.isFinite(correct_value)) {
          setErr(`Subpunctul «${label}»: valoarea corectă trebuie să fie un număr.`)
          return
        }
        subpoints.push({ label, text_before, text_after, correct_value })
      }
      if (subpoints.length === 0) {
        setErr("Adaugă cel puțin un subpunct de răspuns (text înainte/după + valoare corectă).")
        return
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
          value_subpoints: subpoints,
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
      triggerDevCelebration()
      setMathForm(initialMathForm())
      await reloadProblems()
    })

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-[1500px] px-4 pb-10 pt-24">
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
              Adaugă probleme în catalogul de matematică. Răspunsurile (valoare numerică între text
              înainte/după, ca la fizică) sunt folosite în learning path pentru verificare;{" "}
              <strong>nu apar</strong> în catalogul public.
            </>
          ) : learningPathsOnly ? (
            <>
              Adaugă și editează capitole, lecții și itemi pentru parcursul de biologie (/invata). Editorul este același
              ca la admin (preview, itemi interactive, salvare, reordonare), dar <strong>fără ștergere sau dezactivare</strong>{" "}
              itemi.
            </>
          ) : (
            <>
              Poți <strong>adăuga probleme</strong> în catalog sau edita <strong>learning path</strong>-urile din tab-urile de
              mai jos. Editorul de learning path este același ca la admin (preview, itemi, salvare, reordonare), dar{" "}
              <strong>fără ștergere sau dezactivare</strong> itemi.
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

        <Tabs defaultValue={learningPathsOnly ? "learning-paths" : "catalog"} className="mt-10">
          {!learningPathsOnly ? (
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="catalog">Catalog probleme</TabsTrigger>
              <TabsTrigger value="learning-paths">Learning paths</TabsTrigger>
            </TabsList>
          ) : null}

          {!learningPathsOnly ? (
          <TabsContent value="catalog" className="mt-6">
            <section className="mx-auto max-w-4xl space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Catalog probleme</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href={publicCatalogHref(subjectKey)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Deschide catalogul public
                  </Link>
                </Button>
              </div>
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
                ID-ul este definit de tine (ex. <span className="font-mono">GEO001</span>). Fiecare subpunct are text înainte
                și după câmpul numeric (LaTeX cu <span className="font-mono">$...$</span> OK), plus valoarea corectă — ca la
                problemele de fizică. Minim un subpunct obligatoriu.
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
              <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-xs font-semibold text-gray-700">Răspunsuri numerice (max. 3)</p>
                {(["sub1", "sub2", "sub3"] as const).map((key, index) => (
                  <div key={key} className="space-y-2 rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-xs font-medium text-gray-600">Subpunct {index + 1}</p>
                    <div className="grid gap-2 sm:grid-cols-[88px_1fr_1fr]">
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
                      <Input
                        placeholder="Text înainte ($...$ OK)"
                        value={mathForm[key].text_before}
                        onChange={(e) =>
                          setMathForm({
                            ...mathForm,
                            [key]: { ...mathForm[key], text_before: e.target.value },
                          })
                        }
                      />
                      <Input
                        placeholder="Text după"
                        value={mathForm[key].text_after}
                        onChange={(e) =>
                          setMathForm({
                            ...mathForm,
                            [key]: { ...mathForm[key], text_after: e.target.value },
                          })
                        }
                      />
                    </div>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Valoare corectă (ex: 12.5)"
                      value={mathForm[key].correct_value}
                      onChange={(e) =>
                        setMathForm({
                          ...mathForm,
                          [key]: { ...mathForm[key], correct_value: e.target.value },
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
                Completează câmpurile obligatorii (slug, titlu, enunț) și cel puțin un test judge. Restul sunt opționale.
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

              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Teste judge</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Fiecare test are intrare (<span className="font-mono">stdin</span>) și ieșire așteptată. Marchează
                      „Exemplu” pentru teste vizibile în enunț (pondere 0 = nu contează la scor).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      setInfoForm((f) => ({
                        ...f,
                        tests: [...f.tests, initialInformaticsTestRow(false)],
                      }))
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Adaugă test
                  </Button>
                </div>

                <div className="space-y-4">
                  {infoForm.tests.map((test, index) => (
                    <div key={index} className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-800">Test #{index + 1}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-gray-700">
                            <Checkbox
                              checked={test.is_sample}
                              onCheckedChange={(checked) =>
                                setInfoForm((f) => ({
                                  ...f,
                                  tests: f.tests.map((row, i) =>
                                    i === index ? { ...row, is_sample: checked === true } : row
                                  ),
                                }))
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
                                setInfoForm((f) => ({
                                  ...f,
                                  tests: f.tests.map((row, i) =>
                                    i === index
                                      ? { ...row, weight: Number.parseFloat(e.target.value) || 0 }
                                      : row
                                  ),
                                }))
                              }
                            />
                          </label>
                          {infoForm.tests.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-600 hover:text-red-700"
                              disabled={busy}
                              onClick={() =>
                                setInfoForm((f) => ({
                                  ...f,
                                  tests: f.tests.filter((_, i) => i !== index),
                                }))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`info-test-stdin-${index}`}>Intrare (stdin)</Label>
                          <Textarea
                            id={`info-test-stdin-${index}`}
                            rows={4}
                            className="font-mono text-xs"
                            placeholder={"2\n3\n"}
                            value={test.stdin}
                            onChange={(e) =>
                              setInfoForm((f) => ({
                                ...f,
                                tests: f.tests.map((row, i) =>
                                  i === index ? { ...row, stdin: e.target.value } : row
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`info-test-stdout-${index}`}>Ieșire așteptată</Label>
                          <Textarea
                            id={`info-test-stdout-${index}`}
                            rows={4}
                            className="font-mono text-xs"
                            placeholder="5"
                            value={test.expected_stdout}
                            onChange={(e) =>
                              setInfoForm((f) => ({
                                ...f,
                                tests: f.tests.map((row, i) =>
                                  i === index ? { ...row, expected_stdout: e.target.value } : row
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
          </TabsContent>
          ) : null}

          <TabsContent value="learning-paths" className="mt-6">
            <div className="rounded-xl border border-gray-800 bg-black pb-8 pt-6 text-white">
              <div className="px-4 sm:px-6">
                <h2 className="text-xl font-bold text-white">Learning paths (/invata)</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Același panou ca la admin: structură, preview lecție, formulare pentru toate tipurile de itemi. Pentru capitole
                  noi sau alte operații doar admin, folosește contul admin.
                </p>
              </div>
              <div className="mt-6 px-4 sm:px-6">
                <LearningPathsManager
                  mode="dev"
                  devSubject={devLearningPathSubject}
                  onDevCelebrate={triggerDevCelebration}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {celebration ? (
        <DevCelebrationCard message={celebration} onContinue={() => setCelebration(null)} />
      ) : null}
    </>
  )
}

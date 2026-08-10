"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PRACTICE_SUBJECTS, type PracticeSubjectId } from "@/lib/practice-subject"
import {
  PRACTICE_TEST_DIFFICULTIES,
  type PracticeTestCatalogSubject,
  type PracticeTestCustomItem,
  type PracticeTestItem,
  type PracticeTestRow,
} from "@/lib/practice-tests"

type CatalogHit = {
  id: string
  title: string
  difficulty?: string
  class?: number
}

function newItemId() {
  return `item_${Math.random().toString(36).slice(2, 10)}`
}

function emptyCustomGrila(): PracticeTestCustomItem {
  const a = `opt_${Math.random().toString(36).slice(2, 6)}`
  const b = `opt_${Math.random().toString(36).slice(2, 6)}`
  return {
    type: "custom",
    id: newItemId(),
    answerType: "grila",
    statement: "",
    options: [
      { id: a, label: "Varianta A" },
      { id: b, label: "Varianta B" },
    ],
    correctOptionId: a,
  }
}

function emptyCustomValue(): PracticeTestCustomItem {
  return {
    type: "custom",
    id: newItemId(),
    answerType: "value",
    statement: "",
    valueSubpoints: [{ label: "Răspuns", correct_value: 0 }],
  }
}

const emptyForm = (): Omit<PracticeTestRow, "id" | "created_at" | "updated_at"> & {
  id?: string
} => ({
  title: "",
  description: "",
  subject: "fizica",
  class: 9,
  chapter: "",
  difficulty: "Mediu",
  time_limit_seconds: 600,
  items: [],
  is_published: false,
})

export function PracticeTestsManager() {
  const [tests, setTests] = useState<PracticeTestRow[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogHits, setCatalogHits] = useState<CatalogHit[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const loadTests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Sesiune lipsă.")
      const res = await fetch("/api/admin/teste", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Nu am putut încărca testele.")
      setTests(data.tests ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadTests()
  }, [loadTests])

  const searchCatalog = async () => {
    setCatalogLoading(true)
    try {
      const token = await getToken()
      if (!token) return
      const catalog: PracticeTestCatalogSubject =
        form.subject === "matematica" ? "matematica" : "fizica"
      const params = new URLSearchParams()
      if (catalog === "matematica") params.set("catalog", "math")
      if (catalogSearch.trim()) params.set("search", catalogSearch.trim())
      const res = await fetch(`/api/admin/problems?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Căutare eșuată.")
      setCatalogHits(data.problems ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare căutare.")
    } finally {
      setCatalogLoading(false)
    }
  }

  const addCatalogItem = (hit: CatalogHit) => {
    const subject: PracticeTestCatalogSubject =
      form.subject === "matematica" ? "matematica" : "fizica"
    const item: PracticeTestItem = {
      type: "catalog",
      id: newItemId(),
      subject,
      problemId: hit.id,
    }
    setForm((prev) => ({ ...prev, items: [...prev.items, item] }))
    setMessage(`Adăugat: ${hit.title}`)
  }

  const moveItem = (index: number, dir: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.items]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, items: next }
    })
  }

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateCustomItem = (index: number, item: PracticeTestCustomItem) => {
    setForm((prev) => {
      const next = [...prev.items]
      next[index] = item
      return { ...prev, items: next }
    })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Sesiune lipsă.")
      const payload = {
        title: form.title,
        description: form.description,
        subject: form.subject,
        class: form.class,
        chapter: form.chapter,
        difficulty: form.difficulty,
        time_limit_seconds: form.time_limit_seconds,
        items: form.items,
        is_published: form.is_published,
      }
      const isEdit = Boolean(form.id)
      const res = await fetch(
        isEdit ? `/api/admin/teste?id=${encodeURIComponent(form.id!)}` : "/api/admin/teste",
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Salvare eșuată.")
      setMessage(isEdit ? "Test actualizat." : "Test creat.")
      setForm(emptyForm())
      await loadTests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare salvare.")
    } finally {
      setSaving(false)
    }
  }

  const removeTest = async (id: string) => {
    if (!window.confirm("Ștergi acest test?")) return
    const token = await getToken()
    if (!token) return
    const res = await fetch(`/api/admin/teste?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Ștergere eșuată.")
      return
    }
    if (form.id === id) setForm(emptyForm())
    await loadTests()
  }

  const editTest = (test: PracticeTestRow) => {
    setForm({
      id: test.id,
      title: test.title,
      description: test.description,
      subject: test.subject,
      class: test.class,
      chapter: test.chapter,
      difficulty: test.difficulty,
      time_limit_seconds: test.time_limit_seconds,
      items: test.items,
      is_published: test.is_published,
    })
    setMessage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Se încarcă…
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{form.id ? "Editează test" : "Test nou"}</h2>
          {form.id ? (
            <Button variant="ghost" size="sm" onClick={() => setForm(emptyForm())}>
              Anulează
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-gray-400">Titlu</span>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="bg-black/40"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-gray-400">Descriere</span>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="bg-black/40"
              rows={2}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-400">Materie</span>
            <select
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.subject}
              onChange={(e) =>
                setForm((p) => ({ ...p, subject: e.target.value as PracticeSubjectId }))
              }
            >
              {PRACTICE_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-400">Clasă</span>
            <select
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.class}
              onChange={(e) => setForm((p) => ({ ...p, class: Number(e.target.value) }))}
            >
              {[9, 10, 11, 12].map((c) => (
                <option key={c} value={c}>
                  a {c}-a
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-400">Capitol</span>
            <Input
              value={form.chapter}
              onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
              className="bg-black/40"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-400">Dificultate</span>
            <select
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2"
              value={form.difficulty}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  difficulty: e.target.value as (typeof PRACTICE_TEST_DIFFICULTIES)[number],
                }))
              }
            >
              {PRACTICE_TEST_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-400">Limită timp (secunde)</span>
            <Input
              type="number"
              min={30}
              max={14400}
              value={form.time_limit_seconds}
              onChange={(e) =>
                setForm((p) => ({ ...p, time_limit_seconds: Number(e.target.value) || 600 }))
              }
              className="bg-black/40"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
            />
            Publicat
          </label>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="font-medium">Probleme ({form.items.length})</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setForm((p) => ({ ...p, items: [...p.items, emptyCustomGrila()] }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Grilă proprie
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setForm((p) => ({ ...p, items: [...p.items, emptyCustomValue()] }))
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Valoare proprie
            </Button>
          </div>

          {form.subject !== "informatica" ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="mb-2 text-xs text-gray-400">
                Adaugă din catalog ({form.subject === "matematica" ? "matematică" : "fizică"})
              </p>
              <div className="flex gap-2">
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Caută după titlu…"
                  className="bg-black/40"
                />
                <Button type="button" variant="secondary" onClick={() => void searchCatalog()}>
                  {catalogLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {catalogHits.length > 0 ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                  {catalogHits.slice(0, 20).map((hit) => (
                    <li key={hit.id} className="flex items-center justify-between gap-2 py-1">
                      <span className="truncate">{hit.title}</span>
                      <Button size="sm" variant="ghost" onClick={() => addCatalogItem(hit)}>
                        Adaugă
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="mb-3 text-xs text-gray-400">
              Pentru informatică folosește probleme proprii (grilă / valoare).
            </p>
          )}

          <ul className="space-y-3">
            {form.items.map((item, index) => (
              <li key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    #{index + 1} · {item.type === "catalog" ? `catalog · ${item.problemId}` : item.answerType}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => moveItem(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => moveItem(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>

                {item.type === "custom" ? (
                  <div className="space-y-2">
                    <Textarea
                      value={item.statement}
                      onChange={(e) =>
                        updateCustomItem(index, { ...item, statement: e.target.value })
                      }
                      placeholder="Enunț"
                      className="bg-black/40"
                      rows={3}
                    />
                    {item.answerType === "grila" && item.options ? (
                      <div className="space-y-2">
                        {item.options.map((opt, optIndex) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${item.id}`}
                              checked={item.correctOptionId === opt.id}
                              onChange={() =>
                                updateCustomItem(index, { ...item, correctOptionId: opt.id })
                              }
                            />
                            <Input
                              value={opt.label}
                              onChange={(e) => {
                                const options = item.options!.map((o, i) =>
                                  i === optIndex ? { ...o, label: e.target.value } : o,
                                )
                                updateCustomItem(index, { ...item, options })
                              }}
                              className="bg-black/40"
                            />
                          </div>
                        ))}
                        {item.options.length < 6 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const id = `opt_${Math.random().toString(36).slice(2, 6)}`
                              updateCustomItem(index, {
                                ...item,
                                options: [...(item.options ?? []), { id, label: "Variantă nouă" }],
                              })
                            }}
                          >
                            Adaugă variantă
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                    {item.answerType === "value" && item.valueSubpoints ? (
                      <div className="space-y-2">
                        {item.valueSubpoints.map((sp, spIndex) => (
                          <div key={spIndex} className="flex gap-2">
                            <Input
                              value={sp.label ?? ""}
                              placeholder="Etichetă"
                              onChange={(e) => {
                                const valueSubpoints = item.valueSubpoints!.map((s, i) =>
                                  i === spIndex ? { ...s, label: e.target.value } : s,
                                )
                                updateCustomItem(index, { ...item, valueSubpoints })
                              }}
                              className="bg-black/40"
                            />
                            <Input
                              type="number"
                              value={sp.correct_value}
                              onChange={(e) => {
                                const valueSubpoints = item.valueSubpoints!.map((s, i) =>
                                  i === spIndex
                                    ? { ...s, correct_value: Number(e.target.value) }
                                    : s,
                                )
                                updateCustomItem(index, { ...item, valueSubpoints })
                              }}
                              className="w-28 bg-black/40"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">
                    Problemă catalog ({item.subject}): <code>{item.problemId}</code>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvează
        </Button>
      </section>

      <aside className="space-y-3">
        <h2 className="text-lg font-semibold">Teste existente</h2>
        {tests.length === 0 ? (
          <p className="text-sm text-gray-400">Niciun test încă.</p>
        ) : (
          <ul className="space-y-2">
            {tests.map((test) => (
              <li
                key={test.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left hover:underline" onClick={() => editTest(test)}>
                    <p className="font-medium">{test.title}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {test.subject} · cl. {test.class} · {test.difficulty} ·{" "}
                      {test.is_published ? "publicat" : "draft"} · {test.items.length} pb.
                    </p>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => void removeTest(test.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

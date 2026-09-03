"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Loader2, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import {
  getLessonExerciseCatalogsForSubject,
  getLessonExerciseKindLabel,
  type LessonExerciseAdminItem,
  type LessonExerciseCatalogOption,
  type LessonExerciseContentType,
} from "@/lib/lesson-exercises"
import type { CursuriSubjectId } from "@/lib/cursuri-subjects"

interface LessonExercisesEditorProps {
  lessonId: string
  subject: CursuriSubjectId
}

interface SearchResult {
  id: string
  title: string
  subtitle: string
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export function LessonExercisesEditor({ lessonId, subject }: LessonExercisesEditorProps) {
  const catalogs = useMemo(() => getLessonExerciseCatalogsForSubject(subject), [subject])
  const [catalogIndex, setCatalogIndex] = useState(0)
  const catalog: LessonExerciseCatalogOption | undefined = catalogs[catalogIndex] ?? catalogs[0]

  const [items, setItems] = useState<LessonExerciseAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    setCatalogIndex(0)
    setSearch("")
    setDebouncedSearch("")
    setResults([])
  }, [subject, lessonId])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Sesiune expirată. Reîncarcă pagina.")
        return
      }
      const response = await fetch(`/api/admin/lessons/${lessonId}/exercises`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Nu am putut încărca exercițiile.")
      }
      setItems(Array.isArray(data.exercises) ? data.exercises : [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Nu am putut încărca exercițiile.")
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const persistItems = useCallback(
    async (next: LessonExerciseAdminItem[]) => {
      const previous = items
      setItems(next)
      setSaving(true)
      setError(null)
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error("Sesiune expirată. Reîncarcă pagina.")
        }
        const response = await fetch(`/api/admin/lessons/${lessonId}/exercises`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items: next.map((item) => ({
              content_type: item.content_type,
              content_id: item.content_id,
            })),
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Nu am putut salva exercițiile.")
        }
        setItems(Array.isArray(data.exercises) ? data.exercises : next)
      } catch (err: unknown) {
        setItems(previous)
        setError(err instanceof Error ? err.message : "Nu am putut salva exercițiile.")
      } finally {
        setSaving(false)
      }
    },
    [items, lessonId],
  )

  useEffect(() => {
    if (!catalog) {
      setResults([])
      return
    }

    let cancelled = false
    const run = async () => {
      setSearching(true)
      try {
        const accessToken = await getAccessToken()
        if (!accessToken || cancelled) return

        if (catalog.type === "grila") {
          const params = new URLSearchParams({
            action: "quiz-questions",
            materie: catalog.materie || "fizica",
          })
          if (debouncedSearch) params.set("search", debouncedSearch)
          const response = await fetch(`/api/admin/learning-paths?${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error || "Nu am putut căuta grilele.")
          const mapped: SearchResult[] = (data.quizQuestions || []).slice(0, 40).map(
            (question: {
              id: string
              title?: string | null
              statement?: string
              question_id?: string
              class?: number
            }) => ({
              id: question.id,
              title: question.title?.trim() || question.statement || question.question_id || question.id,
              subtitle: `ID: ${question.question_id || question.id}${question.class ? ` · Clasa ${question.class}` : ""}`,
            }),
          )
          if (!cancelled) setResults(mapped)
          return
        }

        const params = new URLSearchParams()
        if (catalog.type === "math_problem") params.set("catalog", "math")
        if (catalog.type === "coding_problem") {
          params.set("catalog", "informatics")
          if (catalog.language) params.set("language", catalog.language)
        }
        if (debouncedSearch) params.set("search", debouncedSearch)
        params.set("limit", "40")

        const response = await fetch(`/api/admin/problems?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Nu am putut căuta problemele.")
        const mapped: SearchResult[] = (data.problems || []).slice(0, 40).map(
          (problem: {
            id: string
            title?: string
            difficulty?: string
            class?: number
            display_id?: string | null
            slug?: string
          }) => ({
            id: problem.id,
            title: problem.display_id
              ? `${problem.display_id} · ${problem.title || problem.id}`
              : problem.title || problem.id,
            subtitle: [
              problem.difficulty,
              problem.class ? `Clasa ${problem.class}` : null,
              problem.slug ? problem.slug : null,
            ]
              .filter(Boolean)
              .join(" · "),
          }),
        )
        if (!cancelled) setResults(mapped)
      } catch (err: unknown) {
        if (!cancelled) {
          setResults([])
          setError(err instanceof Error ? err.message : "Nu am putut căuta conținutul.")
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [catalog, debouncedSearch])

  const attachedKeys = useMemo(
    () => new Set(items.map((item) => `${item.content_type}:${item.content_id}`)),
    [items],
  )

  const addItem = (result: SearchResult, type: LessonExerciseContentType) => {
    if (attachedKeys.has(`${type}:${result.id}`)) return
    void persistItems([
      ...items,
      {
        id: `temp-${result.id}`,
        content_type: type,
        content_id: result.id,
        order_index: items.length,
        title: result.title,
      },
    ])
  }

  const removeItem = (index: number) => {
    void persistItems(items.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    void persistItems(next)
  }

  if (catalogs.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Exerciții rezolvate</p>
        <p className="mt-1 text-xs text-gray-400">
          Pentru această materie nu există încă un catalog de probleme sau grile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Exerciții rezolvate</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Atașează probleme sau grile din catalog. Apar în tab-ul de la finalul lecției.
          </p>
        </div>
        {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" /> : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Se încarcă exercițiile...
        </div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed border-white/15 px-3 py-4 text-center text-xs text-gray-500">
              Niciun exercițiu atașat.
            </p>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.content_type}:${item.content_id}`}
                className="flex items-start gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {getLessonExerciseKindLabel(item.content_type)}
                    {item.difficulty ? ` · ${item.difficulty}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                    disabled={saving || index === 0}
                    onClick={() => moveItem(index, -1)}
                    title="Mută sus"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                    disabled={saving || index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                    title="Mută jos"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    disabled={saving}
                    onClick={() => removeItem(index)}
                    title="Scoate"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="space-y-2 pt-1">
        <Label className="text-gray-300">Adaugă din catalog</Label>
        {catalogs.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {catalogs.map((option, index) => (
              <Button
                key={`${option.type}-${option.materie || option.language || "default"}`}
                type="button"
                size="sm"
                variant={catalogIndex === index ? "default" : "outline"}
                className={
                  catalogIndex === index
                    ? "h-8 bg-white text-black hover:bg-white/90"
                    : "h-8 border-white/20 bg-transparent text-gray-200 hover:bg-white/10 hover:text-white"
                }
                onClick={() => {
                  setCatalogIndex(index)
                  setSearch("")
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              catalog?.type === "grila"
                ? "Caută grilă după enunț, titlu sau ID"
                : "Caută problemă după titlu"
            }
            className="border-white/20 bg-white/5 pl-9 text-white"
          />
          {search ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => setSearch("")}
              aria-label="Șterge căutarea"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-2">
          {searching ? (
            <div className="py-8 text-center text-sm text-gray-400">
              <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
              Se caută...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">Nu există rezultate.</div>
          ) : (
            results.map((result) => {
              const type = catalog!.type
              const attached = attachedKeys.has(`${type}:${result.id}`)
              return (
                <button
                  key={result.id}
                  type="button"
                  disabled={attached || saving}
                  onClick={() => addItem(result, type)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    attached
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-semibold">{result.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {attached ? "Deja atașat" : result.subtitle}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

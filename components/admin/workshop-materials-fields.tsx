"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowDown, ArrowUp, FileText, Loader2, Plus, Search, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  WORKSHOP_HOMEWORK_ITEM_LABELS,
  WORKSHOP_HOMEWORK_ITEM_TYPES,
  workshopHomeworkHref,
  type WorkshopHomeworkItem,
  type WorkshopHomeworkItemType,
} from "@/lib/pregatire/types"

type CatalogKind = WorkshopHomeworkItemType

interface SearchHit {
  id: string
  title: string
  subtitle?: string
  href: string
}

export interface WorkshopMaterialsFormValue {
  whiteboard_url: string
  notes_markdown: string
  notes_pdf_path: string
  notes_pdf_url: string
  homework_pdf_path: string
  homework_pdf_url: string
  homework_items: WorkshopHomeworkItem[]
}

export const EMPTY_WORKSHOP_MATERIALS_FORM: WorkshopMaterialsFormValue = {
  whiteboard_url: "",
  notes_markdown: "",
  notes_pdf_path: "",
  notes_pdf_url: "",
  homework_pdf_path: "",
  homework_pdf_url: "",
  homework_items: [],
}

function hitFromProblem(
  kind: CatalogKind,
  row: { id: string; title?: string; slug?: string; display_id?: string; class?: number | string | null },
): SearchHit {
  const slug = row.slug
  return {
    id: row.id,
    title: row.title?.trim() || row.display_id || row.id,
    subtitle: row.display_id || slug || (row.class != null ? `Clasa ${row.class}` : undefined),
    href: workshopHomeworkHref(kind, row.id, slug),
  }
}

export function WorkshopMaterialsFields({
  value,
  onChange,
  workshopId,
  getAccessToken,
  uploadUrl,
  catalogSearchUrl,
  tone = "dark",
}: {
  value: WorkshopMaterialsFormValue
  onChange: (next: WorkshopMaterialsFormValue) => void
  workshopId: string | null
  getAccessToken: () => Promise<string | null>
  uploadUrl?: string
  catalogSearchUrl?: string
  tone?: "dark" | "light"
}) {
  const light = tone === "light"
  const fieldClass = light
    ? "border-[#e5e7eb] bg-white text-[#111827] placeholder:text-[#9ca3af]"
    : "border-white/20 bg-black/40 text-white"
  const [catalog, setCatalog] = useState<CatalogKind>("physics_problem")
  const [search, setSearch] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [uploading, setUploading] = useState<"notes" | "homework" | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const patch = (partial: Partial<WorkshopMaterialsFormValue>) => onChange({ ...value, ...partial })

  const uploadPdf = async (kind: "notes" | "homework", file: File) => {
    if (!workshopId) {
      setLocalError("Salvează pregătirea întâi, apoi încarcă PDF-ul.")
      return
    }
    setLocalError(null)
    setUploading(kind)
    try {
      const token = await getAccessToken()
      if (!token) {
        setLocalError("Sesiune invalidă.")
        return
      }
      const form = new FormData()
      form.set("file", file)
      form.set("workshopId", workshopId)
      form.set("kind", kind)
      const response = await fetch(uploadUrl ?? "/api/admin/pregatiri/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await response.json()
      if (!response.ok) {
        setLocalError(data.error ?? "Nu am putut încărca PDF-ul.")
        return
      }
      if (kind === "notes") {
        patch({ notes_pdf_path: data.path ?? "", notes_pdf_url: data.url ?? "" })
      } else {
        patch({ homework_pdf_path: data.path ?? "", homework_pdf_url: data.url ?? "" })
      }
    } catch {
      setLocalError("Eroare la încărcarea PDF-ului.")
    } finally {
      setUploading(null)
    }
  }

  const runSearch = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    setSearching(true)
    setLocalError(null)
    try {
      const isGrila = catalog === "grila_fizica" || catalog === "grila_biologie"
      if (!isGrila && search.trim().length < 2) {
        setHits([])
        return
      }
      const headers = { Authorization: `Bearer ${token}` }
      if (catalogSearchUrl) {
        const params = new URLSearchParams({ kind: catalog })
        if (search.trim()) params.set("search", search.trim())
        const response = await fetch(`${catalogSearchUrl}?${params}`, { headers })
        if (!response.ok) throw new Error("Nu am putut căuta materialele.")
        const data = await response.json()
        setHits((data.hits ?? []) as SearchHit[])
        return
      }
      if (catalog === "grila_fizica" || catalog === "grila_biologie") {
        const params = new URLSearchParams({
          action: "quiz-questions",
          materie: catalog === "grila_biologie" ? "biologie" : "fizica",
        })
        if (search.trim()) params.set("search", search.trim())
        const response = await fetch(`/api/admin/learning-paths?${params}`, { headers })
        if (!response.ok) throw new Error("Nu am putut căuta grilele.")
        const data = await response.json()
        const questions = (data.quizQuestions ?? []) as Array<{
          id: string
          question_id?: string
          title?: string
          statement?: string
          class?: number
        }>
        setHits(
          questions.map((q) => ({
            id: q.id,
            title: q.title?.trim() || q.question_id || q.id,
            subtitle: q.statement?.slice(0, 90) || (q.class != null ? `Clasa ${q.class}` : undefined),
            href: workshopHomeworkHref(catalog, q.id),
          })),
        )
        return
      }

      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (catalog === "math_problem") params.set("catalog", "math")
      if (catalog === "coding_problem") params.set("catalog", "informatics")
      const response = await fetch(`/api/admin/problems?${params}`, { headers })
      if (!response.ok) throw new Error("Nu am putut căuta problemele.")
      const data = await response.json()
      const problems = (data.problems ?? []) as Array<{
        id: string
        title?: string
        slug?: string
        display_id?: string
        class?: number | string | null
      }>
      setHits(
        problems
          .filter((row) => catalog !== "coding_problem" || Boolean(row.slug))
          .slice(0, 40)
          .map((row) => hitFromProblem(catalog, row)),
      )
    } catch (err) {
      setHits([])
      setLocalError(err instanceof Error ? err.message : "Eroare la căutare.")
    } finally {
      setSearching(false)
    }
  }, [catalog, catalogSearchUrl, getAccessToken, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [runSearch])

  const addItem = (hit: SearchHit) => {
    if (value.homework_items.some((item) => item.item_type === catalog && item.ref_id === hit.id)) return
    patch({
      homework_items: [
        ...value.homework_items,
        { item_type: catalog, ref_id: hit.id, title: hit.title, href: hit.href },
      ],
    })
  }

  const moveItem = (index: number, delta: number) => {
    const next = [...value.homework_items]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    patch({ homework_items: next })
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border p-4",
        light ? "border-[#eceff3] bg-[#f8f8fb]" : "border-white/10 bg-black/20",
      )}
    >
      <div>
        <h3 className={cn("text-sm font-semibold", light ? "text-[#111827]" : "text-white")}>
          Materiale
        </h3>
        <p className={cn("mt-1 text-xs", light ? "text-[#6b7280]" : "text-gray-400")}>
          Vizibile pe /pregatire/[id] doar după deblocarea cu energie.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws_whiteboard">URL tablă</Label>
        <Input
          id="ws_whiteboard"
          value={value.whiteboard_url}
          onChange={(e) => patch({ whiteboard_url: e.target.value })}
          className={fieldClass}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws_notes_md">Notițe (markdown)</Label>
        <Textarea
          id="ws_notes_md"
          rows={8}
          value={value.notes_markdown}
          onChange={(e) => patch({ notes_markdown: e.target.value })}
          className={cn(fieldClass, "font-mono text-sm")}
          placeholder="Poți folosi markdown și [FORMULA] ... [/FORMULA]"
        />
      </div>

      <PdfSlot
        label="PDF notițe"
        path={value.notes_pdf_path}
        url={value.notes_pdf_url}
        uploading={uploading === "notes"}
        disabled={!workshopId}
        light={light}
        onFile={(file) => void uploadPdf("notes", file)}
        onClear={() => patch({ notes_pdf_path: "", notes_pdf_url: "" })}
      />

      <PdfSlot
        label="PDF temă"
        path={value.homework_pdf_path}
        url={value.homework_pdf_url}
        uploading={uploading === "homework"}
        disabled={!workshopId}
        light={light}
        onFile={(file) => void uploadPdf("homework", file)}
        onClear={() => patch({ homework_pdf_path: "", homework_pdf_url: "" })}
      />

      <div className="space-y-2">
        <Label>Probleme și grile ca temă</Label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Select value={catalog} onValueChange={(next) => setCatalog(next as CatalogKind)}>
            <SelectTrigger className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKSHOP_HOMEWORK_ITEM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {WORKSHOP_HOMEWORK_ITEM_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(fieldClass, "pl-8")}
              placeholder={
                catalog === "grila_fizica" || catalog === "grila_biologie"
                  ? "Caută după enunț sau ID"
                  : "Caută (minim 2 caractere)"
              }
            />
          </div>
        </div>
        <div
          className={cn(
            "max-h-48 overflow-y-auto rounded-md border",
            light ? "border-[#eceff3] bg-white" : "border-white/10",
          )}
        >
          {searching ? (
            <p className={cn("flex items-center gap-2 px-3 py-2 text-xs", light ? "text-[#6b7280]" : "text-gray-400")}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Se caută…
            </p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">Niciun rezultat.</p>
          ) : (
            hits.map((hit) => (
              <button
                key={`${catalog}-${hit.id}`}
                type="button"
                className={cn(
                  "flex w-full items-start justify-between gap-2 border-b px-3 py-2 text-left last:border-b-0",
                  light
                    ? "border-[#f3f4f6] hover:bg-[#f8f8fb]"
                    : "border-white/5 hover:bg-white/5",
                )}
                onClick={() => addItem(hit)}
              >
                <span className="min-w-0">
                  <span className={cn("block truncate text-sm", light ? "text-[#111827]" : "text-white")}>
                    {hit.title}
                  </span>
                  {hit.subtitle ? (
                    <span className="block truncate text-[11px] text-gray-500">{hit.subtitle}</span>
                  ) : null}
                </span>
                <Plus className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              </button>
            ))
          )}
        </div>
      </div>

      {value.homework_items.length > 0 ? (
        <ul className="space-y-2">
          {value.homework_items.map((item, index) => (
            <li
              key={`${item.item_type}-${item.ref_id}-${index}`}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-2",
                light ? "border-[#eceff3] bg-white" : "border-white/10 bg-black/30",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", light ? "text-[#111827]" : "text-white")}>{item.title}</p>
                <p className="text-[11px] text-gray-500">{WORKSHOP_HOMEWORK_ITEM_LABELS[item.item_type]}</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", light ? "text-[#6b7280]" : "text-gray-300")}
                onClick={() => moveItem(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn("h-8 w-8", light ? "text-[#6b7280]" : "text-gray-300")}
                onClick={() => moveItem(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500"
                onClick={() =>
                  patch({
                    homework_items: value.homework_items.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {localError ? (
        <p className={cn("text-sm", light ? "text-red-600" : "text-red-200")}>{localError}</p>
      ) : null}
    </div>
  )
}

function PdfSlot({
  label,
  path,
  url,
  uploading,
  disabled,
  light = false,
  onFile,
  onClear,
}: {
  label: string
  path: string
  url: string
  uploading: boolean
  disabled: boolean
  light?: boolean
  onFile: (file: File) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {path ? (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-md border px-3 py-2",
            light ? "border-[#eceff3] bg-white" : "border-white/10",
          )}
        >
          <a
            href={url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-w-0 items-center gap-2 text-sm hover:underline",
              light ? "text-[#1a73e8]" : "text-sky-300",
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{path.split("/").pop()}</span>
          </a>
          <Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={onClear}>
            Șterge
          </Button>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm",
            light
              ? "border-[#d1d5db] bg-white text-[#6b7280] hover:bg-[#f8f8fb]"
              : "border-white/20 text-gray-300 hover:bg-white/5",
            disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
          )}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {disabled ? "Salvează pregătirea întâi" : "Încarcă PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFile(file)
              e.target.value = ""
            }}
          />
        </label>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MouseEventHandler } from "react"
import { lazy, Suspense, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calculator, Loader2, Lock, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { MathProblem } from "@/components/math-problems/types"
import { mapNumericClassToLabel } from "@/lib/catalog-class-labels"
import "katex/dist/katex.min.css"

const LazyInlineMath = lazy(() => import("react-katex").then((module) => ({ default: module.InlineMath })))

const difficultyToneClasses: Record<string, string> = {
  Ușor: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Mediu: "border-amber-200 bg-amber-50 text-amber-700",
  Avansat: "border-rose-200 bg-rose-50 text-rose-700",
}

function createStatementPreview(statement?: string | null, limit = 15) {
  if (!statement) return ""
  const normalized = statement.replace(/\s+/g, " ").trim()
  if (!normalized) return ""

  const parts = normalized.split(/(\$[^$]+\$)/g).filter(Boolean)
  const collected: string[] = []
  let wordCount = 0

  for (const part of parts) {
    const isMath = part.startsWith("$") && part.endsWith("$")
    if (isMath) {
      if (wordCount >= limit) break
      collected.push(part)
      wordCount += 1
      continue
    }

    const words = part.trim().split(/\s+/)
    for (const word of words) {
      if (!word) continue
      collected.push(word)
      wordCount += 1
      if (wordCount >= limit) break
    }
    if (wordCount >= limit) break
  }

  const preview = collected.join(" ")
  const totalWords = normalized.split(/\s+/).filter(Boolean).length
  return wordCount < totalWords ? `${preview}...` : preview
}

function MathContent({ content }: { content: string }) {
  const [isMathLoaded, setIsMathLoaded] = useState(false)
  const [hasMath, setHasMath] = useState(false)

  useEffect(() => {
    const containsMath = content.includes("$")
    setHasMath(containsMath)
    if (!containsMath) return
    const timer = setTimeout(() => setIsMathLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [content])

  if (!hasMath) return <span>{content}</span>
  if (!isMathLoaded) return <div className="h-4 w-full animate-pulse rounded bg-[#f5f4f2]" />

  return (
    <Suspense fallback={<div className="h-4 w-full animate-pulse rounded bg-[#f5f4f2]" />}>
      {content.split(/(\$[^$]+\$)/g).map((part, idx) =>
        part.startsWith("$") && part.endsWith("$") ? (
          <LazyInlineMath key={idx} math={part.slice(1, -1)} />
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </Suspense>
  )
}

interface MatematicaCatalogCardProps {
  problem: MathProblem
  solved?: boolean
  isLocked?: boolean
  isAdmin?: boolean
  onUpdated?: (problem: MathProblem) => void
}

export function MatematicaCatalogCard({
  problem,
  solved = false,
  isLocked = false,
  isAdmin = false,
  onUpdated,
}: MatematicaCatalogCardProps) {
  const router = useRouter()
  const preview = createStatementPreview(problem.statement?.trim() ? problem.statement : problem.title, 15)
  const classLabel = mapNumericClassToLabel(problem.class) ?? `Clasa a ${problem.class}-a`
  const href = `/matematica/probleme/${encodeURIComponent(problem.id)}`

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(problem.title ?? "")
  const [editStatement, setEditStatement] = useState(problem.statement ?? "")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const openEditor = () => {
    setEditTitle(problem.title ?? "")
    setEditStatement(problem.statement ?? "")
    setEditError(null)
    setIsEditing(true)
  }

  const closeEditor = () => {
    if (saving) return
    setIsEditing(false)
    setEditError(null)
  }

  const handleSave = async () => {
    const title = editTitle.trim()
    const statement = editStatement.trim()
    if (!title) {
      setEditError("Titlul nu poate fi gol.")
      return
    }
    if (!statement) {
      setEditError("Enunțul nu poate fi gol.")
      return
    }

    setSaving(true)
    setEditError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setEditError("Sesiune expirată. Reautentifică-te.")
        return
      }

      const res = await fetch(`/api/dev/problems/math/${encodeURIComponent(problem.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, statement }),
      })

      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setEditError(payload?.error || "Nu am putut salva modificările.")
        return
      }

      onUpdated?.({ ...problem, title, statement })
      setIsEditing(false)
    } catch {
      setEditError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setSaving(false)
    }
  }

  const handleNavigate: MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    router.push(href)
  }

  if (isEditing) {
    return (
      <Card
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col gap-3 rounded-2xl border border-[#0b0c0f]/15 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/70">
            Editare rapidă · ID {problem.id}
          </span>
          <button
            type="button"
            onClick={closeEditor}
            disabled={saving}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#0b0c0f]/10 text-[#2c2f33] transition-colors hover:bg-[#f5f4f2] disabled:opacity-50"
            aria-label="Închide editarea"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#2c2f33]/80">Titlu</span>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-[#0b0c0f]/15 bg-[#faf9f8] px-3 py-2 text-sm text-[#0b0c0f] outline-none transition-colors focus:border-[#0b0c0f]/40 disabled:opacity-60"
            placeholder="Titlul problemei"
          />
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-semibold text-[#2c2f33]/80">Enunț</span>
          <textarea
            value={editStatement}
            onChange={(e) => setEditStatement(e.target.value)}
            disabled={saving}
            rows={6}
            className="min-h-[120px] w-full flex-1 resize-y rounded-lg border border-[#0b0c0f]/15 bg-[#faf9f8] px-3 py-2 text-sm leading-relaxed text-[#0b0c0f] outline-none transition-colors focus:border-[#0b0c0f]/40 disabled:opacity-60"
            placeholder="Enunțul complet (poți folosi $...$ pentru LaTeX)"
          />
        </label>

        {editError && <p className="text-xs font-medium text-rose-600">{editError}</p>}

        <div className="mt-auto flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeEditor}
            disabled={saving}
            className="rounded-full border border-[#0b0c0f]/15 px-4 py-2 text-sm font-semibold text-[#2c2f33] transition-colors hover:bg-[#f5f4f2] disabled:opacity-50"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_2px_0_#050505] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-[0_4px_0_#050505]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      onClick={() => {
        if (!isLocked) router.push(href)
        else router.push("/pricing")
      }}
      className={cn(
        "group relative flex h-full w-full cursor-pointer flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)] transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[#0b0c0f]/20 hover:shadow-[0px_20px_40px_-28px_rgba(11,12,15,0.55)]",
      )}
    >
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openEditor()
          }}
          className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0b0c0f]/10 bg-white/90 text-[#2c2f33] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#f5f4f2]"
          aria-label="Editează problema"
          title="Editează problema"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {isLocked && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/75 px-4 text-center backdrop-blur-sm">
          <Lock className="h-8 w-8 text-[#0b0c0f]/70" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2c2f33]/70">Disponibila cu Plus+</p>
        </div>
      )}

      <div className={cn("flex flex-col gap-4", isLocked && "pointer-events-none select-none opacity-70")}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0b0c0f]/10 bg-[#f7f6f4]">
            <Calculator className="h-5 w-5 text-[#2c2f33]" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                difficultyToneClasses[problem.difficulty] ?? "border-[#0b0c0f]/15 bg-[#f5f4f2] text-[#2c2f33]/75",
              )}
            >
              {problem.difficulty}
            </Badge>
            <span className="rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2c2f33]/75">
              ID {problem.id}
            </span>
            <span className="rounded-full border border-[#0b0c0f]/15 bg-[#f5f4f2] px-3 py-1 text-[11px] font-semibold text-[#2c2f33]/70">
              {classLabel}
            </span>
          </div>
        </div>

        {preview && (
          <div className="line-clamp-4 text-sm font-semibold leading-relaxed text-[#2c2f33]/85">
            <MathContent content={preview} />
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={href}
          prefetch
          onClick={handleNavigate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] sm:w-auto"
        >
          Încearcă problema
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>

        {solved && <span className="ml-auto text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Rezolvata</span>}
      </div>
    </Card>
  )
}

export { MatematicaCatalogCardSkeleton } from "@/components/math-problems/matematica-catalog-card-skeleton"

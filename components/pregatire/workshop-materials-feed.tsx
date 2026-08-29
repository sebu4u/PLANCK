"use client"

import { Loader2, Lock, NotebookPen, StickyNote } from "lucide-react"
import {
  WorkshopHomeworkBody,
  WorkshopNotesBody,
} from "@/components/pregatire/workshop-materials-tabs"
import { formatWorkshopHeroDate } from "@/lib/pregatire/dates"
import {
  WORKSHOP_SUBJECT_COLORS,
  WORKSHOP_SUBJECT_LABELS,
  type WorkshopMaterialsHubItem,
  type WorkshopPublic,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

export function WorkshopMaterialsFeed({
  kind,
  items,
  loading,
  openingId,
  onSelect,
}: {
  kind: "homework" | "notes"
  items: WorkshopMaterialsHubItem[]
  loading?: boolean
  openingId?: string | null
  onSelect: (workshop: WorkshopPublic) => void
}) {
  const filtered = items.filter((item) => (kind === "notes" ? item.has_notes : item.has_homework))
  const emptyLabel =
    kind === "notes" ? "Nu există notițe de la pregătiri." : "Nu există teme de la pregătiri."
  const lockLabel =
    kind === "notes" ? "Deblochează ca să vezi notițele" : "Deblochează ca să vezi temele"

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#9ca3af]" />
      </div>
    )
  }

  if (filtered.length === 0) {
    const EmptyIcon = kind === "notes" ? StickyNote : NotebookPen
    return (
      <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white/50 px-6 py-16 text-center">
        <p className="text-sm text-[#6b7280]">{emptyLabel}</p>
        <EmptyIcon className="mx-auto mt-5 h-16 w-16 text-[#c4c4c4]" strokeWidth={1.25} aria-hidden />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((item) => {
        const unlocked = Boolean(item.workshop.unlocked)
        if (!unlocked) {
          return (
            <LockedMaterialCard
              key={item.workshop.id}
              item={item}
              lockLabel={lockLabel}
              opening={openingId === item.workshop.id}
              onSelect={() => onSelect(item.workshop)}
            />
          )
        }

        return (
          <article
            key={item.workshop.id}
            className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm"
          >
            <MaterialCardHeader item={item} />
            <div className="mt-3 space-y-3">
              {kind === "notes" ? (
                <WorkshopNotesBody
                  notesMarkdown={item.notes_markdown}
                  notesPdfUrl={item.notes_pdf_url}
                  compact
                />
              ) : (
                <WorkshopHomeworkBody
                  homeworkItems={item.homework_items}
                  homeworkPdfUrl={item.homework_pdf_url}
                  compact
                />
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function MaterialCardHeader({ item }: { item: WorkshopMaterialsHubItem }) {
  const color = WORKSHOP_SUBJECT_COLORS[item.workshop.subject]
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-[#111827]">{item.workshop.title}</h3>
        <p className="mt-0.5 text-xs capitalize text-[#6b7280]">
          {WORKSHOP_SUBJECT_LABELS[item.workshop.subject]}
          {item.workshop.starts_at ? ` · ${formatWorkshopHeroDate(item.workshop.starts_at)}` : ""}
        </p>
      </div>
    </div>
  )
}

function LockedMaterialCard({
  item,
  lockLabel,
  opening,
  onSelect,
}: {
  item: WorkshopMaterialsHubItem
  lockLabel: string
  opening: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={opening}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-4 text-left shadow-sm transition",
        "hover:border-[#d1d5db] hover:shadow-md",
        opening && "pointer-events-none",
      )}
    >
      {opening ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-[#6b7280]" aria-hidden />
          <span className="sr-only">Se încarcă</span>
        </div>
      ) : null}
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <MaterialCardHeader item={item} />
          <p className="mt-2 text-sm font-medium text-[#6b7280]">{lockLabel}</p>
        </div>
      </div>
    </button>
  )
}

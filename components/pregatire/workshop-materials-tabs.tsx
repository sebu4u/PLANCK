"use client"

import Link from "next/link"
import { Download, ExternalLink, FileText, Lock } from "lucide-react"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  WORKSHOP_HOMEWORK_ITEM_LABELS,
  type WorkshopHomeworkItem,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

export function PdfFrame({ url, title, compact }: { url: string; title: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#e5e7eb] bg-white",
        compact ? "h-[40vh] min-h-[240px]" : "h-[70vh] min-h-[420px]",
      )}
    >
      <iframe src={`${url}#view=FitH`} className="h-full w-full border-0" title={title} />
    </div>
  )
}

function pdfDownloadHref(url: string, fileName: string) {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}download=${encodeURIComponent(fileName)}`
}

export function PdfDownloadButton({
  url,
  fileName = "notite-pregatire.pdf",
  label = "Descarcă notițele PDF",
}: {
  url: string
  fileName?: string
  label?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#111827]">Notițe PDF</p>
        <p className="mt-0.5 text-xs text-[#6b7280]">Descarcă fișierul de la această pregătire.</p>
        <Button asChild className="mt-3 bg-[#111827] text-white hover:bg-[#1f2937]" size="sm">
          <a
            href={pdfDownloadHref(url, fileName)}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-4 w-4" />
            {label}
          </a>
        </Button>
      </div>
    </div>
  )
}

function LockedPlaceholder({
  compact,
  message,
  onUnlock,
  unlocking,
  unlockDisabled,
  unlockLabel,
}: {
  compact?: boolean
  message: string
  onUnlock?: () => void
  unlocking?: boolean
  unlockDisabled?: boolean
  unlockLabel: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#fafafa]",
        compact ? "min-h-[180px]" : "min-h-[240px]",
      )}
    >
      <div className="pointer-events-none select-none space-y-3 px-4 py-5 blur-[7px]" aria-hidden>
        <div className="h-3 w-3/4 rounded bg-[#e5e7eb]" />
        <div className="h-3 w-full rounded bg-[#e5e7eb]" />
        <div className="h-3 w-5/6 rounded bg-[#e5e7eb]" />
        <div className="h-3 w-2/3 rounded bg-[#e5e7eb]" />
        <div className={cn("rounded-lg bg-[#e5e7eb]", compact ? "h-20" : "h-28")} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 px-4 text-center backdrop-blur-[1px]">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-white">
          <Lock className="h-4 w-4" />
        </span>
        <p className="max-w-xs text-sm font-medium text-[#111827]">{message}</p>
        {onUnlock ? (
          <Button
            type="button"
            size="sm"
            className="bg-[#111827] text-white hover:bg-[#1f2937]"
            disabled={unlocking || unlockDisabled}
            onClick={onUnlock}
          >
            {unlockLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function WorkshopNotesBody({
  notesMarkdown,
  notesPdfUrl,
}: {
  notesMarkdown: string | null
  notesPdfUrl: string | null
  compact?: boolean
}) {
  return (
    <>
      {notesMarkdown?.trim() ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-4 sm:px-5">
          <LessonRichContent content={notesMarkdown} theme="light" />
        </div>
      ) : null}
      {notesPdfUrl ? <PdfDownloadButton url={notesPdfUrl} /> : null}
    </>
  )
}

export function WorkshopHomeworkBody({
  homeworkItems,
  homeworkPdfUrl,
  compact = false,
}: {
  homeworkItems: WorkshopHomeworkItem[]
  homeworkPdfUrl: string | null
  compact?: boolean
}) {
  return (
    <>
      {homeworkItems.length > 0 ? (
        <ul className="space-y-2">
          {homeworkItems.map((item) => (
            <li key={`${item.item_type}-${item.ref_id}`}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-3 py-3 transition-colors hover:border-[#d1d5db] hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#111827]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#6b7280]">
                    {WORKSHOP_HOMEWORK_ITEM_LABELS[item.item_type]}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-[#9ca3af]" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {homeworkPdfUrl ? (
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#374151]">
            <FileText className="h-4 w-4" />
            PDF temă
          </p>
          <PdfFrame url={homeworkPdfUrl} title="Temă PDF" compact={compact} />
        </div>
      ) : null}
    </>
  )
}

export function WorkshopMaterialsTabs({
  notesMarkdown,
  notesPdfUrl,
  homeworkPdfUrl,
  homeworkItems,
  compact = false,
  locked = false,
  hasNotes,
  hasHomework,
  onUnlock,
  unlocking = false,
  unlockDisabled = false,
  unlockLabel = "Deblochează pentru a vedea",
}: {
  notesMarkdown: string | null
  notesPdfUrl: string | null
  homeworkPdfUrl: string | null
  homeworkItems: WorkshopHomeworkItem[]
  compact?: boolean
  locked?: boolean
  hasNotes?: boolean
  hasHomework?: boolean
  onUnlock?: () => void
  unlocking?: boolean
  unlockDisabled?: boolean
  unlockLabel?: string
}) {
  const showNotes = hasNotes ?? Boolean(notesMarkdown?.trim() || notesPdfUrl)
  const showHomework = hasHomework ?? Boolean(homeworkPdfUrl || homeworkItems.length > 0)
  if (!showNotes && !showHomework) return null

  const defaultTab = showNotes ? "notes" : "homework"
  const tabCount = Number(showNotes) + Number(showHomework)

  const tabLabel = (label: string) =>
    locked ? (
      <span className="inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3" />
        {label}
      </span>
    ) : (
      label
    )

  return (
    <div
      className={cn(
        compact
          ? "mt-4 border-t border-[#e5e7eb]"
          : "mt-4 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm",
      )}
    >
      <Tabs defaultValue={defaultTab} className={compact ? "px-5 py-4" : "p-5 sm:p-6"}>
        {tabCount > 1 ? (
          <TabsList className="grid w-full grid-cols-2">
            {showNotes ? <TabsTrigger value="notes">{tabLabel("Notițe")}</TabsTrigger> : null}
            {showHomework ? <TabsTrigger value="homework">{tabLabel("Teme")}</TabsTrigger> : null}
          </TabsList>
        ) : (
          <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-[#111827]">
            {locked ? <Lock className="h-4 w-4" /> : null}
            {showNotes ? "Notițe" : "Teme"}
          </h2>
        )}

        {showNotes ? (
          <TabsContent value="notes" className="mt-4 space-y-4">
            {locked ? (
              <LockedPlaceholder
                compact={compact}
                message="Notițele sunt disponibile după ce deblochezi pregătirea."
                onUnlock={onUnlock}
                unlocking={unlocking}
                unlockDisabled={unlockDisabled}
                unlockLabel={unlockLabel}
              />
            ) : (
              <WorkshopNotesBody
                notesMarkdown={notesMarkdown}
                notesPdfUrl={notesPdfUrl}
                compact={compact}
              />
            )}
          </TabsContent>
        ) : null}

        {showHomework ? (
          <TabsContent value="homework" className="mt-4 space-y-4">
            {locked ? (
              <LockedPlaceholder
                compact={compact}
                message="Temele sunt disponibile după ce deblochezi pregătirea."
                onUnlock={onUnlock}
                unlocking={unlocking}
                unlockDisabled={unlockDisabled}
                unlockLabel={unlockLabel}
              />
            ) : (
              <WorkshopHomeworkBody
                homeworkItems={homeworkItems}
                homeworkPdfUrl={homeworkPdfUrl}
                compact={compact}
              />
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}

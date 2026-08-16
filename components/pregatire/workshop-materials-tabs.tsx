"use client"

import Link from "next/link"
import { ExternalLink, FileText } from "lucide-react"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  WORKSHOP_HOMEWORK_ITEM_LABELS,
  type WorkshopHomeworkItem,
} from "@/lib/pregatire/types"
import { cn } from "@/lib/utils"

function PdfFrame({ url, title, compact }: { url: string; title: string; compact?: boolean }) {
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

export function WorkshopMaterialsTabs({
  notesMarkdown,
  notesPdfUrl,
  homeworkPdfUrl,
  homeworkItems,
  compact = false,
}: {
  notesMarkdown: string | null
  notesPdfUrl: string | null
  homeworkPdfUrl: string | null
  homeworkItems: WorkshopHomeworkItem[]
  compact?: boolean
}) {
  const hasNotes = Boolean(notesMarkdown?.trim() || notesPdfUrl)
  const hasHomework = Boolean(homeworkPdfUrl || homeworkItems.length > 0)
  if (!hasNotes && !hasHomework) return null

  const defaultTab = hasNotes ? "notes" : "homework"
  const tabCount = Number(hasNotes) + Number(hasHomework)

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
      <Tabs defaultValue={defaultTab} className={compact ? "p-4" : "p-5 sm:p-6"}>
        {tabCount > 1 ? (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notițe</TabsTrigger>
            <TabsTrigger value="homework">Teme</TabsTrigger>
          </TabsList>
        ) : (
          <h2 className="text-base font-semibold text-[#111827]">{hasNotes ? "Notițe" : "Teme"}</h2>
        )}

        {hasNotes ? (
          <TabsContent value="notes" className="mt-4 space-y-4">
            {notesMarkdown?.trim() ? (
              <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-4 sm:px-5">
                <LessonRichContent content={notesMarkdown} theme="light" />
              </div>
            ) : null}
            {notesPdfUrl ? <PdfFrame url={notesPdfUrl} title="Notițe PDF" compact={compact} /> : null}
          </TabsContent>
        ) : null}

        {hasHomework ? (
          <TabsContent value="homework" className="mt-4 space-y-4">
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
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}

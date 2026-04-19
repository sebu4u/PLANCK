"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import type { TeacherAssignmentAttachmentGroup } from "@/lib/classrooms/types"

export function TeacherAssignmentAttachmentsSection({ groups }: { groups: TeacherAssignmentAttachmentGroup[] }) {
  if (groups.length === 0) {
    return null
  }

  return (
    <Card className="border-[#eceff3] bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Lucrări foto de la elevi</CardTitle>
        <p className="text-sm font-normal text-[#6b7280]">
          Pozele au fost trimise opțional la fiecare problemă; nu sunt vizibile celorlalți elevi.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((group) => (
          <details
            key={`${group.student_id}-${group.problem_id}`}
            className="group rounded-lg border border-[#e5e7eb] bg-[#fafafa] open:bg-white"
          >
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-[#111827] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex w-full items-center justify-between gap-2">
                <span>
                  {group.student_name}
                  <span className="font-normal text-[#6b7280]"> · </span>
                  <span className="font-normal text-[#374151]">
                    <LatexRichText content={group.problem_title} className="inline" />
                  </span>
                </span>
                <span className="shrink-0 text-xs font-normal text-[#6b7280]">
                  {group.signed_urls.length}{" "}
                  {group.signed_urls.length === 1 ? "foto" : "fotografii"}
                </span>
              </span>
            </summary>
            <div className="flex flex-wrap gap-3 border-t border-[#eceff3] px-3 py-3">
              {group.signed_urls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-md border border-[#e5e7eb] bg-white shadow-sm transition hover:border-[#cbd5e1]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Lucrare elev" className="h-36 max-w-[14rem] object-contain" loading="lazy" />
                </a>
              ))}
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  )
}

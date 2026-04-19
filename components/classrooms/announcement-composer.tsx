"use client"

import { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { createAnnouncementAction } from "@/app/classrooms/actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { AnnouncementLessonOption } from "@/lib/classrooms/server"

type AnnouncementType = "text" | "image" | "file" | "lesson"

interface AnnouncementComposerProps {
  classroomId: string
  lessons: AnnouncementLessonOption[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Se publică…" : "Publică"}
    </Button>
  )
}

const TYPE_LABELS: Record<AnnouncementType, string> = {
  text: "Text",
  image: "Imagine",
  file: "Fișier",
  lesson: "Lecție",
}

export function AnnouncementComposer({ classroomId, lessons }: AnnouncementComposerProps) {
  const [type, setType] = useState<AnnouncementType>("text")
  const messageFieldLabel = useMemo(() => {
    if (type === "text") return "Mesaj"
    if (type === "image") return "Mesaj / descriere"
    return "Mesaj / descriere"
  }, [type])

  return (
    <div className="rounded-xl border border-[#e8eaed] bg-white px-3 py-2.5">
      <h2 className="text-sm font-semibold leading-snug text-[#111827]">Distribuie ceva clasei tale…</h2>

      <div className="mt-2 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(["text", "image", "file", "lesson"] as AnnouncementType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                type === option
                  ? "border-[#111827] bg-[#111827] text-white"
                  : "border-[#e5e7eb] bg-[#fafbfc] text-[#4b5563] hover:border-[#d1d5db]",
              )}
            >
              {TYPE_LABELS[option]}
            </button>
          ))}
        </div>

        <form action={createAnnouncementAction} className="space-y-3">
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="type" value={type} />

          {(type === "text" || type === "image" || type === "file") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#6b7280]">{messageFieldLabel}</label>
              <Textarea
                name="content"
                rows={3}
                placeholder="Scrie anunțul…"
                required={type === "text"}
                className="min-h-[4.5rem] resize-y text-sm"
              />
            </div>
          )}

          {type === "lesson" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#6b7280]">Lecție</label>
              <select
                name="lesson_slug"
                className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-2.5 text-sm"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Alege lecția
                </option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.slug}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(type === "image" || type === "file") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#6b7280]">
                {type === "image" ? "Imagine" : "Fișier (PDF sau document)"}
              </label>
              <Input
                name="file"
                type="file"
                accept={type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"}
                required
                className="h-9 cursor-pointer text-xs file:mr-2 file:rounded file:border-0 file:bg-[#f3f4f6] file:px-2 file:py-1 file:text-xs"
              />
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}

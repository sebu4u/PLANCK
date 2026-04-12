"use client"

import { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { createAnnouncementAction } from "@/app/classrooms/actions"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Button type="submit" disabled={pending}>
      {pending ? "Se publică..." : "Publică"}
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
    <Card className="border-[#eceff3] bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Distribuie ceva clasei tale…</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["text", "image", "file", "lesson"] as AnnouncementType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                type === option
                  ? "border-[#111827] bg-[#111827] text-white"
                  : "border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6]"
              )}
            >
              {TYPE_LABELS[option]}
            </button>
          ))}
        </div>

        <form action={createAnnouncementAction} className="space-y-4">
          <input type="hidden" name="classroom_id" value={classroomId} />
          <input type="hidden" name="type" value={type} />

          {(type === "text" || type === "image" || type === "file") && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]">{messageFieldLabel}</label>
              <Textarea
                name="content"
                rows={4}
                placeholder="Scrie anunțul…"
                required={type === "text"}
              />
            </div>
          )}

          {type === "lesson" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]">Lecție</label>
              <select
                name="lesson_slug"
                className="h-10 w-full rounded-md border border-[#d1d5db] bg-white px-3 text-sm"
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]">
                {type === "image" ? "Imagine" : "Fișier (PDF sau document)"}
              </label>
              <Input
                name="file"
                type="file"
                accept={type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"}
                required
              />
            </div>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}

import Link from "next/link"
import Image from "next/image"
import { CalendarDays, FileText } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AuthorAvatar } from "@/components/classrooms/author-avatar"
import { DeadlineTimer } from "@/components/classrooms/deadline-timer"
import {
  deleteAnnouncementAction,
  togglePinAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/classrooms/teacher-actions"
import type { ClassroomAnnouncement } from "@/lib/classrooms/types"

interface AnnouncementPostProps {
  announcement: ClassroomAnnouncement
  deadline?: string | null
  isTeacher?: boolean
}

export function AnnouncementPost({ announcement, deadline = null, isTeacher = false }: AnnouncementPostProps) {
  const createdAt = new Date(announcement.created_at).toLocaleString("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const deadlineLabel = deadline
    ? new Date(deadline).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })
    : "Fără termen limită"

  return (
    <Card className="border-[#dfe3ea] bg-white shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AuthorAvatar name={announcement.author_name} />
            <div>
              <p className="text-sm font-semibold text-[#111827]">{announcement.author_name}</p>
              <p className="text-xs text-[#6b7280]">{createdAt}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[11px] font-semibold text-[#4338ca]">
            {announcement.pinned_at ? "Anunț fixat" : "Anunț"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[#374151]">
        {announcement.content && !isTeacher ? <p className="whitespace-pre-wrap">{announcement.content}</p> : null}

        {announcement.type === "image" && announcement.signed_file_url ? (
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb]">
            <Image
              src={announcement.signed_file_url}
              alt="Imagine anunț"
              width={1200}
              height={800}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}

        {announcement.type === "file" && announcement.signed_file_url ? (
          <a
            href={announcement.signed_file_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#f9fafb]"
          >
            <FileText className="h-4 w-4" />
            Deschide fișierul
          </a>
        ) : null}

        {announcement.type === "lesson" && announcement.lesson_slug ? (
          <Link
            href={`/invata/cursuri/fizica/${announcement.lesson_slug}`}
            className="inline-flex items-center rounded-lg bg-[#111827] px-3 py-2 text-sm font-medium text-white hover:bg-[#1f2937]"
          >
            Deschide lecția
          </Link>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2f7] pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-[#6b7280]">
            <CalendarDays className="h-3.5 w-3.5" />
            Termen: {deadlineLabel}
          </span>
          <DeadlineTimer deadline={deadline} />
        </div>
        {isTeacher ? (
          <div className="space-y-3">
            <form action={updateAnnouncementAction} className="space-y-2">
              <input type="hidden" name="classroom_id" value={announcement.classroom_id} />
              <input type="hidden" name="announcement_id" value={announcement.id} />
              <textarea
                name="content"
                defaultValue={announcement.content ?? ""}
                rows={3}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                placeholder="Textul anunțului"
              />
              <button type="submit" className="text-xs font-medium text-[#1557b0]">
                Salvează anunțul
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              <form action={togglePinAnnouncementAction}>
                <input type="hidden" name="classroom_id" value={announcement.classroom_id} />
                <input type="hidden" name="announcement_id" value={announcement.id} />
                <input type="hidden" name="pinned" value={announcement.pinned_at ? "0" : "1"} />
                <button type="submit" className="text-xs font-medium text-[#1557b0]">
                  {announcement.pinned_at ? "Anulează fixarea" : "Fixează"}
                </button>
              </form>
              <form action={deleteAnnouncementAction}>
                <input type="hidden" name="classroom_id" value={announcement.classroom_id} />
                <input type="hidden" name="announcement_id" value={announcement.id} />
                <button type="submit" className="text-xs font-medium text-rose-600">
                  Șterge
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

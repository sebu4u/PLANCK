import type { Metadata } from "next"
import { requireParentUser } from "@/lib/parent/require-parent"
import { getParentClassroomMessages } from "@/lib/classrooms/extra-server"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { pageTitle } from "@/lib/metadata"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: pageTitle("Mesaje de la profesori"),
}

export const dynamic = "force-dynamic"

export default async function ParentMessagesPage() {
  const { user } = await requireParentUser()
  const messages = await getParentClassroomMessages(user.id)

  return (
    <div className={cn("min-h-[100dvh] bg-[#f8f9fa] pt-16", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold text-[#111827]">Mesaje de la profesori</h1>
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#e5e7eb] bg-white p-6 text-sm text-[#6b7280]">
            Nu ai încă mesaje de la profesorii copiilor tăi.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article key={message.id} className="rounded-2xl border border-[#e8eaed] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6366f1]">{message.classroom_name}</p>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {message.author_name}
                  {message.student_name ? ` · despre ${message.student_name}` : ""}
                  {" · "}
                  {new Date(message.created_at).toLocaleString("ro-RO")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#111827]">{message.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

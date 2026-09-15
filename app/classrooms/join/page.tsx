import { redirect } from "next/navigation"
import { JoinClassroomForm } from "@/components/classrooms/join-classroom-form"
import { requireAuthenticatedUser } from "@/lib/classrooms/server"

const errorMessages: Record<string, string> = {
  invalid_code: "Codul trebuie să aibă exact 6 caractere.",
  classroom_not_found: "Nu există nicio clasă cu acest cod.",
  join_failed: "Nu am putut intra în clasă. Încearcă din nou.",
  classroom_archived: "Clasa a fost arhivată.",
  join_locked: "Înscrierile la această clasă sunt blocate.",
}

export default async function JoinClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const params = await searchParams
  const errorMessage = params.error ? errorMessages[params.error] : undefined

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#111827]">Intră într-o clasă</h1>
      <JoinClassroomForm errorMessage={errorMessage} defaultCode={params.code?.toUpperCase()} />
    </div>
  )
}

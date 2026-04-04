import { redirect } from "next/navigation"
import { JoinClassroomForm } from "@/components/classrooms/join-classroom-form"
import { requireAuthenticatedUser } from "@/lib/classrooms/server"

const errorMessages: Record<string, string> = {
  invalid_code: "Join code must be exactly 6 characters.",
  classroom_not_found: "No classroom found for this code.",
  join_failed: "Could not join this classroom. Try again.",
}

export default async function JoinClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const params = await searchParams
  const errorMessage = params.error ? errorMessages[params.error] : undefined

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#111827]">Join classroom</h1>
      <JoinClassroomForm errorMessage={errorMessage} />
    </div>
  )
}

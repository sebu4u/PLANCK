import { redirect } from "next/navigation"
import { CreateClassroomForm } from "@/components/classrooms/create-classroom-form"
import { listClassroomCoverFilenames } from "@/lib/classrooms/cover-images"
import { requireAuthenticatedUser } from "@/lib/classrooms/server"

const errorMessages: Record<string, string> = {
  name_required: "Please provide a classroom name.",
  create_failed: "Could not create classroom. Try again.",
  join_code_conflict: "Could not generate a unique join code. Please retry.",
  cover_required: "Please choose a cover image.",
  no_covers: "No cover images found. Add image files to the public/clase folder.",
}

export default async function NewClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>
}) {
  const { user } = await requireAuthenticatedUser()
  if (!user) {
    redirect("/")
  }

  const params = await searchParams
  let errorMessage = params.error ? errorMessages[params.error] : undefined
  if (params.error === "create_failed" && params.reason) {
    errorMessage = `Could not create classroom. Reason code: ${params.reason}`
  }

  const coverFilenames = await listClassroomCoverFilenames()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#111827]">New classroom</h1>
      {coverFilenames.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessages.no_covers}
        </p>
      ) : (
        <CreateClassroomForm errorMessage={errorMessage} coverFilenames={coverFilenames} />
      )}
    </div>
  )
}

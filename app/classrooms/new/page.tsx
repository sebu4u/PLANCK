import { redirect } from "next/navigation"
import { CreateClassroomForm } from "@/components/classrooms/create-classroom-form"
import { listClassroomCoverFilenames } from "@/lib/classrooms/cover-images"
import { requireAuthenticatedUser } from "@/lib/classrooms/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { normalizeUserType } from "@/lib/user-types"

const errorMessages: Record<string, string> = {
  name_required: "Completează numele clasei.",
  create_failed: "Nu am putut crea clasa. Încearcă din nou.",
  join_code_conflict: "Nu am putut genera un cod unic. Reîncearcă.",
  cover_required: "Alege o imagine de copertă.",
  no_covers: "Nu există imagini de copertă. Adaugă fișiere în public/clase.",
  teacher_account_required: "Doar un cont de profesor poate crea o clasă.",
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

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle()
  if (normalizeUserType(profile?.user_type) !== "profesor") {
    redirect("/classrooms?error=teacher_account_required")
  }

  const params = await searchParams
  let errorMessage = params.error ? errorMessages[params.error] : undefined
  if (params.error === "create_failed" && params.reason) {
    errorMessage = `Nu am putut crea clasa. Cod: ${params.reason}`
  }

  const coverFilenames = await listClassroomCoverFilenames()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#111827]">Clasă nouă</h1>
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

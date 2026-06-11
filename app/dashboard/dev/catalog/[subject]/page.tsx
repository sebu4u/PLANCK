import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DevCatalogTools } from "@/components/dashboard/dev-catalog-tools"
import { canAccessSubject, normalizeDevSubjects, type DevSubjectKey } from "@/lib/dev-subjects"

const ALLOWED = new Set(["fizica", "informatica", "matematica", "biologie", "ai"])

export default async function DevCatalogSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject } = await params
  if (!ALLOWED.has(subject)) {
    redirect("/dashboard/dev")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_dev, is_admin, dev_subjects")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.is_dev !== true && profile?.is_admin !== true) {
    redirect("/dashboard")
  }

  const subjectKey = subject as DevSubjectKey
  if (
    !canAccessSubject(
      profile?.is_dev === true,
      normalizeDevSubjects(profile?.dev_subjects),
      subjectKey,
      profile?.is_admin === true
    )
  ) {
    redirect("/dashboard/dev")
  }

  return <DevCatalogTools subjectKey={subjectKey} />
}

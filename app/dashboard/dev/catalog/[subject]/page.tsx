import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DevCatalogTools } from "@/components/dashboard/dev-catalog-tools"

const ALLOWED = new Set(["fizica", "informatica", "matematica", "biologie"])

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

  const { data: profile } = await supabase.from("profiles").select("is_dev").eq("user_id", user.id).maybeSingle()

  if (profile?.is_dev !== true) {
    redirect("/dashboard")
  }

  return (
    <DevCatalogTools subjectKey={subject as "fizica" | "informatica" | "matematica" | "biologie"} />
  )
}

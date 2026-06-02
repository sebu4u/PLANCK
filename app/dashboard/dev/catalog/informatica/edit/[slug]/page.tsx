import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InformaticsProblemEditorClient } from "@/components/dashboard/informatics-problem-editor-client"

export default async function EditInformaticsProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_dev")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.is_dev !== true) {
    redirect("/dashboard")
  }

  return <InformaticsProblemEditorClient slug={slug} />
}

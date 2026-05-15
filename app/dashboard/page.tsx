import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardAuth } from "@/components/dashboard/dashboard-auth"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_dev")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.is_dev === true) {
      redirect("/dashboard/dev")
    }
  }

  return <DashboardAuth />
}

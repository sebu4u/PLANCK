import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DevDashboard } from "@/components/dashboard/dev-dashboard"

export default async function DevDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_dev, is_admin")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.is_dev !== true && profile?.is_admin !== true) {
    redirect("/dashboard")
  }

  return <DevDashboard />
}

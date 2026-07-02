import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ParentDashboard } from "@/components/dashboard/parent-dashboard"
import { normalizeUserType } from "@/lib/user-types"

export default async function ParentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("user_id", user.id)
    .maybeSingle()

  if (normalizeUserType(profile?.user_type) !== "parinte") {
    redirect("/dashboard")
  }

  return <ParentDashboard />
}

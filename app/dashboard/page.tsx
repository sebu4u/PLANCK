import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardAuth } from "@/components/dashboard/dashboard-auth"
import { normalizeUserType } from "@/lib/user-types"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_dev, user_type")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.is_dev === true) {
      redirect("/dashboard/dev")
    }

    const userType = normalizeUserType(profile?.user_type)
    if (userType === "parinte") {
      redirect("/dashboard/parent")
    }
    if (userType === "profesor") {
      redirect("/dashboard/teacher")
    }
  }

  return <DashboardAuth />
}

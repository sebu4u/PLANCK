import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MentorDashboard } from "@/components/mentor/mentor-dashboard"

export default async function MentorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_mentor")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.is_mentor !== true) {
    redirect("/dashboard")
  }

  return <MentorDashboard />
}

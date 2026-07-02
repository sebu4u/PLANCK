import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { normalizeUserType } from "@/lib/user-types"
import { getTeacherDashboardOverview, getTeacherPendingHomeworkReviews } from "@/lib/teacher/server"

export default async function TeacherDashboardPage() {
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

  if (normalizeUserType(profile?.user_type) !== "profesor") {
    redirect("/dashboard")
  }

  const overview = await getTeacherDashboardOverview(user.id)
  const pendingHomework = await getTeacherPendingHomeworkReviews(user.id)

  return (
    <TeacherDashboard
      initialOverview={overview}
      initialPendingHomework={pendingHomework.items}
      initialPendingHomeworkTotal={pendingHomework.total_count}
    />
  )
}

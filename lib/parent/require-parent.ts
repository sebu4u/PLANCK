import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { normalizeUserType } from "@/lib/user-types"

export async function requireParentUser() {
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

  return { user, supabase }
}

import "server-only"

import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export async function createWorkshopInAppReminder(input: {
  userId: string
  workshopId: string
  workshopTitle: string
  startsAtLabel: string
  reminderKind: "24h" | "30m"
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const timing =
    input.reminderKind === "24h" ? "în 24 de ore" : "în 30 de minute"
  const supabase = getServiceRoleSupabase()

  const { error } = await supabase.from("user_in_app_notifications").upsert(
    {
      user_id: input.userId,
      type: "workshop_reminder",
      title: `Pregătire ${timing}`,
      body: `${input.workshopTitle} · ${input.startsAtLabel}`,
      href: `/pregatire/${input.workshopId}`,
      workshop_id: input.workshopId,
      reminder_kind: input.reminderKind,
      read_at: null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,workshop_id,reminder_kind,type" },
  )

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

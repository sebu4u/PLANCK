import "server-only"

import { logger } from "@/lib/logger"
import {
  getPlanckWeekAuthConfirmUrl,
  getPlanckWeekPregatirePath,
} from "@/lib/planck-week"
import { sendPlanckWeekMagicLinkEmail } from "@/lib/planck-week-email"
import { isWorkshopSubject, type WorkshopSubject } from "@/lib/pregatire/types"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export async function sendPlanckWeekMagicLink(input: {
  email: string
  name: string
  subjects: WorkshopSubject[]
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = input.email.trim().toLowerCase()
  const firstSubject = input.subjects.find((subject) => isWorkshopSubject(subject)) ?? null
  const nextPath = getPlanckWeekPregatirePath(firstSubject)
  const redirectTo = getPlanckWeekAuthConfirmUrl(nextPath)

  try {
    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        data: {
          name: input.name,
          planck_week: true,
        },
        redirectTo,
      },
    })

    if (error || !data.properties?.hashed_token) {
      logger.error("[planck-week] generateLink failed:", error?.message)
      return { ok: false, message: error?.message ?? "Nu am putut genera linkul de acces." }
    }

    const confirmUrl = `${getPlanckWeekAuthConfirmUrl(nextPath)}&token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`
    const sent = await sendPlanckWeekMagicLinkEmail({
      to: email,
      name: input.name,
      confirmUrl,
    })

    if (!sent.ok) {
      logger.error("[planck-week] magic link email failed:", sent.message)
      return { ok: false, message: sent.message }
    }

    return { ok: true }
  } catch (error) {
    logger.error("[planck-week] magic link error:", error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nu am putut trimite linkul de acces.",
    }
  }
}

export function planckWeekConfirmarePath(input: {
  subjects: string[]
  email: string
  sent?: boolean
}): string {
  const params = new URLSearchParams()
  if (input.subjects.length > 0) params.set("materii", input.subjects.join(","))
  if (input.email) params.set("email", input.email)
  if (input.sent === false) params.set("sent", "0")
  const query = params.toString()
  return query ? `/planck-week/confirmare?${query}` : "/planck-week/confirmare"
}

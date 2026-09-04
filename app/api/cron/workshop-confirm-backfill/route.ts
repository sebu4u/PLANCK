import { NextRequest, NextResponse } from "next/server"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { triggerWorkshopEmail } from "@/lib/mailerlite/workshop-trigger"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const maxDuration = 300

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

/**
 * Backfill confirmation emails for Planck Week workshops (2026-09-10 to 2026-09-15).
 * Sends MailerLite confirmation to users who unlocked but never received a confirm email.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceRoleSupabase()
  const siteUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://planck.academy").replace(/\/$/, "")

  const summary = {
    workshopsScanned: 0,
    unlocksScanned: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    emailsFailed: 0,
  }

  try {
    // Planck Week workshops: 2026-09-10 00:00 to 2026-09-15 23:59 Europe/Bucharest
    const planckWeekStart = "2026-09-10T00:00:00+03:00"
    const planckWeekEnd = "2026-09-15T23:59:59+03:00"

    const { data: workshops, error } = await supabase
      .from("workshops")
      .select("id, title, starts_at, subject, teacher_id")
      .eq("is_published", true)
      .gte("starts_at", planckWeekStart)
      .lte("starts_at", planckWeekEnd)
      .order("starts_at")

    if (error) throw error

    for (const workshop of workshops ?? []) {
      summary.workshopsScanned += 1

      const { data: unlocks } = await supabase
        .from("workshop_unlocks")
        .select("user_id")
        .eq("workshop_id", workshop.id)

      for (const unlock of unlocks ?? []) {
        summary.unlocksScanned += 1
        const userId = unlock.user_id as string

        const { data: existingSend } = await supabase
          .from("workshop_reminder_sends")
          .select("id, status")
          .eq("workshop_id", workshop.id)
          .eq("user_id", userId)
          .eq("reminder_kind", "confirm")
          .eq("channel", "email")
          .maybeSingle()

        if (existingSend?.status === "sent") {
          summary.emailsSkipped += 1
          continue
        }

        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        const email = authUser.user?.email

        if (!email) {
          await supabase.from("workshop_reminder_sends").upsert(
            {
              workshop_id: workshop.id,
              user_id: userId,
              reminder_kind: "confirm",
              channel: "email",
              status: "skipped",
              error_message: "no_email",
              sent_at: new Date().toISOString(),
            },
            { onConflict: "workshop_id,user_id,reminder_kind,channel" }
          )
          summary.emailsSkipped += 1
          continue
        }

        const { data: teacher } = await supabase
          .from("workshop_teachers")
          .select("name")
          .eq("id", workshop.teacher_id)
          .maybeSingle()

        const result = await triggerWorkshopEmail({
          email,
          kind: "confirm",
          fields: {
            ws_title: workshop.title,
            ws_when: formatWorkshopDateTime(workshop.starts_at),
            ws_url: `${siteUrl}/pregatire/${workshop.id}`,
            ws_meet_url: "",
            ws_teacher: teacher?.name || "",
            ws_subject: workshop.subject,
          },
        })

        await supabase.from("workshop_reminder_sends").upsert(
          {
            workshop_id: workshop.id,
            user_id: userId,
            reminder_kind: "confirm",
            channel: "email",
            status: result.ok ? "sent" : "failed",
            error_message: result.ok ? null : result.message,
            sent_at: new Date().toISOString(),
          },
          { onConflict: "workshop_id,user_id,reminder_kind,channel" }
        )

        if (result.ok) {
          summary.emailsSent += 1
          logger.info("[workshop-confirm-backfill] email sent", {
            workshopId: workshop.id,
            userId,
          })
        } else {
          summary.emailsFailed += 1
          logger.error("[workshop-confirm-backfill] email failed", {
            workshopId: workshop.id,
            userId,
            error: result.message,
          })
        }
      }
    }

    logger.info("[workshop-confirm-backfill] completed", summary)
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error("[workshop-confirm-backfill] error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}

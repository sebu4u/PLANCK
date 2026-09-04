import { NextRequest, NextResponse } from "next/server"
import { createWorkshopInAppReminder } from "@/lib/pregatire/in-app-notification"
import { sendWorkshopPushToUser } from "@/lib/pregatire/push"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"
import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { triggerWorkshopEmail } from "@/lib/mailerlite/workshop-trigger"

export const runtime = "nodejs"
export const maxDuration = 300

type ReminderKind = "24h" | "30m" | "10m"
type ReminderChannel = "email" | "push" | "in_app"

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

/** Due-and-unsent windows so delayed schedulers still catch reminders. */
function windowFor(kind: ReminderKind, now: Date) {
  const tenMinMs = 10 * 60_000
  const thirtyMinMs = 30 * 60_000
  const twentyFourHMs = 24 * 60 * 60_000

  if (kind === "10m") {
    return {
      from: now.toISOString(),
      to: new Date(now.getTime() + tenMinMs).toISOString(),
    }
  }
  if (kind === "30m") {
    return {
      from: new Date(now.getTime() + tenMinMs).toISOString(),
      to: new Date(now.getTime() + thirtyMinMs).toISOString(),
    }
  }
  return {
    from: new Date(now.getTime() + thirtyMinMs).toISOString(),
    to: new Date(now.getTime() + twentyFourHMs).toISOString(),
  }
}

async function alreadySent(
  workshopId: string,
  userId: string,
  kind: ReminderKind,
  channel: ReminderChannel,
): Promise<boolean> {
  const supabase = getServiceRoleSupabase()
  const { data } = await supabase
    .from("workshop_reminder_sends")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("user_id", userId)
    .eq("reminder_kind", kind)
    .eq("channel", channel)
    .eq("status", "sent")
    .maybeSingle()
  return Boolean(data)
}

async function logSend(input: {
  workshopId: string
  userId: string
  kind: ReminderKind
  channel: ReminderChannel
  status: "sent" | "failed" | "skipped"
  error?: string
}) {
  const supabase = getServiceRoleSupabase()
  await supabase.from("workshop_reminder_sends").upsert(
    {
      workshop_id: input.workshopId,
      user_id: input.userId,
      reminder_kind: input.kind,
      channel: input.channel,
      status: input.status,
      error_message: input.error ?? null,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "workshop_id,user_id,reminder_kind,channel" },
  )
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceRoleSupabase()
  const now = new Date()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.planck.academy").replace(/\/$/, "")
  const summary = {
    scanned: 0,
    emailSent: 0,
    pushSent: 0,
    inAppSent: 0,
    skipped: 0,
    failed: 0,
  }

  try {
    for (const kind of ["24h", "30m", "10m"] as ReminderKind[]) {
      const { from, to } = windowFor(kind, now)
      const { data: workshops, error } = await supabase
        .from("workshops")
        .select("id, title, starts_at, is_published, subject, teacher_id, meet_url")
        .eq("is_published", true)
        .gt("starts_at", from)
        .lte("starts_at", to)

      if (error) throw error

      for (const workshop of workshops ?? []) {
        summary.scanned += 1
        const { data: unlocks } = await supabase
          .from("workshop_unlocks")
          .select("user_id")
          .eq("workshop_id", workshop.id)

        for (const unlock of unlocks ?? []) {
          const userId = unlock.user_id as string
          const detailUrl = `${siteUrl}/pregatire/${workshop.id}`
          const when = formatWorkshopDateTime(workshop.starts_at)
          const timing =
            kind === "24h"
              ? "în 24 de ore"
              : kind === "30m"
                ? "în 30 de minute"
                : "în 10 minute"

          // Email via MailerLite
          if (!(await alreadySent(workshop.id, userId, kind, "email"))) {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId)
            const email = authUser.user?.email
            if (!email) {
              await logSend({
                workshopId: workshop.id,
                userId,
                kind,
                channel: "email",
                status: "skipped",
                error: "no_email",
              })
              summary.skipped += 1
            } else {
              const { data: teacher } = await supabase
                .from("workshop_teachers")
                .select("name")
                .eq("id", workshop.teacher_id)
                .maybeSingle()

              const result = await triggerWorkshopEmail({
                email,
                kind,
                fields: {
                  ws_title: workshop.title,
                  ws_when: when,
                  ws_url: detailUrl,
                  ws_meet_url: kind === "10m" ? workshop.meet_url || "" : "",
                  ws_teacher: teacher?.name || "",
                  ws_subject: workshop.subject,
                },
              })

              if (result.ok) {
                await logSend({
                  workshopId: workshop.id,
                  userId,
                  kind,
                  channel: "email",
                  status: "sent",
                })
                summary.emailSent += 1
              } else {
                await logSend({
                  workshopId: workshop.id,
                  userId,
                  kind,
                  channel: "email",
                  status: "failed",
                  error: result.message,
                })
                summary.failed += 1
              }
            }
          }

          // Push (only for 24h and 30m)
          if ((kind === "24h" || kind === "30m") && !(await alreadySent(workshop.id, userId, kind, "push"))) {
            const pushResult = await sendWorkshopPushToUser({
              userId,
              title: `Pregătire ${timing}`,
              body: `${workshop.title} · ${when}`,
              url: detailUrl,
            })
            if (pushResult.sent > 0) {
              await logSend({
                workshopId: workshop.id,
                userId,
                kind,
                channel: "push",
                status: "sent",
              })
              summary.pushSent += pushResult.sent
            } else if (pushResult.failed > 0) {
              await logSend({
                workshopId: workshop.id,
                userId,
                kind,
                channel: "push",
                status: "failed",
                error: "push_failed",
              })
              summary.failed += 1
            } else {
              await logSend({
                workshopId: workshop.id,
                userId,
                kind,
                channel: "push",
                status: "skipped",
                error: "no_subscription",
              })
              summary.skipped += 1
            }
          }

          // In-app (navbar) (only for 24h and 30m)
          if ((kind === "24h" || kind === "30m") && !(await alreadySent(workshop.id, userId, kind, "in_app"))) {
            const inAppResult = await createWorkshopInAppReminder({
              userId,
              workshopId: workshop.id,
              workshopTitle: workshop.title,
              startsAtLabel: when,
              reminderKind: kind,
            })
            if (inAppResult.ok) {
              await logSend({
                workshopId: workshop.id,
                userId,
                kind,
                channel: "in_app",
                status: "sent",
              })
              summary.inAppSent += 1
            } else {
              await logSend({
                workshopId: workshop.id,
                userId,
                kind,
                channel: "in_app",
                status: "failed",
                error: inAppResult.message,
              })
              summary.failed += 1
            }
          }
        }
      }
    }

    logger.info("[cron/workshop-reminders] completed", summary)
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error("[cron/workshop-reminders] error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

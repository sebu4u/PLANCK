import { NextRequest, NextResponse } from "next/server"
import { sendWorkshopReminderEmail } from "@/lib/pregatire/email"
import { createWorkshopInAppReminder } from "@/lib/pregatire/in-app-notification"
import { sendWorkshopPushToUser } from "@/lib/pregatire/push"
import { formatWorkshopDateTime } from "@/lib/pregatire/dates"
import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"
export const maxDuration = 300

type ReminderKind = "24h" | "30m"
type ReminderChannel = "email" | "push" | "in_app"

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

function windowFor(kind: ReminderKind, now: Date) {
  // Target: starts_at ≈ now + offset, with ±7.5 min tolerance (cron every 10 min)
  const offsetMs = kind === "24h" ? 24 * 60 * 60_000 : 30 * 60_000
  const toleranceMs = 7.5 * 60_000
  const center = now.getTime() + offsetMs
  return {
    from: new Date(center - toleranceMs).toISOString(),
    to: new Date(center + toleranceMs).toISOString(),
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://planck.academy").replace(/\/$/, "")
  const summary = {
    scanned: 0,
    emailSent: 0,
    pushSent: 0,
    inAppSent: 0,
    skipped: 0,
    failed: 0,
  }

  try {
    for (const kind of ["24h", "30m"] as ReminderKind[]) {
      const { from, to } = windowFor(kind, now)
      const { data: workshops, error } = await supabase
        .from("workshops")
        .select("id, title, starts_at, is_published")
        .eq("is_published", true)
        .gte("starts_at", from)
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
          const timing = kind === "24h" ? "în 24 de ore" : "în 30 de minute"

          // Email
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
              const result = await sendWorkshopReminderEmail({
                to: email,
                workshopTitle: workshop.title,
                workshopId: workshop.id,
                startsAt: workshop.starts_at,
                reminderKind: kind,
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

          // Push
          if (!(await alreadySent(workshop.id, userId, kind, "push"))) {
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

          // In-app (navbar)
          if (!(await alreadySent(workshop.id, userId, kind, "in_app"))) {
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

import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { formatWorkshopDateTime, visibleWorkshopMeetUrl } from "@/lib/pregatire/dates"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { triggerWorkshopEmail } from "@/lib/mailerlite/workshop-trigger"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const token = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(token)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const { data, error } = await supabase.rpc("unlock_workshop", {
      p_workshop_id: id,
    })

    if (error) {
      logger.error("[pregatire/unlock] RPC failed:", error)
      return NextResponse.json({ error: "Nu am putut rezerva locul." }, { status: 500 })
    }

    const result = data as {
      ok?: boolean
      error?: string
      already_unlocked?: boolean
      meet_url?: string
      recording_url?: string | null
      balance?: number
      carryover_balance?: number
      energy_cost?: number
    }

    if (!result?.ok) {
      const code = result?.error ?? "unknown"
      if (code === "insufficient_energy") {
        return NextResponse.json(
          {
            error: "Nu am putut rezerva locul.",
            code,
            balance: result.balance,
            carryoverBalance: result.carryover_balance ?? 0,
            energy_cost: result.energy_cost,
          },
          { status: 402 },
        )
      }
      if (code === "full") {
        return NextResponse.json(
          { error: "Locurile pentru această pregătire sunt epuizate.", code },
          { status: 409 },
        )
      }
      if (code === "not_found") {
        return NextResponse.json({ error: "Pregătirea nu a fost găsită.", code }, { status: 404 })
      }
      return NextResponse.json({ error: "Nu am putut rezerva locul.", code }, { status: 400 })
    }

    const { data: publicRow } = await supabase
      .from("workshops_public")
      .select("starts_at")
      .eq("id", id)
      .maybeSingle()

    const responsePayload = {
      unlocked: true,
      already_unlocked: Boolean(result.already_unlocked),
      meet_url: visibleWorkshopMeetUrl(
        typeof publicRow?.starts_at === "string" ? publicRow.starts_at : "",
        result.meet_url ?? null,
      ),
      recording_url: result.recording_url ?? null,
      balance: result.balance ?? 0,
      carryoverBalance: result.carryover_balance ?? 0,
    }

    if (!result.already_unlocked) {
      after(() => {
        sendWorkshopConfirmationEmail({
          workshopId: id,
          userId: userData.user.id,
          userEmail: userData.user.email,
        }).catch((err) => {
          logger.error("[pregatire/unlock] confirmation email failed:", err)
        })
      })
    }

    return NextResponse.json(responsePayload)
  } catch (err) {
    logger.error("[pregatire/unlock] error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

async function sendWorkshopConfirmationEmail(input: {
  workshopId: string
  userId: string
  userEmail?: string
}) {
  const supabase = getServiceRoleSupabase()

  const alreadySent = await supabase
    .from("workshop_reminder_sends")
    .select("id")
    .eq("workshop_id", input.workshopId)
    .eq("user_id", input.userId)
    .eq("reminder_kind", "confirm")
    .eq("channel", "email")
    .eq("status", "sent")
    .maybeSingle()

  if (alreadySent.data) {
    logger.info("[pregatire/unlock] confirm email already sent", {
      workshopId: input.workshopId,
      userId: input.userId,
    })
    return
  }

  if (!input.userEmail) {
    await supabase.from("workshop_reminder_sends").upsert(
      {
        workshop_id: input.workshopId,
        user_id: input.userId,
        reminder_kind: "confirm",
        channel: "email",
        status: "skipped",
        error_message: "no_email",
        sent_at: new Date().toISOString(),
      },
      { onConflict: "workshop_id,user_id,reminder_kind,channel" }
    )
    return
  }

  const { data: workshop } = await supabase
    .from("workshops")
    .select("title, starts_at, subject, teacher_id")
    .eq("id", input.workshopId)
    .maybeSingle()

  if (!workshop) {
    await supabase.from("workshop_reminder_sends").upsert(
      {
        workshop_id: input.workshopId,
        user_id: input.userId,
        reminder_kind: "confirm",
        channel: "email",
        status: "failed",
        error_message: "workshop_not_found",
        sent_at: new Date().toISOString(),
      },
      { onConflict: "workshop_id,user_id,reminder_kind,channel" }
    )
    return
  }

  const { data: teacher } = await supabase
    .from("workshop_teachers")
    .select("name")
    .eq("id", workshop.teacher_id)
    .maybeSingle()

  const siteUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://planck.academy").replace(/\/$/, "")

  const result = await triggerWorkshopEmail({
    email: input.userEmail,
    kind: "confirm",
    fields: {
      ws_title: workshop.title,
      ws_when: formatWorkshopDateTime(workshop.starts_at),
      ws_url: `${siteUrl}/pregatire/${input.workshopId}`,
      ws_meet_url: "",
      ws_teacher: teacher?.name || "",
      ws_subject: workshop.subject,
    },
  })

  await supabase.from("workshop_reminder_sends").upsert(
    {
      workshop_id: input.workshopId,
      user_id: input.userId,
      reminder_kind: "confirm",
      channel: "email",
      status: result.ok ? "sent" : "failed",
      error_message: result.ok ? null : result.message,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "workshop_id,user_id,reminder_kind,channel" }
  )

  if (result.ok) {
    logger.info("[pregatire/unlock] confirm email sent", {
      workshopId: input.workshopId,
      userId: input.userId,
    })
  } else {
    logger.error("[pregatire/unlock] confirm email failed", {
      workshopId: input.workshopId,
      userId: input.userId,
      error: result.message,
    })
  }
}

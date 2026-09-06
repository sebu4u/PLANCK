import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { mentorCreateWorkshopSchema, normalizeStartsAt } from "@/lib/mentor/schemas"
import { requireMentorSession } from "@/lib/mentor/session"
import { attachMentorWorkshopMaterials, uniqueWorkshopSlug } from "@/lib/mentor/workshops"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export async function POST(req: NextRequest) {
  try {
    const session = await requireMentorSession(req.headers)
    if (session instanceof NextResponse) return session

    const parsed = mentorCreateWorkshopSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Date invalide." },
        { status: 400 },
      )
    }

    let startsAt: string
    try {
      startsAt = normalizeStartsAt(parsed.data.starts_at)
    } catch {
      return NextResponse.json({ error: "Data și ora sunt invalide." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const slug = await uniqueWorkshopSlug(supabase, parsed.data.title)
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("workshops")
      .insert({
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        subject: parsed.data.subject,
        teacher_id: session.teacher.id,
        starts_at: startsAt,
        duration_minutes: parsed.data.duration_minutes,
        energy_cost: parsed.data.energy_cost,
        meet_url: parsed.data.meet_url,
        max_seats: parsed.data.max_seats ?? null,
        is_published: parsed.data.is_published,
        is_bac: parsed.data.is_bac,
        updated_at: now,
      })
      .select(
        "id, title, slug, description, subject, teacher_id, starts_at, duration_minutes, energy_cost, meet_url, recording_url, max_seats, is_published, is_bac, whiteboard_url, notes_markdown, notes_pdf_path, homework_pdf_path, created_at, updated_at",
      )
      .single()

    if (error) {
      logger.error("[mentor/workshops] POST failed:", error)
      return NextResponse.json({ error: "Nu am putut crea meditația." }, { status: 500 })
    }

    const workshop = await attachMentorWorkshopMaterials(supabase, data, 0)
    return NextResponse.json({ workshop }, { status: 201 })
  } catch (error) {
    logger.error("[mentor/workshops] POST:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

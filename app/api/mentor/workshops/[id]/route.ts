import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { mentorPatchWorkshopSchema } from "@/lib/mentor/schemas"
import { requireMentorSession } from "@/lib/mentor/session"
import { attachMentorWorkshopMaterials, fetchOwnedWorkshop } from "@/lib/mentor/workshops"
import { replaceHomeworkItems, WORKSHOP_MATERIALS_BUCKET } from "@/lib/pregatire/materials"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const workshopIdSchema = z.string().uuid()

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMentorSession(req.headers)
    if (session instanceof NextResponse) return session

    const { id } = await context.params
    const parsedId = workshopIdSchema.safeParse(id)
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID-ul meditației este invalid." }, { status: 400 })
    }

    const parsed = mentorPatchWorkshopSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Date invalide." },
        { status: 400 },
      )
    }

    const supabase = getServiceRoleSupabase()
    const existing = await fetchOwnedWorkshop(supabase, parsedId.data, session.teacher.id)
    if (!existing) {
      return NextResponse.json({ error: "Meditația nu a fost găsită." }, { status: 404 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.meet_url !== undefined) update.meet_url = parsed.data.meet_url
    if (parsed.data.whiteboard_url !== undefined) update.whiteboard_url = parsed.data.whiteboard_url
    if (parsed.data.notes_markdown !== undefined) {
      update.notes_markdown = parsed.data.notes_markdown?.trim() ?? ""
    }
    if (parsed.data.notes_pdf_path !== undefined) update.notes_pdf_path = parsed.data.notes_pdf_path
    if (parsed.data.homework_pdf_path !== undefined) {
      update.homework_pdf_path = parsed.data.homework_pdf_path
    }

    const { data, error } = await supabase
      .from("workshops")
      .update(update)
      .eq("id", existing.id)
      .eq("teacher_id", session.teacher.id)
      .select(
        "id, title, slug, description, subject, teacher_id, starts_at, duration_minutes, energy_cost, meet_url, recording_url, max_seats, is_published, is_bac, whiteboard_url, notes_markdown, notes_pdf_path, homework_pdf_path, created_at, updated_at",
      )
      .single()

    if (error) {
      logger.error("[mentor/workshops/id] PATCH failed:", error)
      return NextResponse.json({ error: "Nu am putut actualiza meditația." }, { status: 500 })
    }

    if (parsed.data.homework_items) {
      await replaceHomeworkItems(supabase, existing.id, parsed.data.homework_items)
    }

    const previousNotes = existing.notes_pdf_path
    const previousHomework = existing.homework_pdf_path
    if (previousNotes && previousNotes !== (data.notes_pdf_path ?? null)) {
      await supabase.storage.from(WORKSHOP_MATERIALS_BUCKET).remove([previousNotes])
    }
    if (previousHomework && previousHomework !== (data.homework_pdf_path ?? null)) {
      await supabase.storage.from(WORKSHOP_MATERIALS_BUCKET).remove([previousHomework])
    }

    const { count } = await supabase
      .from("workshop_unlocks")
      .select("user_id", { count: "exact", head: true })
      .eq("workshop_id", existing.id)

    const workshop = await attachMentorWorkshopMaterials(supabase, data, count ?? 0)
    return NextResponse.json({ workshop })
  } catch (error) {
    logger.error("[mentor/workshops/id] PATCH:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

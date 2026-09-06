import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { requireMentorSession } from "@/lib/mentor/session"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const teacherPatchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  icon_url: z.string().url().nullable().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireMentorSession(req.headers)
    if (session instanceof NextResponse) return session

    const parsed = teacherPatchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Date invalide." },
        { status: 400 },
      )
    }

    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase
      .from("workshop_teachers")
      .update({
        name: parsed.data.name,
        description: parsed.data.description,
        icon_url: parsed.data.icon_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.teacher.id)
      .eq("mentor_user_id", session.userId)
      .select("id, name, description, icon_url, is_active, mentor_user_id, created_at, updated_at")
      .single()

    if (error) {
      logger.error("[mentor/teacher] PATCH failed:", error)
      return NextResponse.json({ error: "Nu am putut actualiza profilul." }, { status: 500 })
    }

    return NextResponse.json({ teacher: data })
  } catch (error) {
    logger.error("[mentor/teacher] PATCH:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

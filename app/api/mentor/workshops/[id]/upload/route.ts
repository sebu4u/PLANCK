import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { requireMentorSession } from "@/lib/mentor/session"
import { fetchOwnedWorkshop } from "@/lib/mentor/workshops"
import { signWorkshopPdfUrl, WORKSHOP_MATERIALS_BUCKET } from "@/lib/pregatire/materials"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const workshopIdSchema = z.string().uuid()
const MAX_BYTES = 15 * 1024 * 1024
const KINDS = new Set(["notes", "homework"])

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireMentorSession(req.headers)
  if (session instanceof NextResponse) return session

  try {
    const { id } = await context.params
    const parsedId = workshopIdSchema.safeParse(id)
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID-ul meditației este invalid." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const workshop = await fetchOwnedWorkshop(supabase, parsedId.data, session.teacher.id)
    if (!workshop) {
      return NextResponse.json({ error: "Meditația nu a fost găsită." }, { status: 404 })
    }

    const form = await req.formData()
    const file = form.get("file")
    const kindRaw = form.get("kind")
    const kind = typeof kindRaw === "string" ? kindRaw.trim() : ""

    if (!kind || !KINDS.has(kind)) {
      return NextResponse.json({ error: "Tipul fișierului este invalid." }, { status: 400 })
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF-ul este obligatoriu." }, { status: 400 })
    }
    if (file.type !== "application/pdf" || file.size > MAX_BYTES || file.size === 0) {
      return NextResponse.json(
        { error: "Folosește un PDF de maximum 15 MB." },
        { status: 400 },
      )
    }

    const path = `${workshop.id}/${kind}/${crypto.randomUUID()}.pdf`
    const { error } = await supabase.storage.from(WORKSHOP_MATERIALS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    })
    if (error) throw error

    const url = await signWorkshopPdfUrl(supabase, path)
    return NextResponse.json({ path, url }, { status: 201 })
  } catch (error) {
    logger.error("[mentor/workshops/upload] POST:", error)
    return NextResponse.json({ error: "Nu am putut încărca PDF-ul." }, { status: 500 })
  }
}

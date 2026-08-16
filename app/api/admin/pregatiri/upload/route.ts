import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { signWorkshopPdfUrl, WORKSHOP_MATERIALS_BUCKET } from "@/lib/pregatire/materials"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const MAX_BYTES = 15 * 1024 * 1024
const KINDS = new Set(["notes", "homework"])

async function verifyAdmin(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token || isJwtExpired(token)) return null
  const client = createServerClientWithToken(token)
  const { data } = await client.auth.getUser()
  return data.user && (await isAdminFromDB(client, data.user)) ? data.user : null
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: "Acces interzis." }, { status: 403 })

  try {
    const form = await req.formData()
    const file = form.get("file")
    const workshopIdRaw = form.get("workshopId")
    const kindRaw = form.get("kind")
    const workshopId = typeof workshopIdRaw === "string" ? workshopIdRaw.trim() : ""
    const kind = typeof kindRaw === "string" ? kindRaw.trim() : ""

    if (!workshopId || !/^[0-9a-f-]{36}$/i.test(workshopId)) {
      return NextResponse.json({ error: "ID-ul pregătirii este invalid." }, { status: 400 })
    }
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

    const supabase = getServiceRoleSupabase()
    const { data: workshop } = await supabase.from("workshops").select("id").eq("id", workshopId).maybeSingle()
    if (!workshop) {
      return NextResponse.json({ error: "Pregătirea nu a fost găsită." }, { status: 404 })
    }

    const path = `${workshopId}/${kind}/${crypto.randomUUID()}.pdf`
    const { error } = await supabase.storage.from(WORKSHOP_MATERIALS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    })
    if (error) throw error

    const url = await signWorkshopPdfUrl(supabase, path)
    return NextResponse.json({ path, url }, { status: 201 })
  } catch (error) {
    logger.error("[admin/pregatiri/upload] POST error:", error)
    return NextResponse.json({ error: "Nu am putut încărca PDF-ul." }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { optimizeImage } from "@/lib/media/optimize-image"
import { requireMentorSession } from "@/lib/mentor/session"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req: NextRequest) {
  const session = await requireMentorSession(req.headers)
  if (session instanceof NextResponse) return session

  try {
    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Imaginea este obligatorie." }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Folosește JPEG, PNG, WebP sau GIF de maximum 4 MB." },
        { status: 400 },
      )
    }

    const optimized = await optimizeImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
      "teacher",
    )
    const path = `icons/${session.userId}/${crypto.randomUUID()}.${optimized.extension}`
    const supabase = getServiceRoleSupabase()
    const { error } = await supabase.storage.from("workshop-teachers").upload(path, optimized.bytes, {
      cacheControl: "31536000, immutable",
      contentType: optimized.contentType,
      upsert: false,
    })
    if (error) throw error

    const { data } = supabase.storage.from("workshop-teachers").getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, path }, { status: 201 })
  } catch (error) {
    logger.error("[mentor/teacher/upload] POST:", error)
    return NextResponse.json({ error: "Nu am putut încărca imaginea." }, { status: 500 })
  }
}

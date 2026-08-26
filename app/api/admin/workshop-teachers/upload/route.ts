import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { optimizeImage } from "@/lib/media/optimize-image"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

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
    const path = `icons/${user.id}/${crypto.randomUUID()}.${optimized.extension}`
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
    logger.error("[admin/workshop-teachers/upload] POST error:", error)
    return NextResponse.json({ error: "Nu am putut încărca imaginea." }, { status: 500 })
  }
}

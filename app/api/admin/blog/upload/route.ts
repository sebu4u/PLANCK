import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { logger } from "@/lib/logger"

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

async function verifyAdmin(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token || isJwtExpired(token)) return null
  const client = createServerClientWithToken(token)
  const { data } = await client.auth.getUser()
  return data.user && (await isAdminFromDB(client, data.user)) ? data.user : null
}

function extensionFor(file: File) {
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: "Acces interzis." }, { status: 403 })

  try {
    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Imaginea este obligatorie." }, { status: 400 })
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Folosește JPEG, PNG, WebP sau GIF de maximum 4 MB." }, { status: 400 })
    }

    const path = `articles/${user.id}/${crypto.randomUUID()}.${extensionFor(file)}`
    const supabase = getServiceRoleSupabase()
    const { error } = await supabase.storage.from("blog-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, path }, { status: 201 })
  } catch (error) {
    logger.error("[admin/blog/upload] POST error:", error)
    return NextResponse.json({ error: "Nu am putut încărca imaginea." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  try {
    const body = await req.json()
    const path = typeof body?.path === "string" ? body.path : ""
    if (!path.startsWith(`articles/${user.id}/`)) {
      return NextResponse.json({ error: "Calea imaginii este invalidă." }, { status: 400 })
    }
    const { error } = await getServiceRoleSupabase().storage.from("blog-images").remove([path])
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("[admin/blog/upload] DELETE error:", error)
    return NextResponse.json({ error: "Nu am putut șterge imaginea." }, { status: 500 })
  }
}

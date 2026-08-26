import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { optimizeImage } from "@/lib/media/optimize-image"
import { extractStoragePathFromPublicUrl } from "@/lib/learning-path-image-upload"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"
export const maxDuration = 60

const AVATARS_BUCKET = "avatars"
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"])

export async function POST(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }
    const userId = userData.user.id

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Imaginea este obligatorie." }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Folosește JPEG, PNG, WebP sau GIF de maximum 15 MB." },
        { status: 400 },
      )
    }

    const optimized = await optimizeImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
      "avatar",
    )
    const path = `avatars/${userId}/${crypto.randomUUID()}.${optimized.extension}`
    const admin = getServiceRoleSupabase()
    const { error: uploadError } = await admin.storage.from(AVATARS_BUCKET).upload(path, optimized.bytes, {
      cacheControl: "31536000, immutable",
      contentType: optimized.contentType,
      upsert: false,
    })
    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = admin.storage.from(AVATARS_BUCKET).getPublicUrl(path)
    const publicUrl = publicUrlData.publicUrl

    const { data: existing } = await supabase
      .from("profiles")
      .select("user_icon")
      .eq("user_id", userId)
      .maybeSingle()

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ user_icon: publicUrl })
      .eq("user_id", userId)
    if (updateError) {
      await admin.storage.from(AVATARS_BUCKET).remove([path])
      throw updateError
    }

    const oldPath = existing?.user_icon
      ? extractStoragePathFromPublicUrl(existing.user_icon, AVATARS_BUCKET)
      : null
    if (oldPath && oldPath !== path) {
      await admin.storage.from(AVATARS_BUCKET).remove([oldPath])
    }

    return NextResponse.json({ url: publicUrl, path }, { status: 201 })
  } catch (error) {
    logger.error("[profile/avatar] POST error:", error)
    return NextResponse.json({ error: "Nu am putut încărca imaginea." }, { status: 500 })
  }
}

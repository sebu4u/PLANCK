import { NextRequest, NextResponse } from "next/server"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import {
  buildChapterCoverPath,
  buildLessonCoverPath,
  deleteLearningPathImage,
  extractStoragePathFromPublicUrl,
  isOfficialPath,
  learningPathImageDeleteSchema,
  learningPathImageUploadSchema,
  readAndValidateLearningPathImage,
  uploadLearningPathImage,
} from "@/lib/learning-path-image-upload"

export const runtime = "nodejs"
export const maxDuration = 60

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const supabase = createServerClientWithToken(accessToken)
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(supabase, userData.user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }
  return { supabase, user: userData.user }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fișierul este obligatoriu." }, { status: 400 })
    }

    const parsed = learningPathImageUploadSchema.safeParse({
      kind: form.get("kind"),
      id: form.get("id"),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "kind și id sunt obligatorii și trebuie să fie valide." }, { status: 400 })
    }
    const { kind, id } = parsed.data

    let validated
    try {
      validated = await readAndValidateLearningPathImage(file)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fișier invalid."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const path =
      kind === "chapter"
        ? buildChapterCoverPath(id, validated.extension)
        : await buildLessonCoverPath(id, validated.extension)

    const publicUrl = await uploadLearningPathImage(path, validated.bytes, validated.contentType)

    return NextResponse.json({ success: true, url: publicUrl, path })
  } catch (err: unknown) {
    logger.error("[admin/learning-paths/upload] POST:", err)
    return NextResponse.json({ error: "Eroare internă la upload." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    const parsed = learningPathImageDeleteSchema.safeParse({
      path: body.path ?? new URL(req.url).searchParams.get("path"),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "path este obligatoriu." }, { status: 400 })
    }
    const { path } = parsed.data
    if (!isOfficialPath(path)) {
      return NextResponse.json(
        { error: "Se pot șterge doar fișiere din prefixul official/." },
        { status: 400 },
      )
    }
    await deleteLearningPathImage(path)
    return NextResponse.json({ success: true, path })
  } catch (err: unknown) {
    logger.error("[admin/learning-paths/upload] DELETE:", err)
    return NextResponse.json({ error: "Eroare internă la ștergere." }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"

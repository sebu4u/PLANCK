import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { logger } from "@/lib/logger"
import {
  CONTENT_REPORT_ALLOWED_MIME,
  CONTENT_REPORT_ISSUE_TYPES,
  CONTENT_REPORT_MAX_PER_HOUR,
  CONTENT_REPORT_MAX_SCREENSHOT_BYTES,
  CONTENT_REPORT_MIN_DESCRIPTION_LENGTH,
  CONTENT_REPORT_SOURCE_TYPES,
  CONTENT_REPORTS_BUCKET,
  screenshotExtensionForMime,
} from "@/lib/content-reports"

const fieldsSchema = z.object({
  issue_type: z.enum(CONTENT_REPORT_ISSUE_TYPES),
  description: z
    .string()
    .trim()
    .min(CONTENT_REPORT_MIN_DESCRIPTION_LENGTH, "Descrierea trebuie să aibă cel puțin 10 caractere.")
    .max(4000, "Descrierea este prea lungă."),
  source_type: z.enum(CONTENT_REPORT_SOURCE_TYPES),
  source_id: z.string().trim().min(1).max(200),
  source_url: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine((value) => value.startsWith("/"), "URL-ul sursei este invalid."),
  source_meta: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
})

function parseSourceMeta(raw: FormDataEntryValue | null): unknown {
  if (raw == null || raw === "") return {}
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }
  if (isJwtExpired(accessToken)) {
    return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
  }

  const supabaseUser = createServerClientWithToken(accessToken)
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const screenshot = form.get("screenshot")
    if (!(screenshot instanceof File) || screenshot.size === 0) {
      return NextResponse.json({ error: "Screenshot-ul este obligatoriu." }, { status: 400 })
    }
    if (!CONTENT_REPORT_ALLOWED_MIME.has(screenshot.type) || screenshot.size > CONTENT_REPORT_MAX_SCREENSHOT_BYTES) {
      return NextResponse.json(
        { error: "Folosește JPEG, PNG sau WebP de maximum 8 MB." },
        { status: 400 },
      )
    }

    const sourceMetaRaw = parseSourceMeta(form.get("source_meta"))
    if (sourceMetaRaw === null) {
      return NextResponse.json({ error: "Metadatele sursei sunt invalide." }, { status: 400 })
    }

    const parsed = fieldsSchema.safeParse({
      issue_type: form.get("issue_type"),
      description: form.get("description"),
      source_type: form.get("source_type"),
      source_id: form.get("source_id"),
      source_url: form.get("source_url"),
      source_meta: sourceMetaRaw,
    })
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Datele raportului sunt invalide."
      return NextResponse.json({ error: first }, { status: 400 })
    }

    const service = getServiceRoleSupabase()
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await service
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", hourAgo)

    if (countError) {
      logger.error("[content-reports] rate limit count:", countError)
      return NextResponse.json({ error: "Nu am putut salva raportul." }, { status: 500 })
    }
    if ((count ?? 0) >= CONTENT_REPORT_MAX_PER_HOUR) {
      return NextResponse.json(
        { error: "Ai trimis prea multe rapoarte. Încearcă din nou mai târziu." },
        { status: 429 },
      )
    }

    const ext = screenshotExtensionForMime(screenshot.type)
    const screenshotPath = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await service.storage
      .from(CONTENT_REPORTS_BUCKET)
      .upload(screenshotPath, screenshot, {
        cacheControl: "31536000",
        contentType: screenshot.type === "image/jpg" ? "image/jpeg" : screenshot.type,
        upsert: false,
      })
    if (uploadError) {
      logger.error("[content-reports] upload:", uploadError)
      return NextResponse.json({ error: "Nu am putut încărca screenshot-ul." }, { status: 500 })
    }

    const { data: inserted, error: insertError } = await service
      .from("content_reports")
      .insert({
        user_id: user.id,
        issue_type: parsed.data.issue_type,
        description: parsed.data.description,
        screenshot_path: screenshotPath,
        source_type: parsed.data.source_type,
        source_id: parsed.data.source_id,
        source_url: parsed.data.source_url,
        source_meta: parsed.data.source_meta ?? {},
      })
      .select("id")
      .single()

    if (insertError || !inserted) {
      logger.error("[content-reports] insert:", insertError)
      await service.storage.from(CONTENT_REPORTS_BUCKET).remove([screenshotPath])
      return NextResponse.json({ error: "Nu am putut salva raportul." }, { status: 500 })
    }

    return NextResponse.json({ id: inserted.id }, { status: 201 })
  } catch (error) {
    logger.error("[content-reports] POST:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

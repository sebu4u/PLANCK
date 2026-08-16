import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { slugify } from "@/lib/slug"
import {
  WORKSHOP_DEFAULT_DURATION_MINUTES,
  WORKSHOP_DEFAULT_ENERGY_COST,
  WORKSHOP_HOMEWORK_ITEM_TYPES,
  WORKSHOP_SUBJECTS,
} from "@/lib/pregatire/types"
import {
  fetchHomeworkItemsByWorkshopIds,
  replaceHomeworkItems,
  signWorkshopPdfUrls,
  WORKSHOP_MATERIALS_BUCKET,
} from "@/lib/pregatire/materials"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const homeworkItemSchema = z.object({
  item_type: z.enum(WORKSHOP_HOMEWORK_ITEM_TYPES),
  ref_id: z.string().trim().min(1).max(180),
  title: z.string().trim().min(1).max(300),
  href: z.string().trim().min(1).max(500),
})

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null || value === "") return null
    return value
  })
  .refine((value) => value == null || /^https?:\/\//i.test(value), {
    message: "URL-ul tablei trebuie să înceapă cu http(s).",
  })

const optionalPath = z
  .string()
  .trim()
  .max(512)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null || value === "") return null
    return value
  })

const workshopSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(180).optional(),
  description: z.string().trim().max(5000).default(""),
  subject: z.enum(WORKSHOP_SUBJECTS),
  teacher_id: z.string().uuid(),
  starts_at: z.string().trim().min(1),
  duration_minutes: z.number().int().min(15).max(480).default(WORKSHOP_DEFAULT_DURATION_MINUTES),
  energy_cost: z.number().int().min(1).max(500).default(WORKSHOP_DEFAULT_ENERGY_COST),
  meet_url: z.string().url(),
  recording_url: z.string().url().nullable().optional(),
  max_seats: z.number().int().min(1).max(10000).nullable().optional(),
  is_published: z.boolean().default(false),
  whiteboard_url: optionalUrl,
  notes_markdown: z.string().max(100_000).optional().nullable(),
  notes_pdf_path: optionalPath,
  homework_pdf_path: optionalPath,
  homework_items: z.array(homeworkItemSchema).max(80).optional(),
})

async function verifyAdmin(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(token)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const client = createServerClientWithToken(token)
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(client, data.user))) {
    return {
      error: NextResponse.json(
        { error: "Acces interzis. Doar adminii pot administra pregătirile." },
        { status: 403 },
      ),
    }
  }
  return { user: data.user }
}

function normalizeStartsAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_starts_at")
  }
  return date.toISOString()
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = getServiceRoleSupabase()
  let candidate = slugify(base) || `pregatire-${Date.now()}`
  let suffix = 0
  while (true) {
    const trySlug = suffix === 0 ? candidate : `${candidate}-${suffix}`
    let query = supabase.from("workshops").select("id").eq("slug", trySlug).limit(1)
    if (excludeId) query = query.neq("id", excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return trySlug
    suffix += 1
    if (suffix > 50) return `${candidate}-${crypto.randomUUID().slice(0, 8)}`
  }
}

async function attachMaterials<T extends { id: string; notes_pdf_path?: string | null; homework_pdf_path?: string | null }>(
  rows: T[],
) {
  const supabase = getServiceRoleSupabase()
  const ids = rows.map((row) => row.id)
  const homeworkMap = await fetchHomeworkItemsByWorkshopIds(supabase, ids)
  const signed = await signWorkshopPdfUrls(
    supabase,
    rows.flatMap((row) => [row.notes_pdf_path, row.homework_pdf_path]),
  )
  return rows.map((row) => ({
    ...row,
    notes_pdf_url: row.notes_pdf_path ? signed.get(row.notes_pdf_path) ?? null : null,
    homework_pdf_url: row.homework_pdf_path ? signed.get(row.homework_pdf_path) ?? null : null,
    homework_items: homeworkMap.get(row.id) ?? [],
  }))
}

async function removeStorageIfUnused(path: string | null | undefined) {
  if (!path?.trim()) return
  const supabase = getServiceRoleSupabase()
  await supabase.storage.from(WORKSHOP_MATERIALS_BUCKET).remove([path.trim()])
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const supabase = getServiceRoleSupabase()
    const { data, error } = await supabase
      .from("workshops")
      .select("*, workshop_teachers(id, name, icon_url, is_active)")
      .order("starts_at", { ascending: false })

    if (error) {
      logger.error("[admin/pregatiri] GET failed:", error)
      return NextResponse.json({ error: "Nu am putut încărca pregătirile." }, { status: 500 })
    }

    const workshops = await attachMaterials(data ?? [])
    return NextResponse.json({ workshops })
  } catch (err) {
    logger.error("[admin/pregatiri] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

function materialsFields(parsed: z.infer<typeof workshopSchema>) {
  return {
    whiteboard_url: parsed.whiteboard_url ?? null,
    notes_markdown: parsed.notes_markdown?.trim() ?? "",
    notes_pdf_path: parsed.notes_pdf_path ?? null,
    homework_pdf_path: parsed.homework_pdf_path ?? null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const parsed = workshopSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Date invalide." },
        { status: 400 },
      )
    }

    let startsAt: string
    try {
      startsAt = normalizeStartsAt(parsed.data.starts_at)
    } catch {
      return NextResponse.json({ error: "Data și ora sunt invalide." }, { status: 400 })
    }

    const slug = await uniqueSlug(parsed.data.slug || parsed.data.title)
    const supabase = getServiceRoleSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("workshops")
      .insert({
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        subject: parsed.data.subject,
        teacher_id: parsed.data.teacher_id,
        starts_at: startsAt,
        duration_minutes: parsed.data.duration_minutes,
        energy_cost: parsed.data.energy_cost,
        meet_url: parsed.data.meet_url,
        recording_url: parsed.data.recording_url ?? null,
        max_seats: parsed.data.max_seats ?? null,
        is_published: parsed.data.is_published,
        updated_at: now,
        ...materialsFields(parsed.data),
      })
      .select("*, workshop_teachers(id, name, icon_url, is_active)")
      .single()

    if (error) {
      logger.error("[admin/pregatiri] POST failed:", error)
      return NextResponse.json({ error: "Nu am putut crea pregătirea." }, { status: 500 })
    }

    if (parsed.data.homework_items) {
      await replaceHomeworkItems(supabase, data.id, parsed.data.homework_items)
    }

    const [workshop] = await attachMaterials([data])
    return NextResponse.json({ workshop }, { status: 201 })
  } catch (err) {
    logger.error("[admin/pregatiri] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const parsed = workshopSchema.safeParse(await req.json())
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json(
        {
          error: parsed.success
            ? "ID-ul este obligatoriu."
            : (parsed.error.issues[0]?.message ?? "Date invalide."),
        },
        { status: 400 },
      )
    }

    let startsAt: string
    try {
      startsAt = normalizeStartsAt(parsed.data.starts_at)
    } catch {
      return NextResponse.json({ error: "Data și ora sunt invalide." }, { status: 400 })
    }

    const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, parsed.data.id)
    const supabase = getServiceRoleSupabase()

    const { data: previous } = await supabase
      .from("workshops")
      .select("notes_pdf_path, homework_pdf_path")
      .eq("id", parsed.data.id)
      .maybeSingle()

    const nextMaterials = materialsFields(parsed.data)

    const { data, error } = await supabase
      .from("workshops")
      .update({
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        subject: parsed.data.subject,
        teacher_id: parsed.data.teacher_id,
        starts_at: startsAt,
        duration_minutes: parsed.data.duration_minutes,
        energy_cost: parsed.data.energy_cost,
        meet_url: parsed.data.meet_url,
        recording_url: parsed.data.recording_url ?? null,
        max_seats: parsed.data.max_seats ?? null,
        is_published: parsed.data.is_published,
        updated_at: new Date().toISOString(),
        ...nextMaterials,
      })
      .eq("id", parsed.data.id)
      .select("*, workshop_teachers(id, name, icon_url, is_active)")
      .single()

    if (error) {
      logger.error("[admin/pregatiri] PUT failed:", error)
      return NextResponse.json({ error: "Nu am putut actualiza pregătirea." }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Pregătirea nu a fost găsită." }, { status: 404 })
    }

    if (parsed.data.homework_items) {
      await replaceHomeworkItems(supabase, parsed.data.id, parsed.data.homework_items)
    }

    if (previous?.notes_pdf_path && previous.notes_pdf_path !== nextMaterials.notes_pdf_path) {
      await removeStorageIfUnused(previous.notes_pdf_path)
    }
    if (previous?.homework_pdf_path && previous.homework_pdf_path !== nextMaterials.homework_pdf_path) {
      await removeStorageIfUnused(previous.homework_pdf_path)
    }

    const [workshop] = await attachMaterials([data])
    return NextResponse.json({ workshop })
  } catch (err) {
    logger.error("[admin/pregatiri] PUT error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const id = new URL(req.url).searchParams.get("id")?.trim()
    if (!id) {
      return NextResponse.json({ error: "ID-ul este obligatoriu." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()
    const { data: previous } = await supabase
      .from("workshops")
      .select("notes_pdf_path, homework_pdf_path")
      .eq("id", id)
      .maybeSingle()

    const { error } = await supabase.from("workshops").delete().eq("id", id)
    if (error) {
      logger.error("[admin/pregatiri] DELETE failed:", error)
      return NextResponse.json({ error: "Nu am putut șterge pregătirea." }, { status: 500 })
    }

    await removeStorageIfUnused(previous?.notes_pdf_path)
    await removeStorageIfUnused(previous?.homework_pdf_path)
    await supabase.storage.from(WORKSHOP_MATERIALS_BUCKET).remove([`${id}/notes`, `${id}/homework`]).catch(() => undefined)

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("[admin/pregatiri] DELETE error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  EMPTY_WORKSHOP_MATERIALS,
  isWorkshopHomeworkItemType,
  type WorkshopHomeworkItem,
  type WorkshopMaterials,
} from "@/lib/pregatire/types"

export const WORKSHOP_MATERIALS_BUCKET = "workshop-materials"
export const WORKSHOP_PDF_SIGNED_TTL_SEC = 60 * 60

export async function signWorkshopPdfUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path?.trim()) return null
  const { data, error } = await supabase.storage
    .from(WORKSHOP_MATERIALS_BUCKET)
    .createSignedUrl(path.trim(), WORKSHOP_PDF_SIGNED_TTL_SEC)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function signWorkshopPdfUrls(
  supabase: SupabaseClient,
  paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.map((p) => p?.trim()).filter((p): p is string => Boolean(p)))]
  const map = new Map<string, string>()
  if (unique.length === 0) return map
  const { data } = await supabase.storage
    .from(WORKSHOP_MATERIALS_BUCKET)
    .createSignedUrls(unique, WORKSHOP_PDF_SIGNED_TTL_SEC)
  for (const row of data ?? []) {
    if (row.path && row.signedUrl && !row.error) {
      map.set(row.path, row.signedUrl)
    }
  }
  return map
}

export function mapHomeworkItem(row: {
  id?: string
  item_type: string
  ref_id: string
  title: string
  href: string
  sort_order?: number
}): WorkshopHomeworkItem | null {
  if (!isWorkshopHomeworkItemType(row.item_type)) return null
  return {
    id: row.id,
    item_type: row.item_type,
    ref_id: row.ref_id,
    title: row.title,
    href: row.href,
    sort_order: row.sort_order,
  }
}

export async function fetchHomeworkItemsByWorkshopIds(
  supabase: SupabaseClient,
  workshopIds: string[],
): Promise<Map<string, WorkshopHomeworkItem[]>> {
  const map = new Map<string, WorkshopHomeworkItem[]>()
  if (workshopIds.length === 0) return map
  const { data } = await supabase
    .from("workshop_homework_items")
    .select("id, workshop_id, item_type, ref_id, title, href, sort_order")
    .in("workshop_id", workshopIds)
    .order("sort_order", { ascending: true })

  for (const row of data ?? []) {
    const item = mapHomeworkItem(row)
    if (!item) continue
    const list = map.get(row.workshop_id as string) ?? []
    list.push(item)
    map.set(row.workshop_id as string, list)
  }
  return map
}

export async function replaceHomeworkItems(
  supabase: SupabaseClient,
  workshopId: string,
  items: WorkshopHomeworkItem[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("workshop_homework_items")
    .delete()
    .eq("workshop_id", workshopId)
  if (deleteError) throw deleteError

  if (items.length === 0) return

  const { error: insertError } = await supabase.from("workshop_homework_items").insert(
    items.map((item, index) => ({
      workshop_id: workshopId,
      item_type: item.item_type,
      ref_id: item.ref_id,
      title: item.title,
      href: item.href,
      sort_order: index,
    })),
  )
  if (insertError) throw insertError
}

export async function loadUnlockedMaterials(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<
  WorkshopMaterials & {
    meet_url: string | null
    recording_url: string | null
  }
> {
  const { data: full } = await supabase
    .from("workshops")
    .select("meet_url, recording_url, whiteboard_url, notes_markdown, notes_pdf_path, homework_pdf_path")
    .eq("id", workshopId)
    .maybeSingle()

  const homeworkMap = await fetchHomeworkItemsByWorkshopIds(supabase, [workshopId])
  const notesPdf = await signWorkshopPdfUrl(supabase, full?.notes_pdf_path)
  const homeworkPdf = await signWorkshopPdfUrl(supabase, full?.homework_pdf_path)
  const notesMarkdown = typeof full?.notes_markdown === "string" ? full.notes_markdown.trim() : ""

  return {
    meet_url: full?.meet_url ?? null,
    recording_url: full?.recording_url ?? null,
    whiteboard_url: full?.whiteboard_url?.trim() || null,
    notes_markdown: notesMarkdown || null,
    notes_pdf_url: notesPdf,
    homework_pdf_url: homeworkPdf,
    homework_items: homeworkMap.get(workshopId) ?? [],
  }
}

export function lockedMaterials(): WorkshopMaterials {
  return { ...EMPTY_WORKSHOP_MATERIALS }
}

export type WorkshopMaterialPresence = {
  has_whiteboard: boolean
  has_notes: boolean
  has_homework: boolean
}

export function materialsPresenceFrom(materials: WorkshopMaterials): WorkshopMaterialPresence {
  return {
    has_whiteboard: Boolean(materials.whiteboard_url?.trim()),
    has_notes: Boolean(materials.notes_markdown?.trim() || materials.notes_pdf_url),
    has_homework: Boolean(materials.homework_pdf_url || materials.homework_items.length > 0),
  }
}

/** Booleans only — do not return markdown, signed URLs, or homework titles. */
export async function loadMaterialPresence(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<WorkshopMaterialPresence> {
  const [{ data: full }, { count }] = await Promise.all([
    supabase
      .from("workshops")
      .select("whiteboard_url, notes_markdown, notes_pdf_path, homework_pdf_path")
      .eq("id", workshopId)
      .maybeSingle(),
    supabase
      .from("workshop_homework_items")
      .select("id", { count: "exact", head: true })
      .eq("workshop_id", workshopId),
  ])

  const notesMarkdown = typeof full?.notes_markdown === "string" ? full.notes_markdown.trim() : ""
  return {
    has_whiteboard: Boolean(full?.whiteboard_url?.trim()),
    has_notes: Boolean(notesMarkdown || full?.notes_pdf_path?.trim()),
    has_homework: Boolean(full?.homework_pdf_path?.trim() || (count ?? 0) > 0),
  }
}

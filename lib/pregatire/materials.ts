import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  EMPTY_WORKSHOP_MATERIALS,
  isWorkshopHomeworkItemType,
  type WorkshopHomeworkItem,
  type WorkshopMaterials,
  type WorkshopMaterialsHubItem,
  type WorkshopPublic,
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

type WorkshopMaterialRow = {
  id: string
  notes_markdown: string | null
  notes_pdf_path: string | null
  homework_pdf_path: string | null
}

/** Batch hub payload: presence for all, content only for unlocked workshops. */
export async function loadMaterialsHub(
  supabase: SupabaseClient,
  workshops: WorkshopPublic[],
  unlockIds: Set<string>,
): Promise<WorkshopMaterialsHubItem[]> {
  const ids = workshops.map((w) => w.id)
  if (ids.length === 0) return []

  const unlockedIds = ids.filter((id) => unlockIds.has(id))

  const [{ data: fullRows }, { data: homeworkPresenceRows }, homeworkMap] = await Promise.all([
    supabase
      .from("workshops")
      .select("id, notes_markdown, notes_pdf_path, homework_pdf_path")
      .in("id", ids),
    supabase.from("workshop_homework_items").select("workshop_id").in("workshop_id", ids),
    fetchHomeworkItemsByWorkshopIds(supabase, unlockedIds),
  ])

  const fullById = new Map<string, WorkshopMaterialRow>()
  for (const row of fullRows ?? []) {
    fullById.set(row.id as string, row as WorkshopMaterialRow)
  }

  const homeworkWorkshopIds = new Set(
    (homeworkPresenceRows ?? []).map((row) => row.workshop_id as string),
  )

  const withPresence = workshops
    .map((workshop) => {
      const full = fullById.get(workshop.id)
      const notesMarkdown =
        typeof full?.notes_markdown === "string" ? full.notes_markdown.trim() : ""
      const notesPath = full?.notes_pdf_path?.trim() || null
      const homeworkPath = full?.homework_pdf_path?.trim() || null
      const hasNotes = Boolean(notesMarkdown || notesPath)
      const hasHomework = Boolean(homeworkPath || homeworkWorkshopIds.has(workshop.id))
      return {
        workshop,
        hasNotes,
        hasHomework,
        notesMarkdown,
        notesPath,
        homeworkPath,
      }
    })
    .filter((item) => item.hasNotes || item.hasHomework)

  const unlocked = withPresence.filter((item) => unlockIds.has(item.workshop.id))
  const signed = await signWorkshopPdfUrls(supabase, [
    ...unlocked.map((item) => item.notesPath),
    ...unlocked.map((item) => item.homeworkPath),
  ])

  return withPresence
    .sort((a, b) => b.workshop.starts_at.localeCompare(a.workshop.starts_at))
    .map((item) => {
      const unlockedItem = unlockIds.has(item.workshop.id)
      return {
        workshop: item.workshop,
        has_notes: item.hasNotes,
        has_homework: item.hasHomework,
        notes_markdown: unlockedItem ? item.notesMarkdown || null : null,
        notes_pdf_url:
          unlockedItem && item.notesPath ? (signed.get(item.notesPath) ?? null) : null,
        homework_pdf_url:
          unlockedItem && item.homeworkPath ? (signed.get(item.homeworkPath) ?? null) : null,
        homework_items: unlockedItem ? (homeworkMap.get(item.workshop.id) ?? []) : [],
      }
    })
}

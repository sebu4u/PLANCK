import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { slugify } from "@/lib/slug"
import {
  fetchHomeworkItemsByWorkshopIds,
  signWorkshopPdfUrls,
} from "@/lib/pregatire/materials"
import type { WorkshopHomeworkItem } from "@/lib/pregatire/types"

export type MentorWorkshopRow = {
  id: string
  title: string
  slug: string
  description: string
  subject: string
  teacher_id: string
  starts_at: string
  duration_minutes: number
  energy_cost: number
  meet_url: string
  recording_url: string | null
  max_seats: number | null
  is_published: boolean
  is_bac: boolean
  whiteboard_url: string | null
  notes_markdown: string | null
  notes_pdf_path: string | null
  homework_pdf_path: string | null
  created_at?: string
  updated_at?: string
}

export type MentorWorkshopPayload = MentorWorkshopRow & {
  notes_pdf_url: string | null
  homework_pdf_url: string | null
  homework_items: WorkshopHomeworkItem[]
  unlock_count: number
}

export function workshopEndMs(workshop: { starts_at: string; duration_minutes: number }): number {
  return new Date(workshop.starts_at).getTime() + workshop.duration_minutes * 60_000
}

export function pickNextWorkshop<T extends { starts_at: string; duration_minutes: number }>(
  workshops: T[],
  now = new Date(),
): T | null {
  const nowMs = now.getTime()
  const upcoming = workshops
    .filter((workshop) => workshopEndMs(workshop) > nowMs)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  return upcoming[0] ?? null
}

export async function uniqueWorkshopSlug(
  supabase: SupabaseClient,
  base: string,
  excludeId?: string,
): Promise<string> {
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

export async function attachMentorWorkshopMaterials(
  supabase: SupabaseClient,
  row: MentorWorkshopRow,
  unlockCount = 0,
): Promise<MentorWorkshopPayload> {
  const homeworkMap = await fetchHomeworkItemsByWorkshopIds(supabase, [row.id])
  const signed = await signWorkshopPdfUrls(supabase, [row.notes_pdf_path, row.homework_pdf_path])
  return {
    ...row,
    notes_pdf_url: row.notes_pdf_path ? signed.get(row.notes_pdf_path) ?? null : null,
    homework_pdf_url: row.homework_pdf_path ? signed.get(row.homework_pdf_path) ?? null : null,
    homework_items: homeworkMap.get(row.id) ?? [],
    unlock_count: unlockCount,
  }
}

export async function fetchTeacherWorkshops(
  supabase: SupabaseClient,
  teacherId: string,
): Promise<MentorWorkshopRow[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select(
      "id, title, slug, description, subject, teacher_id, starts_at, duration_minutes, energy_cost, meet_url, recording_url, max_seats, is_published, is_bac, whiteboard_url, notes_markdown, notes_pdf_path, homework_pdf_path, created_at, updated_at",
    )
    .eq("teacher_id", teacherId)
    .order("starts_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as MentorWorkshopRow[]
}

const WORKSHOP_SELECT =
  "id, title, slug, description, subject, teacher_id, starts_at, duration_minutes, energy_cost, meet_url, recording_url, max_seats, is_published, is_bac, whiteboard_url, notes_markdown, notes_pdf_path, homework_pdf_path, created_at, updated_at"

export async function fetchOwnedWorkshop(
  supabase: SupabaseClient,
  workshopId: string,
  teacherId: string,
): Promise<MentorWorkshopRow | null> {
  const { data, error } = await supabase
    .from("workshops")
    .select(WORKSHOP_SELECT)
    .eq("id", workshopId)
    .eq("teacher_id", teacherId)
    .maybeSingle()

  if (error) throw error
  return (data as MentorWorkshopRow | null) ?? null
}

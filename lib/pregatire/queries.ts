import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { WorkshopPublic, WorkshopSubject, WorkshopTeacher } from "@/lib/pregatire/types"
import { isWorkshopSubject } from "@/lib/pregatire/types"

type WorkshopPublicRow = {
  id: string
  title: string
  slug: string
  description: string
  subject: string
  teacher_id: string
  starts_at: string
  duration_minutes: number
  energy_cost: number
  max_seats: number | null
  is_published: boolean
  is_bac: boolean
  has_recording: boolean
  unlock_count: number
  created_at?: string
  updated_at?: string
}

export function mapWorkshopPublic(
  row: WorkshopPublicRow,
  teacher?: WorkshopTeacher | null,
  unlocked = false,
): WorkshopPublic {
  const subject: WorkshopSubject = isWorkshopSubject(row.subject) ? row.subject : "mate"
  const seatsRemaining =
    row.max_seats == null ? null : Math.max(0, row.max_seats - (row.unlock_count ?? 0))

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    subject,
    teacher_id: row.teacher_id,
    starts_at: row.starts_at,
    duration_minutes: row.duration_minutes,
    energy_cost: row.energy_cost,
    max_seats: row.max_seats,
    is_published: row.is_published,
    is_bac: Boolean(row.is_bac),
    has_recording: Boolean(row.has_recording),
    unlock_count: row.unlock_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    teacher: teacher ?? null,
    unlocked,
    seats_remaining: seatsRemaining,
  }
}

export async function fetchTeachersByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, WorkshopTeacher>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, WorkshopTeacher>()
  if (unique.length === 0) return map

  const { data } = await supabase
    .from("workshop_teachers")
    .select("id, name, description, icon_url, is_active, created_at, updated_at")
    .in("id", unique)

  for (const row of data ?? []) {
    map.set(row.id, row as WorkshopTeacher)
  }
  return map
}

export async function fetchUserUnlockIds(
  supabase: SupabaseClient,
  userId: string,
  workshopIds: string[],
): Promise<Set<string>> {
  if (!userId || workshopIds.length === 0) return new Set()
  const { data } = await supabase
    .from("workshop_unlocks")
    .select("workshop_id")
    .eq("user_id", userId)
    .in("workshop_id", workshopIds)

  return new Set((data ?? []).map((r) => r.workshop_id as string))
}

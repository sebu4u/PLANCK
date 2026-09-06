import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { requireMentorSession } from "@/lib/mentor/session"
import {
  attachMentorWorkshopMaterials,
  fetchTeacherWorkshops,
  pickNextWorkshop,
} from "@/lib/mentor/workshops"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export async function GET(req: NextRequest) {
  try {
    const session = await requireMentorSession(req.headers)
    if (session instanceof NextResponse) return session

    const supabase = getServiceRoleSupabase()
    const workshops = await fetchTeacherWorkshops(supabase, session.teacher.id)
    const next = pickNextWorkshop(workshops)

    if (!next) {
      return NextResponse.json({
        teacher: session.teacher,
        workshop: null,
        students: [],
      })
    }

    const { count } = await supabase
      .from("workshop_unlocks")
      .select("user_id", { count: "exact", head: true })
      .eq("workshop_id", next.id)

    const workshop = await attachMentorWorkshopMaterials(supabase, next, count ?? 0)

    const { data: unlocks, error: unlocksError } = await supabase
      .from("workshop_unlocks")
      .select("user_id, unlocked_at")
      .eq("workshop_id", next.id)
      .order("unlocked_at", { ascending: true })

    if (unlocksError) {
      logger.error("[mentor/dashboard] unlocks:", unlocksError)
      return NextResponse.json({ error: "Nu am putut încărca elevii înscriși." }, { status: 500 })
    }

    const rows = unlocks ?? []
    const userIds = [...new Set(rows.map((row) => row.user_id as string).filter(Boolean))]
    const nameById = new Map<string, string>()

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, nickname")
        .in("user_id", userIds)

      if (profilesError) {
        logger.error("[mentor/dashboard] profiles:", profilesError)
        return NextResponse.json({ error: "Nu am putut încărca elevii înscriși." }, { status: 500 })
      }

      for (const profile of profiles ?? []) {
        const name =
          (typeof profile.name === "string" && profile.name.trim()) ||
          (typeof profile.nickname === "string" && profile.nickname.trim()) ||
          "Fără nume"
        nameById.set(profile.user_id as string, name)
      }
    }

    const students = rows.map((row) => ({
      name: nameById.get(row.user_id as string) ?? "Fără nume",
      enrolled_at: row.unlocked_at as string,
    }))

    return NextResponse.json({
      teacher: session.teacher,
      workshop,
      students,
    })
  } catch (error) {
    logger.error("[mentor/dashboard] GET:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

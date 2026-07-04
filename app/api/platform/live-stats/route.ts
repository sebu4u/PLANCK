import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

export const runtime = "nodejs"

function startOfTodayIso() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return start.toISOString()
}

export async function GET() {
  try {
    const supabase = getServiceRoleSupabase()
    const todayStart = startOfTodayIso()

    const [activeUsersResult, solvedTodayResult] = await Promise.all([
      supabase.rpc("get_concurrent_active_users"),
      supabase
        .from("solved_problems")
        .select("id", { count: "exact", head: true })
        .gte("solved_at", todayStart),
    ])

    if (activeUsersResult.error) {
      logger.error("live-stats active users error", activeUsersResult.error)
    }
    if (solvedTodayResult.error) {
      logger.error("live-stats solved today error", solvedTodayResult.error)
    }

    const activeUsers = Number(activeUsersResult.data ?? 0)
    const problemsSolvedToday = solvedTodayResult.count ?? 0

    return NextResponse.json(
      {
        activeUsers: Number.isFinite(activeUsers) ? activeUsers : 0,
        problemsSolvedToday,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    logger.error("live-stats route error", error)
    return NextResponse.json(
      { activeUsers: 0, problemsSolvedToday: 0 },
      { status: 500 }
    )
  }
}

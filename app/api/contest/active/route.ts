import { NextResponse } from "next/server"

import { getContestStatus } from "@/lib/contest-utils"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()
    const nowIso = now.toISOString()

    const { data: activeContest, error: activeError } = await supabase
      .from("contests")
      .select("id, name, start_time, duration_minutes, created_at")
      .lte("start_time", nowIso)
      .gt("start_time", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: false })
      .limit(20)

    if (activeError) {
      console.error("Contest active lookup error:", activeError)
      return NextResponse.json(
        { error: "Nu am putut încărca informațiile despre concurs." },
        { status: 500 }
      )
    }

    const currentContest =
      activeContest?.find((contest) => getContestStatus(contest, now).status === "active") ?? null

    if (currentContest) {
      const { status, remaining_seconds } = getContestStatus(currentContest, now)

      return NextResponse.json({
        contest: currentContest,
        status,
        remaining_seconds,
        server_time: nowIso
      })
    }

    const { data: upcomingContest, error: upcomingError } = await supabase
      .from("contests")
      .select("id, name, start_time, duration_minutes, created_at")
      .gt("start_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (upcomingError) {
      console.error("Contest upcoming lookup error:", upcomingError)
      return NextResponse.json(
        { error: "Nu am putut încărca informațiile despre concurs." },
        { status: 500 }
      )
    }

    if (upcomingContest) {
      const { status, remaining_seconds } = getContestStatus(upcomingContest, now)

      return NextResponse.json({
        contest: upcomingContest,
        status,
        remaining_seconds,
        server_time: nowIso
      })
    }

    const { data: latestPastContest, error: pastError } = await supabase
      .from("contests")
      .select("id, name, start_time, duration_minutes, created_at")
      .lte("start_time", nowIso)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pastError) {
      console.error("Contest latest past lookup error:", pastError)
      return NextResponse.json(
        { error: "Nu am putut încărca informațiile despre concurs." },
        { status: 500 }
      )
    }

    if (!latestPastContest) {
      return NextResponse.json({
        contest: null,
        status: "none",
        remaining_seconds: 0,
        server_time: nowIso
      })
    }

    const { status, remaining_seconds } = getContestStatus(latestPastContest, now)

    return NextResponse.json({
      contest: latestPastContest,
      status,
      remaining_seconds,
      server_time: nowIso
    })
  } catch (error) {
    console.error("Contest active route error:", error)
    return NextResponse.json(
      { error: "A apărut o eroare internă." },
      { status: 500 }
    )
  }
}

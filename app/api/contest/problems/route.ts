import { NextRequest, NextResponse } from "next/server"

import { isJwtExpired } from "@/lib/auth-validate"
import { getContestStatus } from "@/lib/contest-utils"
import { createServerClientWithToken } from "@/lib/supabaseServer"

interface ContestProblemRow {
  problem_id: string
  display_order: number
  statement: string
  image_url: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  saved_answer: string | null
  saved_submitted_at: string | null
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i)

    if (!tokenMatch) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat pentru a accesa concursul.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const accessToken = tokenMatch[1]

    if (isJwtExpired(accessToken)) {
      return NextResponse.json(
        { error: "Sesiune expirată. Te rugăm să te autentifici din nou.", code: "SESSION_EXPIRED" },
        { status: 401 }
      )
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat pentru a accesa concursul.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const user = userData.user
    const now = new Date()
    const nowIso = now.toISOString()

    const { data: registration, error: registrationError } = await supabase
      .from("contest_registrations")
      .select("grade, contest_code")
      .eq("user_id", user.id)
      .maybeSingle()

    if (registrationError) {
      console.error("Contest registration lookup error:", registrationError)
      return NextResponse.json(
        { error: "Nu am putut verifica înscrierea la concurs." },
        { status: 500 }
      )
    }

    if (!registration) {
      return NextResponse.json(
        { error: "Nu ești înscris la concurs.", code: "NOT_REGISTERED" },
        { status: 403 }
      )
    }

    const { data: recentContests, error: contestsError } = await supabase
      .from("contests")
      .select("id, name, start_time, duration_minutes, created_at")
      .lte("start_time", nowIso)
      .gt("start_time", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_time", { ascending: false })
      .limit(20)

    if (contestsError) {
      console.error("Contest active selection error:", contestsError)
      return NextResponse.json(
        { error: "Nu am putut încărca concursul activ." },
        { status: 500 }
      )
    }

    const activeContest =
      recentContests?.find((contest) => getContestStatus(contest, now).status === "active") ?? null

    if (!activeContest) {
      const { data: upcomingContest } = await supabase
        .from("contests")
        .select("id, name, start_time, duration_minutes, created_at")
        .gt("start_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (upcomingContest) {
        const { status, remaining_seconds } = getContestStatus(upcomingContest, now)

        return NextResponse.json(
          {
            error: "Concursul nu a început încă.",
            code: "CONTEST_NOT_ACTIVE",
            contest: upcomingContest,
            contest_status: status,
            remaining_seconds,
            server_time: nowIso
          },
          { status: 409 }
        )
      }

      const { data: latestPastContest } = await supabase
        .from("contests")
        .select("id, name, start_time, duration_minutes, created_at")
        .lte("start_time", nowIso)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestPastContest) {
        const { status, remaining_seconds } = getContestStatus(latestPastContest, now)

        return NextResponse.json(
          {
            error: "Concursul s-a încheiat.",
            code: "CONTEST_NOT_ACTIVE",
            contest: latestPastContest,
            contest_status: status,
            remaining_seconds,
            server_time: nowIso
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: "Nu există niciun concurs configurat.",
          code: "NO_CONTEST",
          contest: null,
          contest_status: "none",
          remaining_seconds: 0,
          server_time: nowIso
        },
        { status: 404 }
      )
    }

    const { data: rows, error: rpcError } = await supabase.rpc("get_contest_problems_for_user", {
      p_contest_id: activeContest.id
    })

    if (rpcError) {
      console.error("Contest problems rpc error:", rpcError)
      return NextResponse.json(
        { error: "Nu am putut încărca problemele de concurs." },
        { status: 500 }
      )
    }

    const typedRows = (rows ?? []) as ContestProblemRow[]

    const problems = typedRows.map((row) => ({
      id: row.problem_id as string,
      display_order: row.display_order as number,
      statement: row.statement as string,
      image_url: (row.image_url as string | null) ?? null,
      option_a: row.option_a as string,
      option_b: row.option_b as string,
      option_c: row.option_c as string,
      option_d: row.option_d as string
    }))

    const submissions = typedRows
      .filter((row) => row.saved_answer)
      .map((row) => ({
        problem_id: row.problem_id as string,
        answer: row.saved_answer as string,
        submitted_at: row.saved_submitted_at as string
      }))

    const { remaining_seconds } = getContestStatus(activeContest, now)

    return NextResponse.json({
      contest: activeContest,
      grade: registration.grade,
      contest_code: registration.contest_code,
      problems,
      submissions,
      remaining_seconds,
      server_time: nowIso
    })
  } catch (error) {
    console.error("Contest problems route error:", error)
    return NextResponse.json(
      { error: "A apărut o eroare internă." },
      { status: 500 }
    )
  }
}

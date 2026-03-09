import { NextRequest, NextResponse } from "next/server"

import { isJwtExpired } from "@/lib/auth-validate"
import { isContestAnswer } from "@/lib/contest-utils"
import { createServerClientWithToken } from "@/lib/supabaseServer"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i)

    if (!tokenMatch) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat pentru a trimite răspunsuri.", code: "UNAUTHORIZED" },
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

    const body = await request.json()
    const contestId = typeof body?.contest_id === "string" ? body.contest_id : ""
    const problemId = typeof body?.problem_id === "string" ? body.problem_id : ""
    const answerValue = typeof body?.answer === "string" ? body.answer.toUpperCase() : ""

    if (!contestId || !problemId || !answerValue) {
      return NextResponse.json(
        { error: "Contestul, problema și răspunsul sunt obligatorii.", code: "INVALID_PAYLOAD" },
        { status: 400 }
      )
    }

    if (!isContestAnswer(answerValue)) {
      return NextResponse.json(
        { error: "Răspuns invalid. Alege A, B, C sau D.", code: "INVALID_ANSWER" },
        { status: 400 }
      )
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat pentru a trimite răspunsuri.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase.rpc("submit_contest_answer", {
      p_contest_id: contestId,
      p_problem_id: problemId,
      p_answer: answerValue
    })

    if (error) {
      const message = error.message || "Nu am putut salva răspunsul."
      const normalized = message.toLowerCase()

      if (normalized.includes("nu esti inscris")) {
        return NextResponse.json(
          { error: "Nu ești înscris la concurs.", code: "NOT_REGISTERED" },
          { status: 403 }
        )
      }

      if (normalized.includes("concursul nu este activ")) {
        return NextResponse.json(
          { error: "Concursul nu este activ.", code: "CONTEST_NOT_ACTIVE" },
          { status: 409 }
        )
      }

      if (normalized.includes("problema nu apartine")) {
        return NextResponse.json(
          { error: "Problema selectată nu este validă pentru clasa sau concursul tău.", code: "INVALID_PROBLEM" },
          { status: 400 }
        )
      }

      if (normalized.includes("raspuns invalid")) {
        return NextResponse.json(
          { error: "Răspuns invalid. Alege A, B, C sau D.", code: "INVALID_ANSWER" },
          { status: 400 }
        )
      }

      console.error("Contest submit rpc error:", error)
      return NextResponse.json(
        { error: "Nu am putut salva răspunsul." },
        { status: 500 }
      )
    }

    const submission = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      answer: submission?.answer ?? answerValue,
      submitted_at: submission?.submitted_at ?? new Date().toISOString()
    })
  } catch (error) {
    console.error("Contest submit route error:", error)
    return NextResponse.json(
      { error: "A apărut o eroare internă." },
      { status: 500 }
    )
  }
}

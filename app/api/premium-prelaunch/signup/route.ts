import { NextRequest, NextResponse } from "next/server"

import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const tokenMatch = authHeader.match(/^Bearer (.+)$/i)

    if (!tokenMatch) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat.", code: "UNAUTHORIZED" },
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
        { error: "Trebuie să fii autentificat.", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const user = userData.user

    const { error: insertError } = await supabase.from("premium_prelaunch_signups").insert({
      user_id: user.id,
      source: "contest_end_card"
    })

    if (insertError) {
      const code = insertError.code
      const msg = (insertError.message || "").toLowerCase()
      if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
        return NextResponse.json({ ok: true, alreadyRegistered: true })
      }

      console.error("premium_prelaunch_signups insert error:", insertError)
      return NextResponse.json(
        { error: "Nu am putut salva înscrierea. Încearcă din nou.", code: "INSERT_FAILED" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, alreadyRegistered: false })
  } catch (error) {
    console.error("premium-prelaunch signup route error:", error)
    return NextResponse.json(
      { error: "A apărut o eroare neașteptată.", code: "INTERNAL" },
      { status: 500 }
    )
  }
}

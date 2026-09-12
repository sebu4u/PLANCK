import { NextRequest, NextResponse } from "next/server"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { isPlanckWeekGradeOption } from "@/lib/planck-week"
import { claimPlanckWeekForUser } from "@/lib/planck-week-claim"
import { planckWeekConversionContext } from "@/lib/planck-week-conversion-events"
import { logger } from "@/lib/logger"
import { isWorkshopSubject } from "@/lib/pregatire/types"
import { createServerClientWithToken } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(token)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(token)
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as {
      grade?: unknown
      subjects?: unknown
      name?: unknown
    } | null
    const rawGrade = body?.grade
    const schoolGrade = isPlanckWeekGradeOption(rawGrade) ? rawGrade : null
    const subjects = Array.isArray(body?.subjects)
      ? body.subjects.filter((value): value is string => typeof value === "string")
      : undefined
    const name = typeof body?.name === "string" ? body.name : undefined

    const result = await claimPlanckWeekForUser({
      userId: data.user.id,
      email: data.user.email,
      schoolGrade,
      sendSummaryEmail: false,
      subjects: subjects?.filter(isWorkshopSubject),
      name,
      conversion: planckWeekConversionContext({
        getHeader: (name) => req.headers.get(name),
        getCookie: (name) => req.cookies.get(name)?.value,
      }),
    })

    return NextResponse.json({
      ok: result.ok,
      claimed: result.claimed,
      unlockedCount: result.unlockedCount,
      redirectPath: result.redirectPath,
      conversionEventId: result.conversionEventId,
    })
  } catch (err) {
    logger.error("[planck-week/claim] error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

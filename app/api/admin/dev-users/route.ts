import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { isJwtExpired } from "@/lib/auth-validate"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import {
  DEV_SUBJECT_LABELS,
  isSuperDev,
  normalizeDevSubjects,
  parseDevSubjectsInput,
  type DevSubjectKey,
} from "@/lib/dev-subjects"
import { logger } from "@/lib/logger"

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, key)
}

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }

  const supabaseUser = createServerClientWithToken(accessToken)
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(supabaseUser, user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }

  return { userId: user.id }
}

type DevProfileRow = {
  user_id: string
  name: string | null
  nickname: string | null
  is_dev: boolean
  is_admin: boolean
  dev_subjects: unknown
}

async function listAuthUsersById(
  service: ReturnType<typeof createServiceClient>,
  userIds: string[]
) {
  const usersById = new Map<string, { email?: string }>()

  for (const userId of userIds) {
    try {
      const { data, error } = await service.auth.admin.getUserById(userId)
      if (!error && data.user) {
        usersById.set(userId, { email: data.user.email ?? undefined })
      }
    } catch {
      // Skip users that can't be fetched
    }
  }

  return usersById
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const service = createServiceClient()
    const { data: profiles, error } = await service
      .from("profiles")
      .select("user_id, name, nickname, is_dev, is_admin, dev_subjects")
      .eq("is_dev", true)
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("[admin/dev-users] profiles:", error)
      return NextResponse.json({ error: "Nu am putut încărca utilizatorii dev." }, { status: 500 })
    }

    const profileRows = (profiles ?? []) as DevProfileRow[]
    const usersById = await listAuthUsersById(
      service,
      profileRows.map((p) => p.user_id)
    )
    const devUsers = profileRows.map((profile) => {
      const devSubjects = normalizeDevSubjects(profile.dev_subjects)
      return {
        user_id: profile.user_id,
        email: usersById.get(profile.user_id)?.email ?? null,
        name: profile.name,
        nickname: profile.nickname,
        is_dev: profile.is_dev === true,
        is_admin: profile.is_admin === true,
        dev_subjects: devSubjects,
        is_super_dev: isSuperDev(profile.is_dev === true, devSubjects),
        subjects_label:
          profile.is_dev === true && isSuperDev(profile.is_dev === true, devSubjects)
            ? "Toate"
            : (devSubjects ?? []).map((subject) => DEV_SUBJECT_LABELS[subject]).join(", "),
      }
    })

    return NextResponse.json({ devUsers })
  } catch (error) {
    logger.error("[admin/dev-users] GET:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const userId = typeof body?.user_id === "string" ? body.user_id.trim() : ""
    if (!userId) {
      return NextResponse.json({ error: "user_id este obligatoriu." }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    if (body?.is_dev !== undefined) {
      if (typeof body.is_dev !== "boolean") {
        return NextResponse.json({ error: "is_dev trebuie să fie boolean." }, { status: 400 })
      }
      update.is_dev = body.is_dev
    }

    if (body?.dev_subjects !== undefined) {
      const subjects = parseDevSubjectsInput(body.dev_subjects)
      if (body.dev_subjects !== null && subjects === null) {
        return NextResponse.json({ error: "dev_subjects conține materii invalide." }, { status: 400 })
      }
      update.dev_subjects = subjects && subjects.length > 0 ? subjects : null
    }

    if (update.is_dev === false) {
      update.dev_subjects = null
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nu există modificări de salvat." }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from("profiles")
      .update(update)
      .eq("user_id", userId)
      .select("user_id, name, nickname, is_dev, is_admin, dev_subjects")
      .single()

    if (error) {
      logger.error("[admin/dev-users] PATCH:", error)
      return NextResponse.json({ error: error.message || "Nu am putut actualiza utilizatorul dev." }, { status: 500 })
    }

    const devSubjects = normalizeDevSubjects((data as DevProfileRow).dev_subjects)
    return NextResponse.json({
      success: true,
      devUser: {
        ...data,
        dev_subjects: devSubjects,
        is_super_dev: isSuperDev((data as DevProfileRow).is_dev === true, devSubjects),
      },
    })
  } catch (error) {
    logger.error("[admin/dev-users] PATCH:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

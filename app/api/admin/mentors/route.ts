import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const emailSchema = z.string().trim().email().max(320)
const userIdSchema = z.string().uuid()
const teacherIdSchema = z.string().uuid()

const patchSchema = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().trim().email().max(320).optional(),
  teacher_id: z.string().uuid().nullable(),
})

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

async function findAuthUserByEmail(email: string) {
  const service = getServiceRoleSupabase()
  const normalized = email.trim().toLowerCase()
  let page = 1
  while (page <= 20) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === normalized)
    if (match) return match
    if (data.users.length < 1000) return null
    page += 1
  }
  return null
}

async function emailsByUserId(userIds: string[]) {
  const service = getServiceRoleSupabase()
  const emails = new Map<string, string | null>()
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data } = await service.auth.admin.getUserById(userId)
        emails.set(userId, data.user?.email ?? null)
      } catch {
        emails.set(userId, null)
      }
    }),
  )
  return emails
}

async function profileName(userId: string) {
  const service = getServiceRoleSupabase()
  const { data } = await service
    .from("profiles")
    .select("user_id, name, nickname, is_mentor")
    .eq("user_id", userId)
    .maybeSingle()
  return data
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const emailParam = new URL(req.url).searchParams.get("email")?.trim() ?? ""
    const service = getServiceRoleSupabase()

    if (emailParam) {
      const parsedEmail = emailSchema.safeParse(emailParam)
      if (!parsedEmail.success) {
        return NextResponse.json({ error: "Email-ul este invalid." }, { status: 400 })
      }
      const authUser = await findAuthUserByEmail(parsedEmail.data)
      if (!authUser) {
        return NextResponse.json({ error: "Nu există un cont cu acest email." }, { status: 404 })
      }
      const profile = await profileName(authUser.id)
      const { data: teacher } = await service
        .from("workshop_teachers")
        .select("id, name")
        .eq("mentor_user_id", authUser.id)
        .maybeSingle()

      return NextResponse.json({
        user: {
          user_id: authUser.id,
          email: authUser.email ?? null,
          name: profile?.name ?? null,
          nickname: profile?.nickname ?? null,
          is_mentor: profile?.is_mentor === true,
          teacher_id: teacher?.id ?? null,
          teacher_name: teacher?.name ?? null,
        },
      })
    }

    const { data: teachers, error: teachersError } = await service
      .from("workshop_teachers")
      .select("id, name, is_active, mentor_user_id")
      .order("name", { ascending: true })

    if (teachersError) {
      logger.error("[admin/mentors] teachers:", teachersError)
      return NextResponse.json({ error: "Nu am putut încărca profesorii." }, { status: 500 })
    }

    const assigned = (teachers ?? []).filter((row) => row.mentor_user_id)
    const userIds = [...new Set(assigned.map((row) => row.mentor_user_id as string))]
    const emails = await emailsByUserId(userIds)

    let profiles: Array<{ user_id: string; name: string | null; nickname: string | null }> = []
    if (userIds.length > 0) {
      const { data: profileRows, error: profilesError } = await service
        .from("profiles")
        .select("user_id, name, nickname")
        .in("user_id", userIds)
      if (profilesError) {
        logger.error("[admin/mentors] profiles:", profilesError)
        return NextResponse.json({ error: "Nu am putut încărca mentorii." }, { status: 500 })
      }
      profiles = profileRows ?? []
    }

    const profileById = new Map(profiles.map((row) => [row.user_id, row]))
    const mentors = assigned.map((teacher) => {
      const userId = teacher.mentor_user_id as string
      const profile = profileById.get(userId)
      return {
        user_id: userId,
        email: emails.get(userId) ?? null,
        name: profile?.name ?? null,
        nickname: profile?.nickname ?? null,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
      }
    })

    return NextResponse.json({
      mentors,
      teachers: (teachers ?? []).map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        is_active: teacher.is_active,
        mentor_user_id: teacher.mentor_user_id,
      })),
    })
  } catch (error) {
    logger.error("[admin/mentors] GET:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Date invalide." },
        { status: 400 },
      )
    }

    let userId = parsed.data.user_id
    if (!userId && parsed.data.email) {
      const authUser = await findAuthUserByEmail(parsed.data.email)
      if (!authUser) {
        return NextResponse.json({ error: "Nu există un cont cu acest email." }, { status: 404 })
      }
      userId = authUser.id
    }
    if (!userId) {
      return NextResponse.json({ error: "user_id sau email este obligatoriu." }, { status: 400 })
    }
    const parsedUserId = userIdSchema.safeParse(userId)
    if (!parsedUserId.success) {
      return NextResponse.json({ error: "user_id este invalid." }, { status: 400 })
    }
    userId = parsedUserId.data

    const service = getServiceRoleSupabase()
    const { data: profile } = await service
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: "Profilul utilizatorului nu există." }, { status: 404 })
    }

    const teacherId = parsed.data.teacher_id
    if (teacherId) {
      const parsedTeacherId = teacherIdSchema.safeParse(teacherId)
      if (!parsedTeacherId.success) {
        return NextResponse.json({ error: "teacher_id este invalid." }, { status: 400 })
      }

      const { data: teacher } = await service
        .from("workshop_teachers")
        .select("id, mentor_user_id")
        .eq("id", parsedTeacherId.data)
        .maybeSingle()
      if (!teacher) {
        return NextResponse.json({ error: "Profesorul nu a fost găsit." }, { status: 404 })
      }

      const previousOwnerId =
        typeof teacher.mentor_user_id === "string" && teacher.mentor_user_id !== userId
          ? teacher.mentor_user_id
          : null

      const { data: previousTeacher } = await service
        .from("workshop_teachers")
        .select("id")
        .eq("mentor_user_id", userId)
        .maybeSingle()

      if (previousTeacher && previousTeacher.id !== teacher.id) {
        const { error: clearPrevError } = await service
          .from("workshop_teachers")
          .update({ mentor_user_id: null, updated_at: new Date().toISOString() })
          .eq("id", previousTeacher.id)
        if (clearPrevError) {
          logger.error("[admin/mentors] clear previous teacher:", clearPrevError)
          return NextResponse.json({ error: "Nu am putut actualiza atribuirea." }, { status: 500 })
        }
      }

      const { error: assignError } = await service
        .from("workshop_teachers")
        .update({ mentor_user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", teacher.id)
      if (assignError) {
        logger.error("[admin/mentors] assign teacher:", assignError)
        return NextResponse.json({ error: "Nu am putut atribui mentorul." }, { status: 500 })
      }

      const { error: flagError } = await service
        .from("profiles")
        .update({ is_mentor: true })
        .eq("user_id", userId)
      if (flagError) {
        logger.error("[admin/mentors] set is_mentor:", flagError)
        return NextResponse.json({ error: "Nu am putut activa rolul de mentor." }, { status: 500 })
      }

      if (previousOwnerId) {
        const { data: stillAssigned } = await service
          .from("workshop_teachers")
          .select("id")
          .eq("mentor_user_id", previousOwnerId)
          .maybeSingle()
        if (!stillAssigned) {
          await service.from("profiles").update({ is_mentor: false }).eq("user_id", previousOwnerId)
        }
      }

      return NextResponse.json({ success: true, user_id: userId, teacher_id: teacher.id })
    }

    const { data: linkedTeachers, error: linkedError } = await service
      .from("workshop_teachers")
      .select("id")
      .eq("mentor_user_id", userId)
    if (linkedError) {
      logger.error("[admin/mentors] list linked:", linkedError)
      return NextResponse.json({ error: "Nu am putut scoate atribuirea." }, { status: 500 })
    }

    if ((linkedTeachers ?? []).length > 0) {
      const { error: clearError } = await service
        .from("workshop_teachers")
        .update({ mentor_user_id: null, updated_at: new Date().toISOString() })
        .eq("mentor_user_id", userId)
      if (clearError) {
        logger.error("[admin/mentors] unassign teacher:", clearError)
        return NextResponse.json({ error: "Nu am putut scoate atribuirea." }, { status: 500 })
      }
    }

    const { error: clearFlagError } = await service
      .from("profiles")
      .update({ is_mentor: false })
      .eq("user_id", userId)
    if (clearFlagError) {
      logger.error("[admin/mentors] clear is_mentor:", clearFlagError)
      return NextResponse.json({ error: "Nu am putut dezactiva rolul de mentor." }, { status: 500 })
    }

    return NextResponse.json({ success: true, user_id: userId, teacher_id: null })
  } catch (error) {
    logger.error("[admin/mentors] PATCH:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

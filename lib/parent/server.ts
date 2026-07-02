import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { estimateGradeFromElo } from "@/lib/parent/grade-estimate"
import { generateParentInviteCode, normalizeParentInviteCode } from "@/lib/parent/invite-code"
import type { UserType } from "@/lib/user-types"

export interface ParentChildSummary {
  relationship_id: string
  child_id: string
  name: string
  grade: string | null
  preferred_materie: string | null
  target_grade: number
  status: "pending" | "active"
  accepted_at: string | null
}

export interface ChildProgressSnapshot {
  child_id: string
  name: string
  grade: string | null
  preferred_materie: string | null
  target_grade: number
  estimated_grade: number
  stats: {
    elo: number
    rank: string
    current_streak: number
    best_streak: number
    total_time_minutes: number
    problems_solved_total: number
    problems_solved_today: number
    last_activity_date: string | null
  }
  activity_last_30_days: Array<{
    activity_date: string
    problems_solved: number
    time_minutes: number
  }>
  recent_work: Array<{
    type: "problem" | "lesson" | "grila"
    title: string
    at: string
    success: boolean | null
  }>
}

const MINUTES_PER_ITEM = 2

interface ActivityEvent {
  type: ChildProgressSnapshot["recent_work"][number]["type"]
  title: string
  at: string
  success: boolean | null
  estimatedMinutes: number
}

interface UserActivitySummary {
  lastActivityAt: string | null
  totalTimeMinutes: number
  recentWork: ChildProgressSnapshot["recent_work"]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function parseTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : value
}

function maxTimestamp(current: string | null, candidate: unknown): string | null {
  const parsed = parseTimestamp(candidate)
  if (!parsed) return current
  if (!current) return parsed
  return new Date(parsed).getTime() > new Date(current).getTime() ? parsed : current
}

function invataItemLabel(itemType: string): string {
  switch (itemType) {
    case "text":
    case "theory":
      return "Lecție /invata"
    case "video":
      return "Video /invata"
    case "grila":
      return "Grilă /invata"
    case "problem":
      return "Problemă /invata"
    case "test":
      return "Test /invata"
    case "poll":
      return "Sondaj /invata"
    case "fill_slot":
      return "Completare /invata"
    default:
      return "Activitate /invata"
  }
}

export async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function ensureParentInviteCode(userId: string): Promise<string> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("user_type, parent_invite_code")
    .eq("user_id", userId)
    .maybeSingle()

  if (!profile || profile.user_type !== "parinte") {
    throw new Error("NOT_PARENT")
  }

  if (profile.parent_invite_code) {
    return profile.parent_invite_code
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateParentInviteCode()
    const { error } = await admin
      .from("profiles")
      .update({ parent_invite_code: candidate })
      .eq("user_id", userId)
      .is("parent_invite_code", null)

    if (!error) {
      const { data: updated } = await admin
        .from("profiles")
        .select("parent_invite_code")
        .eq("user_id", userId)
        .maybeSingle()
      if (updated?.parent_invite_code) {
        return updated.parent_invite_code
      }
    }
  }

  throw new Error("INVITE_CODE_GENERATION_FAILED")
}

export async function getParentChildren(parentId: string): Promise<ParentChildSummary[]> {
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from("parent_child_relationships")
    .select("id, child_id, status, accepted_at, target_grade")
    .eq("parent_id", parentId)
    .eq("status", "active")
    .order("accepted_at", { ascending: false })

  const relationships = (rows ?? []).filter(isObject)
  const childIds = relationships.map((row) => asString(row.child_id)).filter(Boolean)
  if (childIds.length === 0) return []

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, name, nickname, grade, preferred_materie")
    .in("user_id", childIds)

  const profileById = new Map<string, Record<string, unknown>>()
  for (const profile of profiles ?? []) {
    if (!isObject(profile)) continue
    profileById.set(asString(profile.user_id), profile)
  }

  return relationships.map((row) => {
    const childId = asString(row.child_id)
    const profile = profileById.get(childId)
    const name =
      asString(profile?.nickname) ||
      asString(profile?.name) ||
      "Elev"

    const rawTargetGrade = row.target_grade
    const targetGrade =
      typeof rawTargetGrade === "number" && Number.isFinite(rawTargetGrade)
        ? rawTargetGrade
        : typeof rawTargetGrade === "string" && Number.isFinite(Number(rawTargetGrade))
          ? Number(rawTargetGrade)
          : 9

    return {
      relationship_id: asString(row.id),
      child_id: childId,
      name,
      grade: asNullableString(profile?.grade),
      preferred_materie: asNullableString(profile?.preferred_materie),
      target_grade: targetGrade,
      status: asString(row.status) === "pending" ? "pending" : "active",
      accepted_at: asNullableString(row.accepted_at),
    }
  })
}

export async function getChildrenProgressForParent(parentId: string): Promise<ChildProgressSnapshot[]> {
  const children = await getParentChildren(parentId)
  if (children.length === 0) return []

  const admin = createAdminClient()
  const childIds = children.map((child) => child.child_id)
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString().slice(0, 10)

  const [
    { data: statsRows },
    { data: activityRows },
    { data: allDailyActivityRows },
    { data: solvedRows },
    { data: invataRows },
    { data: cursuriRows },
    { data: grilaRows },
  ] = await Promise.all([
    admin.from("user_stats").select("*").in("user_id", childIds),
    admin
      .from("daily_activity")
      .select("user_id, activity_date, problems_solved, time_minutes")
      .in("user_id", childIds)
      .gte("activity_date", sinceIso)
      .order("activity_date", { ascending: true }),
    admin
      .from("daily_activity")
      .select("user_id, time_minutes, problems_solved")
      .in("user_id", childIds),
    admin
      .from("solved_problems")
      .select("user_id, problem_id, solved_at, problems(title)")
      .in("user_id", childIds)
      .order("solved_at", { ascending: false })
      .limit(200),
    admin
      .from("user_learning_path_item_progress")
      .select(
        "user_id, item_id, completed_at, learning_path_lesson_items(title, item_type)",
      )
      .in("user_id", childIds)
      .order("completed_at", { ascending: false })
      .limit(200),
    admin
      .from("user_lesson_progress")
      .select("user_id, lesson_id, completed_at, lessons(title, estimated_duration)")
      .in("user_id", childIds)
      .order("completed_at", { ascending: false })
      .limit(200),
    admin
      .from("user_solved_questions")
      .select("user_id, question_id, solved_at")
      .in("user_id", childIds)
      .order("solved_at", { ascending: false })
      .limit(200),
  ])

  const statsByUser = new Map<string, Record<string, unknown>>()
  for (const row of statsRows ?? []) {
    if (!isObject(row)) continue
    statsByUser.set(asString(row.user_id), row)
  }

  const activityByUser = new Map<string, ChildProgressSnapshot["activity_last_30_days"]>()
  for (const row of activityRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    const bucket = activityByUser.get(userId) ?? []
    bucket.push({
      activity_date: asString(row.activity_date),
      problems_solved: asNumber(row.problems_solved),
      time_minutes: asNumber(row.time_minutes),
    })
    activityByUser.set(userId, bucket)
  }

  const dailyTimeByUser = new Map<string, number>()
  for (const row of allDailyActivityRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    const storedMinutes = asNumber(row.time_minutes)
    const fallbackMinutes = asNumber(row.problems_solved) * MINUTES_PER_ITEM
    dailyTimeByUser.set(
      userId,
      (dailyTimeByUser.get(userId) ?? 0) + (storedMinutes > 0 ? storedMinutes : fallbackMinutes),
    )
  }

  const eventsByUser = new Map<string, ActivityEvent[]>()
  const eventMinutesByUser = new Map<string, number>()

  for (const userId of childIds) {
    eventsByUser.set(userId, [])
  }

  const appendEvent = (userId: string, event: ActivityEvent) => {
    const bucket = eventsByUser.get(userId)
    if (!bucket) return
    bucket.push(event)
    eventMinutesByUser.set(
      userId,
      (eventMinutesByUser.get(userId) ?? 0) + event.estimatedMinutes,
    )
  }

  for (const row of solvedRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    const at = parseTimestamp(row.solved_at)
    if (!at) continue

    const problems = isObject(row.problems) ? row.problems : null
    appendEvent(userId, {
      type: "problem",
      title: asString(problems?.title, "Problemă"),
      at,
      success: true,
      estimatedMinutes: MINUTES_PER_ITEM,
    })
  }

  for (const row of invataRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    const at = parseTimestamp(row.completed_at)
    if (!at) continue

    const item = isObject(row.learning_path_lesson_items)
      ? row.learning_path_lesson_items
      : null
    const itemType = asString(item?.item_type)
    const title = asString(item?.title) || invataItemLabel(itemType)

    appendEvent(userId, {
      type: "lesson",
      title,
      at,
      success: true,
      estimatedMinutes: MINUTES_PER_ITEM,
    })
  }

  for (const row of cursuriRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    const at = parseTimestamp(row.completed_at)
    if (!at) continue

    const lesson = isObject(row.lessons) ? row.lessons : null
    appendEvent(userId, {
      type: "lesson",
      title: asString(lesson?.title, "Lecție /cursuri"),
      at,
      success: true,
      estimatedMinutes: MINUTES_PER_ITEM,
    })
  }

  for (const row of grilaRows ?? []) {
    if (!isObject(row)) continue
    const userId = asString(row.user_id)
    const at = parseTimestamp(row.solved_at)
    if (!at) continue

    appendEvent(userId, {
      type: "grila",
      title: "Grilă",
      at,
      success: true,
      estimatedMinutes: MINUTES_PER_ITEM,
    })
  }

  const activitySummaryByUser = new Map<string, UserActivitySummary>()

  for (const userId of childIds) {
    const events = eventsByUser.get(userId) ?? []
    let lastActivityAt: string | null = null
    for (const event of events) {
      lastActivityAt = maxTimestamp(lastActivityAt, event.at)
    }

    const recentWork = [...events]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8)
      .map(({ type, title, at, success }) => ({ type, title, at, success }))

    const eventMinutes = eventMinutesByUser.get(userId) ?? 0
    const dailyMinutes = dailyTimeByUser.get(userId) ?? 0

    activitySummaryByUser.set(userId, {
      lastActivityAt,
      totalTimeMinutes: Math.max(eventMinutes, dailyMinutes),
      recentWork,
    })
  }

  return children.map((child) => {
    const stats = statsByUser.get(child.child_id)
    const activitySummary = activitySummaryByUser.get(child.child_id)
    const elo = asNumber(stats?.elo, 500)

    const storedTotalTime = asNumber(stats?.total_time_minutes)
    const computedTotalTime = activitySummary?.totalTimeMinutes ?? 0
    const totalTimeMinutes = Math.max(storedTotalTime, computedTotalTime)

    const statsLastActivity = asNullableString(stats?.last_activity_date)
    const computedLastActivity = activitySummary?.lastActivityAt ?? null
    const lastActivityDate =
      computedLastActivity ??
      (statsLastActivity ? `${statsLastActivity}T12:00:00.000Z` : null)

    return {
      child_id: child.child_id,
      name: child.name,
      grade: child.grade,
      preferred_materie: child.preferred_materie,
      target_grade: child.target_grade,
      estimated_grade: estimateGradeFromElo(elo),
      stats: {
        elo,
        rank: asString(stats?.rank, "Bronze III"),
        current_streak: asNumber(stats?.current_streak),
        best_streak: asNumber(stats?.best_streak),
        total_time_minutes: totalTimeMinutes,
        problems_solved_total: asNumber(stats?.problems_solved_total),
        problems_solved_today: asNumber(stats?.problems_solved_today),
        last_activity_date: lastActivityDate,
      },
      activity_last_30_days: activityByUser.get(child.child_id) ?? [],
      recent_work: activitySummary?.recentWork ?? [],
    }
  })
}

export async function updateChildTargetGrade(params: {
  parentId: string
  childId: string
  targetGrade: number
}): Promise<number> {
  if (!Number.isFinite(params.targetGrade) || params.targetGrade < 4 || params.targetGrade > 10) {
    throw new Error("INVALID_TARGET_GRADE")
  }

  const admin = createAdminClient()

  const { data: relationship } = await admin
    .from("parent_child_relationships")
    .select("id")
    .eq("parent_id", params.parentId)
    .eq("child_id", params.childId)
    .eq("status", "active")
    .maybeSingle()

  if (!relationship?.id) {
    throw new Error("RELATIONSHIP_NOT_FOUND")
  }

  const normalizedGrade = Math.round(params.targetGrade * 10) / 10

  const { error } = await admin
    .from("parent_child_relationships")
    .update({ target_grade: normalizedGrade })
    .eq("id", relationship.id)

  if (error) {
    throw new Error("TARGET_GRADE_UPDATE_FAILED")
  }

  return normalizedGrade
}

export async function acceptParentInvite(params: {
  childUserId: string
  inviteCode: string
}): Promise<{ parent_name: string }> {
  const admin = createAdminClient()
  const normalizedCode = normalizeParentInviteCode(params.inviteCode)

  const { data: parentProfile } = await admin
    .from("profiles")
    .select("user_id, name, nickname, user_type, parent_invite_code")
    .eq("parent_invite_code", normalizedCode)
    .maybeSingle()

  if (!parentProfile?.user_id) {
    throw new Error("INVALID_INVITE_CODE")
  }

  if (parentProfile.user_id === params.childUserId) {
    throw new Error("SELF_LINK_NOT_ALLOWED")
  }

  const { data: childProfile } = await admin
    .from("profiles")
    .select("user_type")
    .eq("user_id", params.childUserId)
    .maybeSingle()

  const childType = (childProfile?.user_type ?? "elev") as UserType
  if (childType !== "elev") {
    throw new Error("ONLY_STUDENTS_CAN_LINK")
  }

  const { data: existing } = await admin
    .from("parent_child_relationships")
    .select("id, status")
    .eq("parent_id", parentProfile.user_id)
    .eq("child_id", params.childUserId)
    .maybeSingle()

  if (existing?.status === "active") {
    return {
      parent_name:
        parentProfile.nickname || parentProfile.name || "Părintele tău",
    }
  }

  const now = new Date().toISOString()
  if (existing?.id) {
    await admin
      .from("parent_child_relationships")
      .update({ status: "active", accepted_at: now })
      .eq("id", existing.id)
  } else {
    const { error } = await admin.from("parent_child_relationships").insert({
      parent_id: parentProfile.user_id,
      child_id: params.childUserId,
      status: "active",
      accepted_at: now,
    })
    if (error) {
      throw new Error("RELATIONSHIP_CREATE_FAILED")
    }
  }

  return {
    parent_name: parentProfile.nickname || parentProfile.name || "Părintele tău",
  }
}

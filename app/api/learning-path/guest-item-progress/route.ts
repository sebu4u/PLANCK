import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  parseGuestLearningPathProgress,
  type GuestLearningPathProgressMap,
} from "@/lib/guest-learning-path-cookie"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim())
}

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 90

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { lessonId, itemId } = body as { lessonId?: unknown; itemId?: unknown }
  if (!isUuid(lessonId) || !isUuid(itemId)) {
    return NextResponse.json({ error: "lessonId and itemId must be UUIDs" }, { status: 400 })
  }

  const cookieStore = await cookies()
  const prev = parseGuestLearningPathProgress(cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value)
  const next: GuestLearningPathProgressMap = { ...prev }
  const list = new Set(next[lessonId.trim()] ?? [])
  list.add(itemId.trim())
  next[lessonId.trim()] = Array.from(list)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(GUEST_LEARNING_PATH_PROGRESS_COOKIE, JSON.stringify(next), {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
  return response
}

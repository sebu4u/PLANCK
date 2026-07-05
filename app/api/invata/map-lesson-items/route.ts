import { NextRequest, NextResponse } from "next/server"
import { fetchMapLessonItems, type MapLessonItemsSubject } from "@/lib/map-lesson-items"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

function isMapLessonItemsSubject(value: string | null): value is MapLessonItemsSubject {
  return value === "fizica" || value === "mate" || value === "info"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const mapLessonId = searchParams.get("mapLessonId")?.trim() || null
    const routeSlug = searchParams.get("traseu")?.trim() || null
    const chapterSlug = searchParams.get("capitol")?.trim() || null

    if (!isMapLessonItemsSubject(subject) || !mapLessonId || !routeSlug || !chapterSlug) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const cookieStore = await cookies()
    const guestProgressMap = user
      ? undefined
      : parseGuestLearningPathProgress(
          cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value,
        )

    const result = await fetchMapLessonItems({
      subject,
      mapLessonId,
      routeSlug,
      chapterSlug,
      userId: user?.id ?? null,
      progressClient: user ? supabase : null,
      guestProgressMap,
    })

    if (!result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    console.error("[invata/map-lesson-items] load failed:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

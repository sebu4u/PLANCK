import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireDevSession } from "@/lib/dev-api-session"
import { assertDevCanAccessApiSubject } from "@/lib/admin-check"
import { isSuperDev, type ApiDevSubject } from "@/lib/dev-subjects"
import { chapterVisibleForDev } from "@/lib/dev-chapter-access"
import { logger } from "@/lib/logger"
import {
  buildChapterCoverPath,
  buildLessonCoverPath,
  deleteLearningPathImage,
  isOfficialPath,
  learningPathImageDeleteSchema,
  learningPathImageUploadSchema,
  readAndValidateLearningPathImage,
  uploadLearningPathImage,
} from "@/lib/learning-path-image-upload"

export const runtime = "nodejs"
export const maxDuration = 60

const SUBJECT_ERROR =
  "subject trebuie să fie all, physics, informatics, math, biology sau ai."

function parseBodySubject(raw: unknown): ApiDevSubject | null {
  if (raw === undefined || raw === null) return "all"
  if (typeof raw !== "string") return null
  if (raw.trim() === "") return "all"
  const s = raw.trim()
  if (
    s === "physics" ||
    s === "informatics" ||
    s === "math" ||
    s === "biology" ||
    s === "ai" ||
    s === "all"
  ) {
    return s
  }
  return null
}

function resolveDevAccessSubject(
  subject: ApiDevSubject,
  isAdmin: boolean,
  isDev: boolean,
  devSubjects: readonly string[] | null,
): ApiDevSubject {
  if (isAdmin || isSuperDev(isDev, devSubjects as any)) {
    return subject
  }
  return "all"
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, serviceRoleKey)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fișierul este obligatoriu." }, { status: 400 })
    }

    const subject = parseBodySubject(form.get("subject"))
    if (subject === null) {
      return NextResponse.json({ error: `subject în form ${SUBJECT_ERROR}` }, { status: 400 })
    }
    const accessSubject = resolveDevAccessSubject(
      subject,
      auth.permissions.isAdmin,
      auth.permissions.isDev,
      auth.permissions.devSubjects,
    )
    if (accessSubject !== "all" && !assertDevCanAccessApiSubject(auth.permissions, accessSubject)) {
      return NextResponse.json({ error: "Nu ai acces dev la materia cerută." }, { status: 403 })
    }

    const parsed = learningPathImageUploadSchema.safeParse({
      kind: form.get("kind"),
      id: form.get("id"),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "kind și id sunt obligatorii și trebuie să fie valide." }, { status: 400 })
    }
    const { kind, id } = parsed.data

    const supabase = createServiceClient()

    if (kind === "chapter") {
      const { data: chapter, error: chErr } = await supabase
        .from("learning_path_chapters")
        .select("id, problem_category, allowed_dev_user_ids")
        .eq("id", id)
        .maybeSingle()
      if (chErr || !chapter) {
        return NextResponse.json({ error: "Capitolul nu există." }, { status: 404 })
      }
      if (
        !chapterVisibleForDev(
          chapter,
          accessSubject,
          auth.permissions,
          auth.userId,
        )
      ) {
        return NextResponse.json({ error: "Capitolul nu este în domeniul tău dev." }, { status: 403 })
      }
    } else {
      const { data: lesson, error: lErr } = await supabase
        .from("learning_path_lessons")
        .select("id, chapter_id")
        .eq("id", id)
        .maybeSingle()
      if (lErr || !lesson) {
        return NextResponse.json({ error: "Lecția nu există." }, { status: 404 })
      }
      const { data: chapter, error: chErr } = await supabase
        .from("learning_path_chapters")
        .select("id, problem_category, allowed_dev_user_ids")
        .eq("id", lesson.chapter_id)
        .maybeSingle()
      if (chErr || !chapter) {
        return NextResponse.json({ error: "Capitolul lecției nu există." }, { status: 404 })
      }
      if (
        !chapterVisibleForDev(
          chapter,
          accessSubject,
          auth.permissions,
          auth.userId,
        )
      ) {
        return NextResponse.json({ error: "Lecția nu este în domeniul tău dev." }, { status: 403 })
      }
    }

    let validated
    try {
      validated = await readAndValidateLearningPathImage(file)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fișier invalid."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const path =
      kind === "chapter"
        ? buildChapterCoverPath(id, validated.extension)
        : await buildLessonCoverPath(id, validated.extension)

    const publicUrl = await uploadLearningPathImage(path, validated.bytes, validated.contentType)

    return NextResponse.json({ success: true, url: publicUrl, path })
  } catch (err: unknown) {
    logger.error("[dev/learning-paths/upload] POST:", err)
    return NextResponse.json({ error: "Eroare internă la upload." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    const parsed = learningPathImageDeleteSchema.safeParse({
      path: body.path ?? new URL(req.url).searchParams.get("path"),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "path este obligatoriu." }, { status: 400 })
    }
    const { path } = parsed.data
    if (!isOfficialPath(path)) {
      return NextResponse.json(
        { error: "Se pot șterge doar fișiere din prefixul official/." },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()
    const segments = path.split("/").filter(Boolean)
    const isLessonPath = segments.length >= 4 && segments[2] === "lessons"
    if (isLessonPath) {
      const lessonId = segments[3]
      const { data: lesson } = await supabase
        .from("learning_path_lessons")
        .select("id, chapter_id")
        .eq("id", lessonId)
        .maybeSingle()
      if (lesson) {
        const { data: chapter } = await supabase
          .from("learning_path_chapters")
          .select("id, problem_category, allowed_dev_user_ids")
          .eq("id", lesson.chapter_id)
          .maybeSingle()
        if (chapter) {
          const accessSubject = resolveDevAccessSubject(
            "all",
            auth.permissions.isAdmin,
            auth.permissions.isDev,
            auth.permissions.devSubjects,
          )
          if (
            !chapterVisibleForDev(
              chapter,
              accessSubject,
              auth.permissions,
              auth.userId,
            )
          ) {
            return NextResponse.json(
              { error: "Lecția nu este în domeniul tău dev." },
              { status: 403 },
            )
          }
        }
      }
    } else {
      const chapterId = segments[1]
      const { data: chapter } = await supabase
        .from("learning_path_chapters")
        .select("id, problem_category, allowed_dev_user_ids")
        .eq("id", chapterId)
        .maybeSingle()
      if (chapter) {
        const accessSubject = resolveDevAccessSubject(
          "all",
          auth.permissions.isAdmin,
          auth.permissions.isDev,
          auth.permissions.devSubjects,
        )
        if (
          !chapterVisibleForDev(
            chapter,
            accessSubject,
            auth.permissions,
            auth.userId,
          )
        ) {
          return NextResponse.json(
            { error: "Capitolul nu este în domeniul tău dev." },
            { status: 403 },
          )
        }
      }
    }

    await deleteLearningPathImage(path)
    return NextResponse.json({ success: true, path })
  } catch (err: unknown) {
    logger.error("[dev/learning-paths/upload] DELETE:", err)
    return NextResponse.json({ error: "Eroare internă la ștergere." }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"

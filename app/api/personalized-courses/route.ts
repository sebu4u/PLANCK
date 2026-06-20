import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import type { PersonalizedCourseCatalogCandidate, PersonalizedCourseGeneratedPlanItem, SupabaseAnyClient } from "@/lib/personalized-courses/types"
import { searchPlanckContentForPrompt } from "@/lib/personalized-courses/search"
import { planPersonalizedCourse } from "@/lib/personalized-courses/planner"
import { sanitizeContentJson } from "@/lib/personalized-courses/sanitize"
import { slugify } from "@/lib/slug"

const MIN_PROMPT_LENGTH = 3
const MAX_PROMPT_LENGTH = 500
const MAX_COURSES_PER_DAY = 3
const MAX_COURSES_TOTAL = 20

function normalizePrompt(value: unknown): string | null {
  if (typeof value !== "string") return null
  const prompt = value.replace(/\s+/g, " ").trim()
  return prompt || null
}

function validatePrompt(prompt: string): string | null {
  if (prompt.length < MIN_PROMPT_LENGTH) return "Scrie ce vrei să înveți în cel puțin câteva cuvinte."
  if (prompt.length > MAX_PROMPT_LENGTH) return `Promptul poate avea maximum ${MAX_PROMPT_LENGTH} de caractere.`
  if (/(.)\1{18,}/.test(prompt)) return "Promptul pare spam. Reformulează obiectivul de învățare."
  if (/https?:\/\//i.test(prompt)) return "Scrie obiectivul de învățare în text, fără linkuri."
  if (/<[a-z][\s\S]*?>/i.test(prompt)) return "Scrie obiectivul în text simplu, fără HTML."

  const abusivePattern = /\b(kill|suicide|bomb|terror|porn|xxx|curva|pula|muie|prostule|idiotule)\b/i
  if (abusivePattern.test(prompt)) {
    return "Promptul trebuie să fie un obiectiv de învățare formulat respectuos."
  }

  return null
}

function makeUniqueSlug(prefix: string, title: string, userId: string, suffix = ""): string {
  const base = slugify(title).slice(0, 52) || "curs-personalizat"
  const userPart = userId.replace(/-/g, "").slice(0, 8)
  const timePart = Date.now().toString(36)
  const tail = suffix ? `-${suffix}` : ""
  return `${prefix}-${userPart}-${base}-${timePart}${tail}`.slice(0, 120)
}

function sourceFallbackContent(candidate: PersonalizedCourseCatalogCandidate | undefined, title: string): Record<string, unknown> {
  if (!candidate) return {}
  return {
    body: `## ${title}\n\nConținut Planck relevant: **${candidate.title}**.\n\n${candidate.summary || "Acest pas folosește material existent din Planck."}`,
    sourceSummary: candidate.summary,
    sourceUrl: candidate.url ?? null,
    sourceKey: candidate.key,
  }
}

function getOfficialItemInsertPayload(
  lessonId: string,
  item: PersonalizedCourseGeneratedPlanItem,
  orderIndex: number,
  candidatesByKey: Map<string, PersonalizedCourseCatalogCandidate>,
) {
  const sourceKey = item.source_key?.trim() || ""
  const candidate = sourceKey ? candidatesByKey.get(sourceKey) : undefined
  const itemType =
    (candidate?.item_type ?? item.item_type) === "text" &&
    typeof candidate?.metadata?.cursuri_lesson_slug !== "string"
      ? "custom_text"
      : candidate?.item_type ?? item.item_type
  const contentJson = sanitizeContentJson(
    item.content_json && typeof item.content_json === "object" && !Array.isArray(item.content_json)
      ? item.content_json
      : sourceFallbackContent(candidate, item.title),
  )

  const row: Record<string, unknown> = {
    lesson_id: lessonId,
    item_type: itemType,
    title: item.title,
    order_index: orderIndex,
    is_active: true,
    content_json: {
      ...contentJson,
      personalized_source_key: candidate?.key ?? null,
      personalized_source_type: candidate?.source_type ?? "generated",
      personalized_source_table: candidate?.source_table ?? null,
      personalized_source_id: candidate?.source_id ?? null,
    },
  }

  const cursuriLessonSlug = candidate?.metadata?.cursuri_lesson_slug
  const youtubeUrl = candidate?.metadata?.youtube_url
  if (typeof cursuriLessonSlug === "string" && cursuriLessonSlug) row.cursuri_lesson_slug = cursuriLessonSlug
  if (typeof youtubeUrl === "string" && youtubeUrl) row.youtube_url = youtubeUrl

  if (candidate?.source_type === "quiz_question") {
    row.quiz_question_id = candidate.source_id
  } else if (candidate?.source_type === "problem") {
    row.problem_id = candidate.source_id
  } else if (candidate?.source_type === "math_problem" || candidate?.source_type === "coding_problem") {
    row.problem_id = candidate.source_id
  } else if (candidate?.source_type === "learning_path_item") {
    const quizQuestionId = candidate.metadata?.quiz_question_id
    const problemId = candidate.metadata?.problem_id
    if (typeof quizQuestionId === "string" && quizQuestionId) row.quiz_question_id = quizQuestionId
    if (typeof problemId === "string" && problemId) row.problem_id = problemId
  }

  return row
}

async function markChapterFailed(admin: SupabaseAnyClient, chapterId: string, reason: string) {
  await admin
    .from("learning_path_chapters")
    .update({
      generation_status: "failed",
      generation_metadata: {
        failedAt: new Date().toISOString(),
        reason: reason.slice(0, 500),
      },
    })
    .eq("id", chapterId)
}

async function checkRateLimit(admin: SupabaseAnyClient, userId: string): Promise<string | null> {
  const { count: totalCourses } = await admin
    .from("learning_path_chapters")
    .select("id", { count: "exact", head: true })
    .eq("generated_by_user_id", userId)
    .eq("is_personalized", true)
    .neq("generation_status", "failed")

  if ((totalCourses ?? 0) >= MAX_COURSES_TOTAL) {
    return `Ai atins limita de ${MAX_COURSES_TOTAL} cursuri personalizate. Șterge unul vechi pentru a genera unul nou.`
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: todayCount } = await admin
    .from("learning_path_chapters")
    .select("id", { count: "exact", head: true })
    .eq("generated_by_user_id", userId)
    .eq("is_personalized", true)
    .neq("generation_status", "failed")
    .gte("created_at", oneDayAgo)

  if ((todayCount ?? 0) >= MAX_COURSES_PER_DAY) {
    return `Poți genera maximum ${MAX_COURSES_PER_DAY} cursuri pe zi. Revino mâine.`
  }

  return null
}

export async function GET() {
  return NextResponse.json({ courses: [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }

  const access = await getLearningPathAccess(null)
  if (access.mode !== "full") {
    return NextResponse.json(
      { error: "Generarea de cursuri personalizate este disponibilă pentru membrii Plus/Premium." },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 })
  }

  const prompt = normalizePrompt((body as { prompt?: unknown })?.prompt)
  if (!prompt) return NextResponse.json({ error: "Promptul este obligatoriu." }, { status: 400 })

  const promptError = validatePrompt(prompt)
  if (promptError) return NextResponse.json({ error: promptError }, { status: 400 })

  const admin = createAdminClient()
  const rateLimitError = await checkRateLimit(admin, user.id)
  if (rateLimitError) return NextResponse.json({ error: rateLimitError }, { status: 429 })

  try {
    const candidates = await searchPlanckContentForPrompt(supabase, prompt, 80)
    const plan = await planPersonalizedCourse(prompt, candidates)
    const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]))
    const generationMetadata = {
      lessonCount: plan.lessons.length,
      itemCount: plan.lessons.reduce((total, lesson) => total + lesson.items.length, 0),
      model: process.env.PERSONALIZED_COURSE_OPENAI_MODEL || "gpt-4o-mini",
      generatedAt: new Date().toISOString(),
      backend: "learning_path",
    }

    const chapterSlug = makeUniqueSlug("ai", plan.title, user.id)
    const { data: chapter, error: chapterError } = await admin
      .from("learning_path_chapters")
      .insert({
        generated_by_user_id: user.id,
        is_personalized: true,
        original_prompt: prompt,
        generation_status: "creating",
        slug: chapterSlug,
        title: plan.title,
        nav_title: plan.title.slice(0, 32),
        description: plan.description,
        icon_url: null,
        accent_color: "#1f1f1f",
        problem_category: "ai",
        order_index: 900000 + Math.floor(Date.now() / 1000),
        is_active: true,
        source_summary: candidates.slice(0, 40).map((candidate) => ({
          key: candidate.key,
          source_type: candidate.source_type,
          source_table: candidate.source_table,
          source_id: candidate.source_id,
          title: candidate.title,
          summary: candidate.summary,
          url: candidate.url ?? null,
        })),
        generation_metadata: generationMetadata,
      })
      .select("*")
      .single()

    if (chapterError || !chapter) {
      console.error("learning path chapter insert:", chapterError)
      return NextResponse.json({ error: "Nu am putut salva cursul personalizat." }, { status: 500 })
    }

    let firstLessonSlug: string | null = null

    for (let lessonIndex = 0; lessonIndex < plan.lessons.length; lessonIndex += 1) {
      const lesson = plan.lessons[lessonIndex]
      const lessonSlug = makeUniqueSlug("lectie", lesson.title, user.id, String(lessonIndex + 1))
      if (!firstLessonSlug) firstLessonSlug = lessonSlug

      const { data: insertedLesson, error: lessonError } = await admin
        .from("learning_path_lessons")
        .insert({
          chapter_id: chapter.id,
          slug: lessonSlug,
          title: lesson.title,
          description: lesson.description ?? null,
          image_url: null,
          lesson_type: "text",
          order_index: lessonIndex,
          is_active: true,
        })
        .select("*")
        .single()

      if (lessonError || !insertedLesson) {
        console.error("learning path lesson insert:", lessonError)
        await markChapterFailed(admin, chapter.id, lessonError?.message ?? "lesson insert failed")
        return NextResponse.json({ error: "Cursul a fost creat, dar lecțiile nu au putut fi salvate." }, { status: 500 })
      }

      const itemRows = lesson.items.map((item, itemIndex) =>
        getOfficialItemInsertPayload(insertedLesson.id, item, itemIndex, candidatesByKey),
      )
      const { error: itemsError } = await admin.from("learning_path_lesson_items").insert(itemRows)
      if (itemsError) {
        console.error("learning path items insert:", itemsError)
        await markChapterFailed(admin, chapter.id, itemsError.message ?? "item insert failed")
        return NextResponse.json({ error: "Cursul a fost creat, dar itemii nu au putut fi salvați." }, { status: 500 })
      }
    }

    const { data: readyChapter, error: readyError } = await admin
      .from("learning_path_chapters")
      .update({
        generation_status: "ready",
        generation_metadata: {
          ...generationMetadata,
          readyAt: new Date().toISOString(),
        },
      })
      .eq("id", chapter.id)
      .select("*")
      .single()

    if (readyError || !readyChapter) {
      console.error("learning path chapter ready update:", readyError)
      await markChapterFailed(admin, chapter.id, readyError?.message ?? "ready update failed")
      return NextResponse.json({ error: "Cursul a fost generat, dar nu a putut fi activat." }, { status: 500 })
    }

    const href = firstLessonSlug ? `/invata/${chapterSlug}/${firstLessonSlug}` : `/invata/${chapterSlug}`
    return NextResponse.json({ course: readyChapter, href }, { status: 201 })
  } catch (error) {
    console.error("personalized learning path generation:", error)
    return NextResponse.json({ error: "Nu am putut genera cursul personalizat acum." }, { status: 502 })
  }
}

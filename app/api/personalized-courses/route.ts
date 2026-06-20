import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { getLearningPathAccess } from "@/lib/learning-path-access"
import type { PersonalizedCourseCatalogCandidate, PersonalizedCourseGeneratedPlanItem, SupabaseAnyClient } from "@/lib/personalized-courses/types"
import { getPersonalizedCourseHref, getPersonalizedCoursesForUser } from "@/lib/personalized-courses/data"
import { searchPlanckContentForPrompt } from "@/lib/personalized-courses/search"
import { planPersonalizedCourse } from "@/lib/personalized-courses/planner"
import { sanitizeContentJson } from "@/lib/personalized-courses/sanitize"

const MIN_PROMPT_LENGTH = 3
const MAX_PROMPT_LENGTH = 500
const MAX_COURSES_PER_DAY = 3
const MAX_COURSES_TOTAL = 20

function normalizePrompt(value: unknown): string | null {
  if (typeof value !== "string") return null
  const prompt = value.replace(/\s+/g, " ").trim()
  if (!prompt) return null
  return prompt
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

function sourceFallbackContent(candidate: PersonalizedCourseCatalogCandidate | undefined, title: string): Record<string, unknown> {
  if (!candidate) return {}
  if (candidate.source_type === "lesson") {
    return {
      body: `## ${title}\n\nAm găsit conținut Planck relevant: **${candidate.title}**.\n\n${candidate.summary || "Folosește această etapă ca bază pentru cursul personalizat."}`,
      sourceSummary: candidate.summary,
      sourceUrl: candidate.url ?? null,
    }
  }
  return {
    sourceSummary: candidate.summary,
    sourceUrl: candidate.url ?? null,
  }
}

function getItemInsertPayload(
  courseId: string,
  lessonId: string,
  item: PersonalizedCourseGeneratedPlanItem,
  orderIndex: number,
  candidatesByKey: Map<string, PersonalizedCourseCatalogCandidate>,
) {
  const sourceKey = item.source_key?.trim() || ""
  const candidate = sourceKey ? candidatesByKey.get(sourceKey) : undefined
  const rawContentJson =
    item.content_json && typeof item.content_json === "object" && !Array.isArray(item.content_json)
      ? item.content_json
      : sourceFallbackContent(candidate, item.title)

  // Sanitize all generated content before storage to prevent stored XSS
  const contentJson = sanitizeContentJson(rawContentJson)

  return {
    course_id: courseId,
    lesson_id: lessonId,
    item_type: candidate?.item_type ?? item.item_type,
    title: item.title,
    source_type: candidate?.source_type ?? "generated",
    source_id: candidate?.source_id ?? null,
    source_table: candidate?.source_table ?? null,
    source_title: candidate?.title ?? null,
    content_json: contentJson,
    order_index: orderIndex,
  }
}

async function markCourseFailed(admin: SupabaseAnyClient, courseId: string, reason: string) {
  const safeReason = reason.slice(0, 500)
  await admin
    .from("personalized_courses")
    .update({
      status: "failed",
      generation_metadata: {
        failedAt: new Date().toISOString(),
        reason: safeReason,
      },
    })
    .eq("id", courseId)
}

async function checkRateLimit(admin: SupabaseAnyClient, userId: string): Promise<string | null> {
  const { count: totalCourses } = await admin
    .from("personalized_courses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "failed")

  if ((totalCourses ?? 0) >= MAX_COURSES_TOTAL) {
    return `Ai atins limita de ${MAX_COURSES_TOTAL} cursuri personalizate. Șterge unul vechi pentru a genera unul nou.`
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: todayCount } = await admin
    .from("personalized_courses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "failed")
    .gte("created_at", oneDayAgo)

  if ((todayCount ?? 0) >= MAX_COURSES_PER_DAY) {
    return `Poți genera maximum ${MAX_COURSES_PER_DAY} cursuri pe zi. Revino mâine.`
  }

  return null
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
  }

  const courses = await getPersonalizedCoursesForUser(supabase, user.id, 12)
  return NextResponse.json({ courses })
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

  // Entitlement check: only full-access users (admin/paid) can generate courses
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
  if (!prompt) {
    return NextResponse.json({ error: "Promptul este obligatoriu." }, { status: 400 })
  }

  const promptError = validatePrompt(prompt)
  if (promptError) {
    return NextResponse.json({ error: promptError }, { status: 400 })
  }

  // Use service-role admin client for all course/lesson/item writes
  // (RLS only allows SELECT for authenticated on those tables)
  const admin = createAdminClient()

  // Rate limit check
  const rateLimitError = await checkRateLimit(admin, user.id)
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 })
  }

  try {
    const candidates = await searchPlanckContentForPrompt(supabase, prompt, 32)
    const plan = await planPersonalizedCourse(prompt, candidates)
    const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]))
    const generationMetadata = {
      lessonCount: plan.lessons.length,
      itemCount: plan.lessons.reduce((total, lesson) => total + lesson.items.length, 0),
      model: process.env.PERSONALIZED_COURSE_OPENAI_MODEL || "gpt-4o-mini",
      generatedAt: new Date().toISOString(),
    }

    const { data: course, error: courseError } = await admin
      .from("personalized_courses")
      .insert({
        user_id: user.id,
        original_prompt: prompt,
        title: plan.title,
        description: plan.description,
        status: "creating",
        source_summary: candidates.slice(0, 16).map((candidate) => ({
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

    if (courseError || !course) {
      console.error("personalized course insert:", courseError)
      return NextResponse.json({ error: "Nu am putut salva cursul personalizat." }, { status: 500 })
    }

    for (let lessonIndex = 0; lessonIndex < plan.lessons.length; lessonIndex += 1) {
      const lesson = plan.lessons[lessonIndex]
      const { data: insertedLesson, error: lessonError } = await admin
        .from("personalized_course_lessons")
        .insert({
          course_id: course.id,
          title: lesson.title,
          description: lesson.description ?? null,
          order_index: lessonIndex,
        })
        .select("*")
        .single()

      if (lessonError || !insertedLesson) {
        console.error("personalized lesson insert:", lessonError)
        await markCourseFailed(admin, course.id, lessonError?.message ?? "lesson insert failed")
        return NextResponse.json({ error: "Cursul a fost creat, dar lecțiile nu au putut fi salvate." }, { status: 500 })
      }

      const itemRows = lesson.items.map((item, itemIndex) =>
        getItemInsertPayload(course.id, insertedLesson.id, item, itemIndex, candidatesByKey),
      )
      const { error: itemsError } = await admin.from("personalized_course_items").insert(itemRows)
      if (itemsError) {
        console.error("personalized item insert:", itemsError)
        await markCourseFailed(admin, course.id, itemsError.message ?? "item insert failed")
        return NextResponse.json({ error: "Cursul a fost creat, dar itemii nu au putut fi salvați." }, { status: 500 })
      }
    }

    const { data: readyCourse, error: readyError } = await admin
      .from("personalized_courses")
      .update({
        status: "ready",
        generation_metadata: {
          ...generationMetadata,
          readyAt: new Date().toISOString(),
        },
      })
      .eq("id", course.id)
      .eq("user_id", user.id)
      .select("*")
      .single()

    if (readyError || !readyCourse) {
      console.error("personalized course ready update:", readyError)
      await markCourseFailed(admin, course.id, readyError?.message ?? "course ready update failed")
      return NextResponse.json({ error: "Cursul a fost generat, dar nu a putut fi finalizat." }, { status: 500 })
    }

    return NextResponse.json({
      course: {
        id: readyCourse.id,
        title: readyCourse.title,
        description: readyCourse.description,
        href: getPersonalizedCourseHref(readyCourse.id),
      },
      href: getPersonalizedCourseHref(readyCourse.id),
    })
  } catch (error) {
    console.error("personalized course generation:", error)
    const message = error instanceof Error && error.message.includes("OPENAI_API_KEY")
      ? "OPENAI_API_KEY lipsește din configurația serverului."
      : "Nu am putut genera cursul personalizat acum. Încearcă din nou."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

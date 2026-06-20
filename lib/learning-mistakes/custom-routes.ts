import type { SupabaseClient } from "@supabase/supabase-js"
import type { LearningPathChapter, LearningPathLesson, LearningPathLessonItem } from "@/lib/supabase-learning-paths"

export interface MistakeConceptStat {
  concept_key: string
  subject: string | null
  mistake_count: number
  recent_weight: number
  last_mistake_at: string
}

export interface MistakeEventSnapshot {
  id: string
  surface: string
  item_id: string | null
  lesson_id: string | null
  chapter_id: string | null
  problem_id: string | null
  quiz_question_id: string | null
  item_type: string | null
  subject: string | null
  concept_tags: string[]
  prompt_context: Record<string, unknown> | null
  created_at: string
}

export interface MistakeProfile {
  concepts: MistakeConceptStat[]
  events: MistakeEventSnapshot[]
}

export interface CustomRouteCandidate {
  sourceType: "learning_path_item" | "catalog_problem" | "generated_review_prompt"
  learningPathItemId?: string | null
  problemId?: string | null
  title: string
  href?: string | null
  reason: string
  targetConcepts: string[]
  snapshot: Record<string, unknown>
  score: number
}

export interface GeneratedCustomRoute {
  id: string
  title: string
  prompt: string
  rationale: string
  items: CustomRouteCandidate[]
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export async function getUserMistakeProfile(
  supabase: SupabaseClient,
  limit = 100,
): Promise<MistakeProfile> {
  const { data, error } = await supabase.rpc("get_user_mistake_profile", { p_limit: limit })
  if (error) throw new Error(error.message || "Nu am putut încărca profilul de greșeli.")

  const raw = (data ?? {}) as { concepts?: unknown; events?: unknown }
  return {
    concepts: asArray<MistakeConceptStat>(raw.concepts),
    events: asArray<MistakeEventSnapshot>(raw.events),
  }
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function tokenize(value: string): string[] {
  const stop = new Set(["pentru", "despre", "care", "unde", "cum", "din", "cu", "si", "sau", "the", "and"])
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stop.has(token))
    .slice(0, 30)
}

function uniqueTags(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const tag = String(value ?? "").trim()
    if (!tag) continue
    const key = normalizeText(tag)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag.slice(0, 80))
  }
  return result.slice(0, 12)
}

function itemHref(chapter: LearningPathChapter | undefined, lesson: LearningPathLesson | undefined, itemIndex: number): string | null {
  if (!chapter || !lesson) return null
  const chapterSegment = chapter.slug?.trim() || chapter.id
  const lessonSegment = lesson.slug?.trim() || lesson.id
  return `/invata/${chapterSegment}/${lessonSegment}/${Math.max(1, itemIndex + 1)}`
}

export async function buildCustomRouteCandidates(
  supabase: SupabaseClient,
  prompt: string,
  profile: MistakeProfile,
): Promise<CustomRouteCandidate[]> {
  const promptTokens = tokenize(prompt)
  const conceptWeights = new Map<string, MistakeConceptStat>()
  for (const concept of profile.concepts) {
    conceptWeights.set(normalizeText(concept.concept_key), concept)
  }

  const [{ data: chapters }, { data: lessons }, { data: items }] = await Promise.all([
    supabase.from("learning_path_chapters").select("*").eq("is_active", true).order("order_index"),
    supabase.from("learning_path_lessons").select("*").eq("is_active", true).order("order_index"),
    supabase
      .from("learning_path_lesson_items")
      .select("id, lesson_id, item_type, title, problem_id, quiz_question_id, order_index, content_json, is_active")
      .eq("is_active", true)
      .order("order_index")
      .limit(600),
  ])

  const chapterById = new Map((chapters ?? []).map((chapter) => [chapter.id, chapter as LearningPathChapter]))
  const lessonById = new Map((lessons ?? []).map((lesson) => [lesson.id, lesson as LearningPathLesson]))

  const candidates: CustomRouteCandidate[] = []
  for (const rawItem of (items ?? []) as LearningPathLessonItem[]) {
    const lesson = lessonById.get(rawItem.lesson_id)
    const chapter = lesson ? chapterById.get(lesson.chapter_id) : undefined
    const searchBlob = normalizeText([
      rawItem.title,
      rawItem.item_type,
      rawItem.problem_id,
      rawItem.quiz_question_id,
      JSON.stringify(rawItem.content_json ?? {}),
      lesson?.title,
      lesson?.description,
      chapter?.title,
      chapter?.description,
      chapter?.problem_category,
    ].join(" "))

    let score = 0
    const targetConcepts: string[] = []
    for (const concept of profile.concepts) {
      const conceptKey = normalizeText(concept.concept_key)
      if (!conceptKey) continue
      if (searchBlob.includes(conceptKey)) {
        score += Number(concept.recent_weight ?? concept.mistake_count ?? 1) + 2
        targetConcepts.push(concept.concept_key)
      }
    }
    for (const token of promptTokens) {
      if (searchBlob.includes(token)) score += 1.5
    }
    if (rawItem.item_type === "problem" || rawItem.item_type === "math_problem" || rawItem.item_type === "test" || rawItem.item_type === "grila") {
      score += 0.75
    }
    if (score <= 0) continue

    candidates.push({
      sourceType: "learning_path_item",
      learningPathItemId: rawItem.id,
      problemId: rawItem.problem_id ?? null,
      title: rawItem.title || lesson?.title || chapter?.title || "Exercițiu recomandat",
      href: itemHref(chapter, lesson, Number(rawItem.order_index ?? 0)),
      reason: targetConcepts.length
        ? `Repară concepte unde ai greșit: ${targetConcepts.slice(0, 3).join(", ")}.`
        : "Se potrivește cu cererea ta și cu activitatea recentă.",
      targetConcepts: uniqueTags(targetConcepts.length ? targetConcepts : [chapter?.title, rawItem.item_type]),
      snapshot: {
        itemType: rawItem.item_type,
        lessonTitle: lesson?.title ?? null,
        chapterTitle: chapter?.title ?? null,
        href: itemHref(chapter, lesson, Number(rawItem.order_index ?? 0)),
      },
      score,
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const selected: CustomRouteCandidate[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    const key = candidate.learningPathItemId ?? candidate.problemId ?? candidate.title
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(candidate)
    if (selected.length >= 8) break
  }

  if (selected.length < 4) {
    const topConcepts = profile.concepts.slice(0, 5).map((concept) => concept.concept_key)
    selected.push({
      sourceType: "generated_review_prompt",
      title: "Mini-recapitulare ghidată",
      reason: "Am adăugat un pas de recapitulare fiindcă nu există încă suficiente potriviri directe în trasee.",
      targetConcepts: uniqueTags(topConcepts),
      snapshot: {
        prompt,
        instructions: "Cere-i asistentului să explice pe scurt conceptele și apoi rezolvă 2-3 exemple simple.",
      },
      score: 0.25,
    })
  }

  return selected
}

export function makeCustomRouteTitle(prompt: string, concepts: MistakeConceptStat[]): string {
  const trimmed = prompt.trim()
  if (trimmed.length >= 8) return trimmed.length > 72 ? `${trimmed.slice(0, 69)}…` : trimmed
  const first = concepts[0]?.concept_key
  return first ? `Traseu pentru ${first}` : "Traseu personalizat"
}

export function makeCustomRouteRationale(prompt: string, profile: MistakeProfile, items: CustomRouteCandidate[]): string {
  const conceptText = profile.concepts
    .slice(0, 4)
    .map((concept) => concept.concept_key)
    .join(", ")
  const base = conceptText
    ? `Am prioritizat conceptele unde ai avut cele mai multe greșeli recente: ${conceptText}.`
    : "Nu există încă multe greșeli salvate, așa că traseul pornește de la cererea ta."
  return `${base} Prompt: „${prompt.trim()}”. Traseul are ${items.length} pași, ordonați după relevanță și utilitate pentru recuperare.`
}

export async function persistCustomRoute(
  supabase: SupabaseClient,
  params: {
    userId: string
    prompt: string
    title: string
    rationale: string
    items: CustomRouteCandidate[]
  },
): Promise<GeneratedCustomRoute> {
  const { data: route, error: routeError } = await supabase
    .from("user_custom_learning_routes")
    .insert({
      user_id: params.userId,
      title: params.title,
      prompt: params.prompt,
      rationale: params.rationale,
      generation_model: "deterministic-mistake-profile-v1",
      generation_metadata: {
        itemCount: params.items.length,
        generatedAt: new Date().toISOString(),
      },
    })
    .select("id, title, prompt, rationale")
    .single()

  if (routeError || !route) {
    throw new Error(routeError?.message || "Nu am putut salva traseul personalizat.")
  }

  if (params.items.length > 0) {
    const rows = params.items.map((item, index) => ({
      route_id: route.id,
      user_id: params.userId,
      order_index: index,
      learning_path_item_id: item.learningPathItemId ?? null,
      problem_id: item.problemId ?? null,
      source_type: item.sourceType,
      title: item.title,
      reason: item.reason,
      target_concepts: item.targetConcepts,
      snapshot: item.snapshot,
    }))

    const { error: itemsError } = await supabase.from("user_custom_learning_route_items").insert(rows)
    if (itemsError) throw new Error(itemsError.message || "Nu am putut salva pașii traseului.")
  }

  return {
    id: route.id,
    title: route.title,
    prompt: route.prompt,
    rationale: route.rationale ?? params.rationale,
    items: params.items,
  }
}

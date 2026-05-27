import type { SupabaseClient } from "@supabase/supabase-js"
import { slugify } from "@/lib/slug"

export function buildLearningPathSlugFromTitle(title: string): string {
  const base = slugify(title.trim())
  return base || "lectie"
}

export async function generateUniqueChapterSlug(
  client: SupabaseClient,
  title: string,
  excludeChapterId?: string
): Promise<string> {
  const base = buildLearningPathSlugFromTitle(title)
  let candidate = base
  let suffix = 2

  while (true) {
    let query = client
      .from("learning_path_chapters")
      .select("id")
      .eq("slug", candidate)
      .limit(1)

    if (excludeChapterId) {
      query = query.neq("id", excludeChapterId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) {
      console.error("Error checking chapter slug uniqueness:", error)
      return candidate
    }
    if (!data) return candidate

    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

export async function generateUniqueLessonSlug(
  client: SupabaseClient,
  chapterId: string,
  title: string,
  excludeLessonId?: string
): Promise<string> {
  const base = buildLearningPathSlugFromTitle(title)
  let candidate = base
  let suffix = 2

  while (true) {
    let query = client
      .from("learning_path_lessons")
      .select("id")
      .eq("chapter_id", chapterId)
      .eq("slug", candidate)
      .limit(1)

    if (excludeLessonId) {
      query = query.neq("id", excludeLessonId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) {
      console.error("Error checking lesson slug uniqueness:", error)
      return candidate
    }
    if (!data) return candidate

    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

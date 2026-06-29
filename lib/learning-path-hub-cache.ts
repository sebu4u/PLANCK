import "server-only"

import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import {
  getLearningPathHubLessonsByChapterIds,
  getLearningPathLessonItemCountsByLessonIds,
  getLearningPathLessonItemAggregates,
  type LearningPathHubChapter,
  type LearningPathHubLesson,
  type LearningPathLessonItemAggregates,
} from "@/lib/supabase-learning-paths"

const LEARNING_PATH_HUB_CACHE_SECONDS = 5 * 60
const LEARNING_PATH_HUB_CHAPTER_COLUMNS =
  "id, slug, title, nav_title, description, icon_url, order_index, is_personalized, generation_status, created_at"

function createAnonSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export interface PublicLearningPathHubCatalog {
  chapters: LearningPathHubChapter[]
  lessonsByChapter: Record<string, LearningPathHubLesson[]>
}

async function loadPublicLearningPathHubCatalog(): Promise<PublicLearningPathHubCatalog> {
  const supabase = createAnonSupabaseClient()
  const { data, error } = await supabase
    .from("learning_path_chapters")
    .select(LEARNING_PATH_HUB_CHAPTER_COLUMNS)
    .eq("is_active", true)
    .or("is_personalized.is.null,is_personalized.eq.false")
    .order("order_index")

  if (error) {
    console.error("Error fetching cached public learning path hub chapters:", error)
    return { chapters: [], lessonsByChapter: {} }
  }

  const chapters = (data || []) as LearningPathHubChapter[]
  const lessonsByChapter = await getLearningPathHubLessonsByChapterIds(
    chapters.map((chapter) => chapter.id),
    supabase
  )

  return { chapters, lessonsByChapter }
}

export const getCachedPublicLearningPathHubCatalog = unstable_cache(
  loadPublicLearningPathHubCatalog,
  ["learning-path-hub-public-catalog-v1"],
  { revalidate: LEARNING_PATH_HUB_CACHE_SECONDS }
)

async function loadPublicLearningPathLessonItemCounts(
  lessonIds: string[]
): Promise<Record<string, number>> {
  const supabase = createAnonSupabaseClient()
  return getLearningPathLessonItemCountsByLessonIds(lessonIds, supabase)
}

export const getCachedPublicLearningPathLessonItemCounts = unstable_cache(
  loadPublicLearningPathLessonItemCounts,
  ["learning-path-hub-public-item-counts-v1"],
  { revalidate: LEARNING_PATH_HUB_CACHE_SECONDS }
)

async function loadPublicLearningPathLessonItemAggregates(
  lessonIds: string[]
): Promise<LearningPathLessonItemAggregates> {
  const supabase = createAnonSupabaseClient()
  return getLearningPathLessonItemAggregates(lessonIds, supabase)
}

export const getCachedPublicLearningPathLessonItemAggregates = unstable_cache(
  loadPublicLearningPathLessonItemAggregates,
  ["learning-path-hub-public-item-aggregates-v1"],
  { revalidate: LEARNING_PATH_HUB_CACHE_SECONDS }
)

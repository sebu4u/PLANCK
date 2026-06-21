import type { SupabaseAnyClient } from "@/lib/personalized-courses/types"

export const PERSONALIZED_GENERATION_CANCELLED_REASON = "Anulat de utilizator."

export type PersonalizedChapterGenerationStatus = "creating" | "ready" | "failed"

export async function getPersonalizedChapterGenerationStatus(
  admin: SupabaseAnyClient,
  chapterId: string,
): Promise<PersonalizedChapterGenerationStatus | null> {
  const { data, error } = await admin
    .from("learning_path_chapters")
    .select("generation_status")
    .eq("id", chapterId)
    .maybeSingle()

  if (error || !data) return null

  const status = data.generation_status
  if (status === "creating" || status === "ready" || status === "failed") {
    return status
  }

  return null
}

export async function isPersonalizedChapterStillCreating(
  admin: SupabaseAnyClient,
  chapterId: string,
): Promise<boolean> {
  const status = await getPersonalizedChapterGenerationStatus(admin, chapterId)
  return status === "creating"
}

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Problem } from "@/data/problems"

export const PHYSICS_CATALOG_SSR_PAGE_SIZE = 15

const physicsCatalogClassMap: Record<number, string> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a",
}

export function normalizePhysicsCatalogServerProblems(items: Problem[] = []): Problem[] {
  return items.map((problem) => ({
    ...problem,
    classString:
      physicsCatalogClassMap[problem.class as number] || problem.classString || "Toate",
  })) as Problem[]
}

/** Lightweight SSR payload: first page + total count (avoids full-table SSR CPU). */
export async function fetchPhysicsCatalogSsrSnapshot(
  supabase: SupabaseClient,
  pageSize = PHYSICS_CATALOG_SSR_PAGE_SIZE
): Promise<{ problems: Problem[]; totalCount: number }> {
  const { data, count, error } = await supabase
    .from("problems")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, pageSize - 1)

  if (error) {
    return { problems: [], totalCount: 0 }
  }

  return {
    problems: normalizePhysicsCatalogServerProblems((data || []) as Problem[]),
    totalCount: count ?? (data?.length || 0),
  }
}

/** Titles only for structured data / SEO without loading full catalog. */
export async function fetchPhysicsCatalogSeoTitles(
  supabase: SupabaseClient,
  limit = 24
): Promise<Array<{ id: string; title: string }>> {
  const { data } = await supabase
    .from("problems")
    .select("id,title")
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data || []) as Array<{ id: string; title: string }>
}

import type { SupabaseClient } from "@supabase/supabase-js"
import type { CodingProblem } from "@/components/coding-problems/types"

export const INFORMATICA_CATALOG_SSR_PAGE_SIZE = 15

const CODING_PROBLEM_LIST_COLUMNS =
  "id,slug,title,statement_markdown,difficulty,class,chapter,points,time_limit_ms,memory_limit_kb,tags,language,created_at,updated_at"

/** Lightweight SSR payload: first page + total count (avoids full-table SSR CPU). */
export async function fetchInformaticaCatalogSsrSnapshot(
  supabase: SupabaseClient,
  pageSize = INFORMATICA_CATALOG_SSR_PAGE_SIZE
): Promise<{ problems: CodingProblem[]; totalCount: number }> {
  const { data, count, error } = await supabase
    .from("coding_problems")
    .select(CODING_PROBLEM_LIST_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(0, pageSize - 1)

  if (error) {
    return { problems: [], totalCount: 0 }
  }

  const problems = (data ?? []).map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
  })) as CodingProblem[]

  return {
    problems,
    totalCount: count ?? problems.length,
  }
}

export async function fetchInformaticaCatalogSeoTitles(
  supabase: SupabaseClient,
  limit = 24
): Promise<Array<{ id: string; title: string }>> {
  const { data } = await supabase
    .from("coding_problems")
    .select("id,title")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data || []) as Array<{ id: string; title: string }>
}

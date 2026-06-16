import type { PostgrestError } from "@supabase/supabase-js"

const DEFAULT_PAGE_SIZE = 1000

export async function fetchAllTableRows<T>(
  fetchPage: (range: { from: number; to: number }) => PromiseLike<{
    data: T[] | null
    error: PostgrestError | null
  }>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const accumulated: T[] = []

  for (;;) {
    const from = accumulated.length
    const to = from + pageSize - 1
    const { data, error } = await fetchPage({ from, to })
    if (error) {
      return { data: accumulated, error }
    }
    if (!data?.length) {
      break
    }
    accumulated.push(...data)
    if (data.length < pageSize) {
      break
    }
  }

  return { data: accumulated, error: null }
}

import { createClient } from "@supabase/supabase-js"
import { MetadataRoute } from "next"

const BASE_URL = "https://www.planck.academy"
const SITEMAP_PAGE_SIZE = 1000

type ProblemSitemapRow = {
  id: string
  updated_at?: string | null
  topic?: string | null
  grade?: string | number | null
  category?: string | null
  class?: number | null
}

function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  return createClient(supabaseUrl, supabaseAnonKey)
}

async function getProblemCount(): Promise<number> {
  const serverSupabase = getServerSupabaseClient()
  const { count } = await serverSupabase
    .from("problems")
    .select("id", { count: "exact", head: true })

  return count ?? 0
}

async function getProblemsRange(start: number, end: number): Promise<ProblemSitemapRow[]> {
  const serverSupabase = getServerSupabaseClient()

  // First, try requested SEO columns.
  const primaryQuery = await serverSupabase
    .from("problems")
    .select("id, updated_at, topic, grade")
    .order("id", { ascending: true })
    .range(start, end)

  if (!primaryQuery.error) {
    return (primaryQuery.data || []) as ProblemSitemapRow[]
  }

  // Fallback to existing schema fields used in this codebase.
  const fallbackQuery = await serverSupabase
    .from("problems")
    .select("id, updated_at, category, class")
    .order("id", { ascending: true })
    .range(start, end)

  if (fallbackQuery.error || !fallbackQuery.data) return []
  return fallbackQuery.data as ProblemSitemapRow[]
}

export async function generateSitemaps() {
  const totalProblems = await getProblemCount()
  const numberOfSitemaps = Math.max(1, Math.ceil(totalProblems / SITEMAP_PAGE_SIZE))

  return Array.from({ length: numberOfSitemaps }, (_, id) => ({ id }))
}

export default async function sitemap({
  id = 0,
}: {
  id?: number
} = {}): Promise<MetadataRoute.Sitemap> {
  const start = id * SITEMAP_PAGE_SIZE
  const end = start + SITEMAP_PAGE_SIZE - 1
  const problems = await getProblemsRange(start, end)

  const staticEntries: MetadataRoute.Sitemap =
    id === 0
      ? [
          {
            url: `${BASE_URL}/`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
          },
          {
            url: `${BASE_URL}/catalog`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
          },
          {
            url: `${BASE_URL}/probleme`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
          },
          {
            url: `${BASE_URL}/invata`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
          },
        ]
      : []

  const problemEntries: MetadataRoute.Sitemap = problems.map((problem) => {
    return {
      url: `${BASE_URL}/probleme/${encodeURIComponent(problem.id)}`,
      lastModified: problem.updated_at ? new Date(problem.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }
  })

  return [...staticEntries, ...problemEntries]
}

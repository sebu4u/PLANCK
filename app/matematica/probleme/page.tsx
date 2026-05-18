import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  MathProblem,
  MathProblemFacets,
  MathProblemsApiResponse,
} from "@/components/math-problems/types"
import { MathProblemsClient } from "@/components/math-problems/math-problems-client"
import { MathCatalogHeader } from "@/components/math-problems/math-catalog-header"
import { createClient } from "@supabase/supabase-js"
import { generateMetadata } from "@/lib/metadata"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { MATH_PROBLEMS_PUBLIC_COLUMNS } from "@/data/math-problems"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const metadata = generateMetadata("math-problems")
export const revalidate = 21600

const PAGE_SIZE = 12

const SUPPORTED_DIFFICULTIES: Record<string, string> = {
  "ușor": "Ușor",
  usor: "Ușor",
  mediu: "Mediu",
  avansat: "Avansat",
}

type FacetRow = {
  class: number | null
  difficulty: string | null
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

function buildFacets(rows: FacetRow[]): MathProblemFacets {
  const classCounts = new Map<number, number>()
  const difficultyCounts = new Map<string, number>()

  rows.forEach((row) => {
    const classValue =
      typeof row.class === "number" && [9, 10, 11, 12].includes(row.class)
        ? row.class
        : undefined
    const difficultyValue = typeof row.difficulty === "string" ? row.difficulty : undefined

    if (classValue !== undefined) {
      classCounts.set(classValue, (classCounts.get(classValue) ?? 0) + 1)
    }

    if (difficultyValue) {
      const difficultyKey = difficultyValue.toLowerCase()
      const canonical = SUPPORTED_DIFFICULTIES[difficultyKey] ?? difficultyValue
      difficultyCounts.set(canonical, (difficultyCounts.get(canonical) ?? 0) + 1)
    }
  })

  return {
    classes: Array.from(classCounts.entries())
      .sort(([a], [b]) => a - b)
      .map(([value, count]) => ({ value, count })),
    difficulties: Array.from(difficultyCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "ro"))
      .map(([value, count]) => ({ value, count })),
  }
}

async function fetchInitialData() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const [{ data: problemsData, count, error }, { data: facetRows, error: facetError }] =
    await Promise.all([
      supabase
        .from("math_problems")
        .select(MATH_PROBLEMS_PUBLIC_COLUMNS, { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabase.from("math_problems").select("class, difficulty").eq("is_active", true),
    ])

  if (error) {
    console.error("[matematica/probleme] Failed to load problems:", error)
  }
  if (facetError) {
    console.error("[matematica/probleme] Failed to load facets:", facetError)
  }

  const problems = (problemsData ?? []).map((item) => ({
    ...item,
    tags: normalizeTags(item.tags),
  })) as MathProblem[]

  const total = count ?? problems.length
  const meta: MathProblemsApiResponse["meta"] = {
    page: 1,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    hasNextPage: total > PAGE_SIZE,
    hasPreviousPage: false,
  }

  const facets = facetRows ? buildFacets(facetRows as FacetRow[]) : null

  return {
    problems,
    meta,
    facets,
  }
}

export default async function MathProblemsPage() {
  const { problems, meta, facets } = await fetchInitialData()
  const totalProblems = facets
    ? facets.classes.reduce((sum, entry) => sum + entry.count, 0)
    : meta.total

  return (
    <CatalogThemeProvider catalogType="info">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#070707]">
        <div className="min-h-screen text-white">
          <Navigation />
          <main className="flex min-h-[calc(100vh-64px)] flex-col overflow-hidden">
            <section className="info-catalog-section bg-[#090909]/80 pb-16 pt-20 backdrop-blur-sm">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 sm:px-8 md:px-12 lg:px-16">
                <MathCatalogHeader totalProblems={totalProblems} pageSize={meta.pageSize} />

                <MathProblemsClient
                  initialProblems={problems}
                  initialMeta={meta}
                  initialFacets={facets}
                  pageSize={PAGE_SIZE}
                />
              </div>
            </section>
          </main>
          <Footer />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { CodingProblemsClient } from "@/components/coding-problems/coding-problems-client"
import {
  CodingProblem,
  CodingProblemFacets,
  CodingProblemsApiResponse,
} from "@/components/coding-problems/types"
import { createClient } from "@supabase/supabase-js"
import { generateMetadata } from "@/lib/metadata"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { InfoCatalogHeader } from "@/components/info-catalog-header"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const metadata = generateMetadata("coding-problems")
export const revalidate = 300

const PAGE_SIZE = 12
const SUPPORTED_DIFFICULTIES: Record<string, string> = {
  "ușor": "Ușor",
  "usor": "Ușor",
  "mediu": "Mediu",
  "avansat": "Avansat",
  "concurs": "Concurs",
}

type FacetRow = {
  class: number | null
  difficulty: string | null
  chapter: string | null
}

function buildFacets(rows: FacetRow[]): CodingProblemFacets {
  const classCounts = new Map<number, number>()
  const difficultyCounts = new Map<string, number>()
  const chaptersByClass = new Map<number, Set<string>>()

  rows.forEach((row) => {
    const classValue =
      typeof row.class === "number" && [9, 10, 11, 12].includes(row.class)
        ? row.class
        : undefined
    const difficultyValue =
      typeof row.difficulty === "string" ? row.difficulty : undefined
    const chapterValue = typeof row.chapter === "string" ? row.chapter : undefined

    if (classValue !== undefined) {
      classCounts.set(classValue, (classCounts.get(classValue) ?? 0) + 1)
      if (!chaptersByClass.has(classValue)) {
        chaptersByClass.set(classValue, new Set())
      }
      if (chapterValue) {
        chaptersByClass.get(classValue)?.add(chapterValue)
      }
    }

    if (difficultyValue) {
      const difficultyKey = difficultyValue.toLowerCase()
      const canonical = SUPPORTED_DIFFICULTIES[difficultyKey] ?? difficultyValue
      difficultyCounts.set(
        canonical,
        (difficultyCounts.get(canonical) ?? 0) + 1
      )
    }
  })

  return {
    classes: Array.from(classCounts.entries())
      .sort(([a], [b]) => a - b)
      .map(([value, count]) => ({ value, count })),
    difficulties: Array.from(difficultyCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "ro"))
      .map(([value, count]) => ({ value, count })),
    chaptersByClass: Array.from(chaptersByClass.entries()).reduce<
      Record<string, string[]>
    >((acc, [cls, chapters]) => {
      acc[String(cls)] = Array.from(chapters).sort((a, b) =>
        a.localeCompare(b, "ro")
      )
      return acc
    }, {}),
  }
}

async function fetchInitialData() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const [{ data: problemsData, count, error }, { data: facetRows, error: facetError }, monthlyFreeSet] =
    await Promise.all([
      supabase
        .from("coding_problems")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1),
      supabase
        .from("coding_problems")
        .select("class, difficulty, chapter")
        .eq("is_active", true),
      getMonthlyFreeProblemSet(supabase),
    ])

  if (error) {
    console.error("[coding-problems/page] Failed to load initial problems:", error)
  }
  if (facetError) {
    console.error("[coding-problems/page] Failed to load facets:", facetError)
  }

  const problems = (problemsData ?? []).map((item) => {
    const tags =
      Array.isArray(item.tags) && item.tags.length > 0
        ? item.tags
        : typeof item.tags === "string" && item.tags.length > 0
        ? [item.tags]
        : []
    return {
      ...item,
      tags,
      isFreeMonthly: monthlyFreeSet.has(item.id),
      canAccess: monthlyFreeSet.has(item.id),
    }
  }) as CodingProblem[]
  const total = count ?? problems.length
  const meta: CodingProblemsApiResponse["meta"] = {
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

export default async function CodingProblemsPage() {
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
            <section className="bg-[#090909]/80 backdrop-blur-sm pb-16 pt-20 info-catalog-section">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 sm:px-8 md:px-12 lg:px-16">
                <InfoCatalogHeader 
                  totalProblems={totalProblems}
                  pageSize={meta.pageSize}
                />

                <CodingProblemsClient
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


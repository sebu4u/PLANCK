import { Navigation } from "@/components/navigation"
import { MatematicaCatalogClient } from "@/components/catalog/matematica-catalog-client"
import { MathProblem } from "@/components/math-problems/types"
import { createClient } from "@supabase/supabase-js"
import { generateMetadata } from "@/lib/metadata"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { MATH_PROBLEMS_PUBLIC_COLUMNS } from "@/data/math-problems"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const metadata: Metadata = generateMetadata("math-problems")
export const revalidate = 21600

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

export default async function MathProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ capitol?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const capitolParam = resolvedSearchParams?.capitol
  const initialChapter = Array.isArray(capitolParam) ? capitolParam[0] : capitolParam

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  let initialProblems: MathProblem[] = []

  try {
    let data: Record<string, unknown>[] | null = null
    let error: { message?: string } | null = null

    const withChapter = await supabase
      .from("math_problems")
      .select(`${MATH_PROBLEMS_PUBLIC_COLUMNS}, chapter`)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (withChapter.error?.message?.includes("chapter")) {
      const fallback = await supabase
        .from("math_problems")
        .select(MATH_PROBLEMS_PUBLIC_COLUMNS)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      data = fallback.data
      error = fallback.error
    } else {
      data = withChapter.data
      error = withChapter.error
    }

    if (error) {
      console.error("[matematica/probleme] Failed to load problems:", error)
    } else {
      initialProblems = (data ?? []).map((item) => ({
        ...item,
        tags: normalizeTags(item.tags),
        chapter: typeof item.chapter === "string" ? item.chapter : "",
      })) as MathProblem[]
    }
  } catch (error) {
    console.error("[matematica/probleme] Failed to load problems:", error)
  }

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-16">
          <StructuredData
            id="structured-data-breadcrumbs"
            data={breadcrumbStructuredData([
              { name: "Acasă", url: "https://www.planck.academy/" },
              { name: "Matematică", url: "https://www.planck.academy/matematica/probleme" },
            ])}
          />
          <StructuredData
            id="structured-data-matematica-problems-list"
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: initialProblems.slice(0, 24).map((problem, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                name: problem.title,
              })),
            }}
          />
          <MatematicaCatalogClient initialProblems={initialProblems} initialChapter={initialChapter} />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

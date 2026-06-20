import { Navigation } from "@/components/navigation"
import { InformaticaCatalogClient } from "@/components/catalog/informatica-catalog-client"
import { CodingProblem } from "@/components/coding-problems/types"
import { createClient } from "@supabase/supabase-js"
import { generateMetadata } from "@/lib/metadata"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import {
  fetchInformaticaCatalogSeoTitles,
  fetchInformaticaCatalogSsrSnapshot,
} from "@/lib/informatica-catalog-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const metadata: Metadata = generateMetadata("coding-problems")
export const revalidate = 21600

export default async function CodingProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ capitol?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const capitolParam = resolvedSearchParams?.capitol
  const initialChapter = Array.isArray(capitolParam) ? capitolParam[0] : capitolParam

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  let initialProblems: CodingProblem[] = []
  let catalogTotalCount = 0
  let monthlyFreeSet = new Set<string>()
  let seoTitles: Array<{ id: string; title: string }> = []

  try {
    const [{ problems, totalCount }, freeSet, titles] = await Promise.all([
      fetchInformaticaCatalogSsrSnapshot(supabase),
      getMonthlyFreeProblemSet(supabase),
      fetchInformaticaCatalogSeoTitles(supabase),
    ])

    initialProblems = problems.map((item) => ({
      ...item,
      isFreeMonthly: freeSet.has(item.id),
      canAccess: freeSet.has(item.id),
    })) as CodingProblem[]
    catalogTotalCount = totalCount
    monthlyFreeSet = freeSet
    seoTitles = titles
  } catch (error) {
    console.error("[informatica/probleme] Failed to load initial problems:", error)
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
              { name: "Informatică", url: "https://www.planck.academy/informatica/probleme" },
            ])}
          />
          <StructuredData
            id="structured-data-informatica-problems-list"
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: seoTitles.map((problem, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                name: problem.title,
              })),
            }}
          />
          <InformaticaCatalogClient
            initialProblems={initialProblems}
            initialCatalogTotalCount={catalogTotalCount}
            initialMonthlyFreeSet={Array.from(monthlyFreeSet)}
            initialChapter={initialChapter}
          />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

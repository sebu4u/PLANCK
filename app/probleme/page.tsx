import { Navigation } from "@/components/navigation"
import ProblemsClient from "@/components/problems-client"
import { Problem } from "@/data/problems"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { generateMetadata } from "@/lib/metadata"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"
import { CatalogMobileTopBanner } from "@/components/catalog/catalog-mobile-top-banner"
import {
  fetchPhysicsCatalogSeoTitles,
  fetchPhysicsCatalogSsrSnapshot,
} from "@/lib/physics-catalog-server"

export const revalidate = 21600

export const metadata: Metadata = generateMetadata('problems')

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ capitol?: string | string[] }>
}) {
  const resolvedSearchParams = await searchParams
  const capitolParam = resolvedSearchParams?.capitol
  const initialChapter = Array.isArray(capitolParam) ? capitolParam[0] : capitolParam

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const serverSupabase = createClient(supabaseUrl, supabaseAnonKey)

  let initialProblems: Problem[] = []
  let catalogTotalCount = 0
  let monthlyFreeSet = new Set<string>()
  let seoTitles: Array<{ id: string; title: string }> = []
  try {
    const [{ problems, totalCount }, freeSet, titles] = await Promise.all([
      fetchPhysicsCatalogSsrSnapshot(serverSupabase),
      getMonthlyFreeProblemSet(serverSupabase),
      fetchPhysicsCatalogSeoTitles(serverSupabase),
    ])
    initialProblems = problems
    catalogTotalCount = totalCount
    monthlyFreeSet = freeSet
    seoTitles = titles
  } catch (e) {
    initialProblems = []
  }

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="h-[100dvh] pt-16 overflow-hidden bg-[#ffffff] relative">
          <StructuredData
            id="structured-data-breadcrumbs"
            data={breadcrumbStructuredData([
              { name: 'Acasă', url: 'https://www.planck.academy/' },
              { name: 'Probleme', url: 'https://www.planck.academy/probleme' },
            ])}
          />
          <StructuredData
            id="structured-data-problems-list"
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: seoTitles.map((p, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                name: p.title,
              }))
            }}
          />
          <ProblemsClient
            initialProblems={initialProblems as any}
            initialCatalogTotalCount={catalogTotalCount}
            initialMonthlyFreeSet={Array.from(monthlyFreeSet)}
            initialChapter={initialChapter}
            topSlot={<CatalogMobileTopBanner />}
          />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

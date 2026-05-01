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
import { ProblemsPwaInstallBanner } from "@/components/problems-pwa-install-banner"

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
  let monthlyFreeSet = new Set<string>()
  try {
    const [{ data }, freeSet] = await Promise.all([
      serverSupabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false }),
      getMonthlyFreeProblemSet(serverSupabase)
    ])
    initialProblems = (data || []) as any
    monthlyFreeSet = freeSet
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
              itemListElement: initialProblems.slice(0, 24).map((p, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                name: p.title,
              }))
            }}
          />
          <ProblemsClient
            initialProblems={initialProblems as any}
            initialMonthlyFreeSet={Array.from(monthlyFreeSet)}
            initialChapter={initialChapter}
            topSlot={<ProblemsPwaInstallBanner />}
          />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

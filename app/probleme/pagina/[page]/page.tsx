import { Navigation } from "@/components/navigation"
import ProblemsClient from "@/components/problems-client"
import { Problem } from "@/data/problems"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation"
import { CatalogMobileTopBanner } from "@/components/catalog/catalog-mobile-top-banner"
import {
  fetchPhysicsCatalogSeoTitles,
  fetchPhysicsCatalogSsrSnapshot,
} from "@/lib/physics-catalog-server"

const PREGENERATED_PAGES = 10

export const revalidate = 21600

export async function generateStaticParams() {
  // Pre-generate first 10 pages
  return Array.from({ length: PREGENERATED_PAGES }, (_, i) => ({ page: String(i + 1) }))
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params
  const pageNum = Number(page) || 1
  return generatePageMetadata('problems', {
    title: `Probleme de fizică - Pagina ${pageNum}`,
    alternates: { canonical: `/probleme/pagina/${pageNum}` },
    openGraph: {
      title: `Probleme de fizică - Pagina ${pageNum}`,
      url: `https://www.planck.academy/probleme/pagina/${pageNum}`,
    }
  })
}

export default async function ProblemsPaginatedPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const pageNum = Math.max(1, Number(page) || 1)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const serverSupabase = createClient(supabaseUrl, supabaseAnonKey)

  let initialProblems: Problem[] = []
  let catalogTotalCount = 0
  let monthlyFreeSet = new Set<string>()
  try {
    const [{ problems, totalCount }, freeSet] = await Promise.all([
      fetchPhysicsCatalogSsrSnapshot(serverSupabase),
      getMonthlyFreeProblemSet(serverSupabase),
    ])
    initialProblems = problems
    catalogTotalCount = totalCount
    monthlyFreeSet = freeSet
  } catch (e) {
    initialProblems = []
  }

  const breadcrumbs = breadcrumbStructuredData([
    { name: 'Acasă', url: 'https://www.planck.academy/' },
    { name: 'Probleme', url: 'https://www.planck.academy/probleme' },
    { name: `Pagina ${pageNum}`, url: `https://www.planck.academy/probleme/pagina/${pageNum}` },
  ])

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="h-[100dvh] pt-16 overflow-hidden bg-[#ffffff] relative">
          <StructuredData data={breadcrumbs} />
          <ProblemsClient
            initialProblems={initialProblems as any}
            initialPage={pageNum}
            initialCatalogTotalCount={catalogTotalCount}
            initialMonthlyFreeSet={Array.from(monthlyFreeSet)}
            topSlot={<CatalogMobileTopBanner />}
          />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

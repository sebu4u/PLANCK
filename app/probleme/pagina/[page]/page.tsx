import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import ProblemsClient from "@/components/problems-client"
import { Problem } from "@/data/problems"
import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { generateMetadata as generatePageMetadata } from "@/lib/metadata"

const PROBLEMS_PER_PAGE = 8
const PREGENERATED_PAGES = 10

export const revalidate = 300

export async function generateStaticParams() {
  // Pre-generate first 10 pages
  return Array.from({ length: PREGENERATED_PAGES }, (_, i) => ({ page: String(i + 1) }))
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params
  const pageNum = Number(page) || 1
  return generatePageMetadata('problems', {
    title: `Catalog probleme - Pagina ${pageNum}`,
    alternates: { canonical: `/probleme/pagina/${pageNum}` },
    openGraph: {
      title: `Catalog probleme - Pagina ${pageNum}`,
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
  try {
    const from = (pageNum - 1) * PROBLEMS_PER_PAGE
    const to = from + PROBLEMS_PER_PAGE - 1
    const { data } = await serverSupabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)
    initialProblems = (data || []) as any
  } catch (e) {
    initialProblems = []
  }

  const breadcrumbs = breadcrumbStructuredData([
    { name: 'Acasă', url: 'https://www.planck.academy/' },
    { name: 'Probleme', url: 'https://www.planck.academy/probleme' },
  ])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-16">
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Catalog de Probleme – Pagina {pageNum}
            </h1>
            <StructuredData data={breadcrumbs} />
          </div>
        </section>
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <ProblemsClient initialProblems={initialProblems as any} initialPage={pageNum} />
        </section>
      </div>
      <Footer />
    </div>
  )
}



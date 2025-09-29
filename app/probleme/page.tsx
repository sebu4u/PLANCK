import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import ProblemsClient from "@/components/problems-client"
import { Problem } from "@/data/problems"
import { createClient } from "@supabase/supabase-js"
import { Atom } from "lucide-react"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"
import { breadcrumbStructuredData } from "@/lib/structured-data"
import { generateMetadata } from "@/lib/metadata"

export const revalidate = 300

export const metadata: Metadata = generateMetadata('problems')

export default async function ProblemsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const serverSupabase = createClient(supabaseUrl, supabaseAnonKey)

  let initialProblems: Problem[] = []
  try {
    const { data } = await serverSupabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false })
    initialProblems = (data || []) as any
  } catch (e) {
    initialProblems = []
  }

  const totalProblems = initialProblems.length
  const freeProblems = totalProblems

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Atom className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Catalog de Probleme
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explorează colecția noastră de probleme de fizică organizate pe categorii și dificultăți
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{freeProblems} probleme gratuite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>{totalProblems} total probleme</span>
              </div>
            </div>
            {/* Structured Data: Breadcrumbs */}
            <StructuredData data={breadcrumbStructuredData([
              { name: 'Acasă', url: 'https://www.planck.academy/' },
              { name: 'Probleme', url: 'https://www.planck.academy/probleme' },
            ])} />
          </div>
        </section>
        {/* Main Content */}
        <section className="py-12 px-4 max-w-7xl mx-auto">
          {/* Structured Data: ItemList for first page problems (names only) */}
          <StructuredData data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: initialProblems.slice(0, 24).map((p, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: p.title,
            }))
          }} />
          <ProblemsClient initialProblems={initialProblems as any} />
        </section>
      </div>
      <Footer />
    </div>
  )
}

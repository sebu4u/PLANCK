import { Navigation } from "@/components/navigation"
import { FizicaLearningMap } from "@/components/invata/fizica-learning-map"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { generateMetadata } from "@/lib/metadata"
import { FIZICA_HUB_CARDS_ENABLED } from "@/lib/invata-fizica-config"
import { fetchFizicaHubCards } from "@/lib/supabase-fizica-simulations"
import {
  fetchFizicaMapPageData,
  isFizicaRouteSlug,
} from "@/lib/supabase-fizica-learning-map"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata("invataFizica")
export const revalidate = 3600

interface InvataFizicaPageProps {
  searchParams: Promise<{ traseu?: string; capitol?: string }>
}

export default async function InvataFizicaPage({ searchParams }: InvataFizicaPageProps) {
  const params = await searchParams
  const routeSlug = isFizicaRouteSlug(params.traseu) ? params.traseu : null
  const chapterSlug = params.capitol?.trim() || null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [hubCards, mapData] = await Promise.all([
    FIZICA_HUB_CARDS_ENABLED ? fetchFizicaHubCards() : Promise.resolve({ preparations: [], nextSimulation: null }),
    fetchFizicaMapPageData({
      routeSlug,
      chapterSlug,
      userId: user?.id ?? null,
    }),
  ])

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
          <FizicaLearningMap hubCards={hubCards} mapData={mapData} />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

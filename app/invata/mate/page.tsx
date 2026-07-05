import { Navigation } from "@/components/navigation"
import { MateLearningMap } from "@/components/invata/mate-learning-map"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { generateMetadata } from "@/lib/metadata"
import { fetchMateMapPageData, isMateRouteSlug } from "@/lib/supabase-mate-learning-map"
import { createClient } from "@/lib/supabase/server"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"
import type { Metadata } from "next"
import { cookies } from "next/headers"

export const metadata: Metadata = generateMetadata("invataMate")
export const dynamic = "force-dynamic"

interface InvataMatePageProps {
  searchParams: Promise<{ traseu?: string; capitol?: string }>
}

export default async function InvataMatePage({ searchParams }: InvataMatePageProps) {
  const params = await searchParams
  const routeSlug = isMateRouteSlug(params.traseu) ? params.traseu : null
  const chapterSlug = params.capitol?.trim() || null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const guestProgressMap = user
    ? undefined
    : parseGuestLearningPathProgress(
        cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value,
      )

  const mapData = await fetchMateMapPageData({
    routeSlug,
    chapterSlug,
    userId: user?.id ?? null,
    progressClient: user ? supabase : null,
    guestProgressMap,
  })

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
          <MateLearningMap mapData={mapData} />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

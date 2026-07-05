import { Navigation } from "@/components/navigation"
import { InfoLearningMap } from "@/components/invata/info-learning-map"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { generateMetadata } from "@/lib/metadata"
import { fetchInfoMapPageData, isInfoRouteSlug } from "@/lib/supabase-info-learning-map"
import { createClient } from "@/lib/supabase/server"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"
import type { Metadata } from "next"
import { cookies } from "next/headers"

export const metadata: Metadata = generateMetadata("invataInfo")
export const dynamic = "force-dynamic"

interface InvataInfoPageProps {
  searchParams: Promise<{ traseu?: string; capitol?: string }>
}

export default async function InvataInfoPage({ searchParams }: InvataInfoPageProps) {
  const params = await searchParams
  const routeSlug = isInfoRouteSlug(params.traseu) ? params.traseu : null
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

  const mapData = await fetchInfoMapPageData({
    routeSlug,
    chapterSlug,
    userId: user?.id ?? null,
    progressClient: user ? supabase : null,
    guestProgressMap,
  })

  return (
    <CatalogThemeProvider catalogType="info">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
          <InfoLearningMap mapData={mapData} />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

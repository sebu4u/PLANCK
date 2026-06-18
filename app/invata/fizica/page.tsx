import { Navigation } from "@/components/navigation"
import { FizicaLearningMap } from "@/components/invata/fizica-learning-map"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { generateMetadata } from "@/lib/metadata"
import { FIZICA_CALENDAR_ENABLED, FIZICA_HUB_CARDS_ENABLED } from "@/lib/invata-fizica-config"
import { fetchFizicaHubCards } from "@/lib/supabase-fizica-simulations"
import {
  fetchFizicaCalendarEventsForRange,
  getFizicaCalendarDefaultRange,
} from "@/lib/supabase-fizica-calendar"
import {
  fetchFizicaMapPageData,
  isFizicaRouteSlug,
} from "@/lib/supabase-fizica-learning-map"
import { createClient } from "@/lib/supabase/server"
import {
  GUEST_LEARNING_PATH_PROGRESS_COOKIE,
  parseGuestLearningPathProgress,
} from "@/lib/guest-learning-path-cookie"
import type { Metadata } from "next"
import { cookies } from "next/headers"

export const metadata: Metadata = generateMetadata("invataFizica")
export const dynamic = "force-dynamic"

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

  const cookieStore = await cookies()
  const guestProgressMap = user
    ? undefined
    : parseGuestLearningPathProgress(
        cookieStore.get(GUEST_LEARNING_PATH_PROGRESS_COOKIE)?.value,
      )

  const calendarRange = getFizicaCalendarDefaultRange()

  const [hubCards, mapData, calendarEvents] = await Promise.all([
    FIZICA_HUB_CARDS_ENABLED ? fetchFizicaHubCards() : Promise.resolve({ preparations: [], nextSimulation: null }),
    fetchFizicaMapPageData({
      routeSlug,
      chapterSlug,
      userId: user?.id ?? null,
      progressClient: user ? supabase : null,
      guestProgressMap,
    }),
    FIZICA_CALENDAR_ENABLED
      ? fetchFizicaCalendarEventsForRange(calendarRange.startDate, calendarRange.endDate)
      : Promise.resolve([]),
  ])

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
          <FizicaLearningMap hubCards={hubCards} mapData={mapData} calendarEvents={calendarEvents} />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

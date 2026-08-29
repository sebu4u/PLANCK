import { Navigation } from "@/components/navigation"
import { ExerseazaHub } from "@/components/exerseaza/exerseaza-hub"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { getAssignmentsForUser } from "@/lib/classrooms/server"
import { fetchExerseazaCountsBySubject } from "@/lib/exerseaza-counts"
import { generateMetadata } from "@/lib/metadata"
import { normalizePracticeSubject } from "@/lib/practice-subject"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata("exerseaza")
export const revalidate = 21600

export default async function ExerseazaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let preferredMaterie: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_materie")
      .eq("user_id", user.id)
      .maybeSingle()
    preferredMaterie = profile?.preferred_materie ?? null
  }

  const [countsBySubject, assignments] = await Promise.all([
    fetchExerseazaCountsBySubject(),
    user ? getAssignmentsForUser(user.id) : Promise.resolve([]),
  ])

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
          <ExerseazaHub
            countsBySubject={countsBySubject}
            initialSubject={normalizePracticeSubject(preferredMaterie)}
            assignments={assignments}
          />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

import { Navigation } from "@/components/navigation"
import { ExerseazaHub } from "@/components/exerseaza/exerseaza-hub"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { fetchExerseazaCounts } from "@/lib/exerseaza-counts"
import { generateMetadata } from "@/lib/metadata"
import type { Metadata } from "next"

export const metadata: Metadata = generateMetadata("exerseaza")
export const revalidate = 21600

export default async function ExerseazaPage() {
  const counts = await fetchExerseazaCounts()

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#ffffff]">
        <Navigation />
        <div className="relative h-[100dvh] overflow-hidden bg-[#ffffff] pt-14 burger:pt-16">
          <ExerseazaHub counts={counts} />
        </div>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

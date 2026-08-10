import { Suspense } from "react"
import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { TesteCatalogClient } from "@/components/teste/teste-catalog-client"
import { generateMetadata as buildMetadata } from "@/lib/metadata"

export const metadata: Metadata = buildMetadata("teste")

export default function TestePage() {
  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#f5f4f2]">
        <Navigation />
        <main className="min-h-[100dvh] pt-14 burger:pt-16">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24 text-[#2c2f33]/60">
                Se încarcă…
              </div>
            }
          >
            <TesteCatalogClient />
          </Suspense>
        </main>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

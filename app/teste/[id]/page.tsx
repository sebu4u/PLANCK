import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { TesteDetailClient } from "@/components/teste/teste-detail-client"
import { pageTitle } from "@/lib/metadata"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params
  return {
    title: pageTitle("Test"),
    alternates: { canonical: `/teste/${id}` },
  }
}

export default async function TesteDetailPage(props: PageProps) {
  const { id: rawId } = await props.params
  const id = decodeURIComponent(rawId ?? "").trim()

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#f5f4f2]">
        <Navigation />
        <main className="min-h-[100dvh] pt-14 burger:pt-16">
          <TesteDetailClient testId={id} />
        </main>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

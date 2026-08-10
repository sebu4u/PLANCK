import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { TesteReviewClient } from "@/components/teste/teste-review-client"
import { pageTitle } from "@/lib/metadata"

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>
}

export const metadata: Metadata = {
  title: pageTitle("Rezultat test"),
  robots: { index: false, follow: false },
}

export default async function TesteReviewPage(props: PageProps) {
  const { id: rawId, attemptId: rawAttemptId } = await props.params
  const id = decodeURIComponent(rawId ?? "").trim()
  const attemptId = decodeURIComponent(rawAttemptId ?? "").trim()

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#f5f4f2]">
        <Navigation />
        <main className="min-h-[100dvh] pt-14 burger:pt-16">
          <TesteReviewClient testId={id} attemptId={attemptId} />
        </main>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

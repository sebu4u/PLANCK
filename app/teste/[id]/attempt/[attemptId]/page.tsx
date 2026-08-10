import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import { TesteAttemptClient } from "@/components/teste/teste-attempt-client"
import { pageTitle } from "@/lib/metadata"

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>
}

export const metadata: Metadata = {
  title: pageTitle("Test în curs"),
  robots: { index: false, follow: false },
}

export default async function TesteAttemptPage(props: PageProps) {
  const { id: rawId, attemptId: rawAttemptId } = await props.params
  const id = decodeURIComponent(rawId ?? "").trim()
  const attemptId = decodeURIComponent(rawAttemptId ?? "").trim()

  return (
    <CatalogThemeProvider catalogType="physics">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#f5f4f2]">
        <Navigation />
        <main className="min-h-[100dvh] pt-14 burger:pt-16">
          <TesteAttemptClient testId={id} attemptId={attemptId} />
        </main>
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}

import { Metadata } from "next"
import { DashboardRedirect } from "@/components/dashboard-redirect"
import { generateMetadata } from "@/lib/metadata"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { HomePageContent } from "@/components/homepage-content"
import { StructuredData } from "@/components/structured-data"
import { homepageFaqStructuredData } from "@/lib/structured-data"

export const metadata: Metadata = generateMetadata('home')

export default function HomePage() {
  return (
    <>
      <StructuredData data={homepageFaqStructuredData} id="homepage-faq" />
      <DashboardRedirect />
      <ScrollAnimationProvider enableSmoothScroll={false}>
        <HomePageContent />
      </ScrollAnimationProvider>
    </>
  )
}

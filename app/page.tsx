import { Metadata } from "next"
import { DashboardRedirect } from "@/components/dashboard-redirect"
import { generateMetadata } from "@/lib/metadata"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { HomePageContent } from "@/components/homepage-content"
import { isMobileDevice } from "@/lib/is-mobile-device"

export const metadata: Metadata = generateMetadata('home')

export default async function HomePage() {
  const isMobile = await isMobileDevice()

  return (
    <>
      <DashboardRedirect />
      <ScrollAnimationProvider>
        <HomePageContent isMobile={isMobile} />
      </ScrollAnimationProvider>
    </>
  )
}

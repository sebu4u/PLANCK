import { Metadata } from "next"
import { DashboardRedirect } from "@/components/dashboard-redirect"
import { generateMetadata } from "@/lib/metadata"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { HomePageContent } from "@/components/homepage-content"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = generateMetadata('home')

export default function HomePage() {
  return (
    <>
      <Navigation />
      <ScrollAnimationProvider>
        <DashboardRedirect />
        <HomePageContent />
      </ScrollAnimationProvider>
    </>
  )
}

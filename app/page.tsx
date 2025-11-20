import { Metadata } from "next"
import { DashboardRedirect } from "@/components/dashboard-redirect"
import { generateMetadata } from "@/lib/metadata"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"
import { HomePageContent } from "@/components/homepage-content"

export const metadata: Metadata = generateMetadata('home')

export default function HomePage() {
  return (
    <ScrollAnimationProvider>
      <DashboardRedirect />
      <HomePageContent />
    </ScrollAnimationProvider>
  )
}

"use client"


import { Footer } from "@/components/footer"
import { ProgressNotification } from "@/components/progress-notification"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CardSwap, { Card } from "@/components/CardSwap"
import ScrollingMarquee from "@/components/scrolling-marquee"
import FeatureShowcaseSection from "@/components/feature-showcase-section"
import ThreePanelSection from "@/components/three-panel-section"
import InteractiveFeaturesSection from "@/components/interactive-features-section"
import InsightCTAHomepage from "@/components/insight-cta-homepage"
import { GlassImageCard } from "@/components/glass-image-card"
import RealTimeGraphicsSection from "@/components/realtime-graphics-section"
import InsightPricingSection from "@/components/insight-pricing-section"
import FinalCTASection from "@/components/final-cta-section"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { ScrollToTopButton } from "@/components/scroll-to-top-button"
import { HomePageHeroRedesign } from "@/components/homepage-hero-redesign"
import { VideoCardsSection } from "@/components/video-cards-section"
import { AIDemoSection } from "@/components/ai-demo-section"
import { AICodeAnalysisSection } from "@/components/ai-code-analysis-section"
import { NewWayToLearnSection } from "@/components/new-way-to-learn-section"
import { CoursesSectionHomepage } from "@/components/courses-section-homepage"

import { ReviewsSection } from "@/components/homepage-reviews"
import { FAQSection } from "@/components/faq-section"
import { ConcursBanner } from "@/components/concurs-banner"

// Lazy load heavy Three.js components to reduce initial bundle size

const ColorBends = dynamic(() => import("@/components/ColorBends").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => null, // Don't show loading state for background animation
})

const HowItWorksSection = dynamic(() => import("@/components/how-it-works-section"))

export function HomePageContent({ isMobile = false }: { isMobile?: boolean }) {
  const { user, loading } = useAuth()

  // Don't render homepage content if user is logged in or still loading
  // This prevents the homepage flash before redirect
  if (loading || user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden" style={{ overscrollBehavior: 'none' }}>
      {/* Hero Section cu temă spațială */}
      <HomePageHeroRedesign isMobile={isMobile} />

      {/* Concurs Banner */}
      <ConcursBanner />

      {/* Video Cards Section */}
      <VideoCardsSection />

      {/* AI Demo Section */}
      <AIDemoSection />

      {/* Courses Section */}
      <CoursesSectionHomepage />

      {/* Reviews Section */}
      <ReviewsSection />

      {/* FAQ Section */}
      <FAQSection />



      {/* Footer */}
      <Footer backgroundColor="bg-[#111111]" borderColor="border-white/10" />

      {/* Progress Notification */}
      <ProgressNotification />

      <ScrollToTopButton />
    </div>
  )
}


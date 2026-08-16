"use client"

import { HomePageNavbar } from "@/components/homepage-navbar"
import { Footer } from "@/components/footer"
import { FomoBanner } from "@/components/landing/fomo-banner"
import { LandingHeroSection } from "@/components/landing/hero-section"
import { LandingSocialProofSection } from "@/components/landing/social-proof-section"
import { LandingProblemSection } from "@/components/landing/problem-section"
import { LandingSolutionSection } from "@/components/landing/solution-section"
import { LandingLiveTutoringSection } from "@/components/landing/live-tutoring-section"
import { LandingInsightSection } from "@/components/landing/insight-section"
import { LandingPlanckCodeSection } from "@/components/landing/planck-code-section"
import { LandingPlanckPassSection } from "@/components/landing/planckpass-section"
import { LandingFounderSection } from "@/components/landing/founder-section"
import { LandingTestimonialsSection } from "@/components/landing/testimonials-section"
import { LandingPricingSection } from "@/components/landing/pricing-section"
import { LandingFaqSection } from "@/components/landing/faq-section"
import { LandingFinalCtaSection } from "@/components/landing/final-cta-section"
import { LandingStickyMobileCta } from "@/components/landing/sticky-mobile-cta"
import { useCountdown } from "@/lib/landing-campaign"

export function LandingPageContent() {
  const countdown = useCountdown()

  return (
    <div className="relative min-h-screen bg-white pb-16 sm:pb-0">
      <FomoBanner days={countdown.days} />
      <div className="relative">
        <HomePageNavbar variant="light" />
        <LandingHeroSection />
      </div>
      <LandingSocialProofSection />
      <LandingProblemSection />
      <LandingSolutionSection />
      <LandingLiveTutoringSection />
      <LandingInsightSection />
      <LandingPlanckCodeSection />
      <LandingPlanckPassSection />
      <LandingFounderSection />
      <LandingTestimonialsSection />
      <LandingPricingSection countdown={countdown} />
      <LandingFaqSection />
      <LandingFinalCtaSection countdown={countdown} />
      <Footer
        theme="light"
        backgroundColor="bg-[#F8F7FF]"
        borderColor="border-gray-200"
      />
      <LandingStickyMobileCta />
    </div>
  )
}

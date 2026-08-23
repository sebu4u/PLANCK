"use client"

import { HomePageNavbar } from "@/components/homepage-navbar"
import { Footer } from "@/components/footer"
import { LandingHeroSection } from "@/components/landing/hero-section"
import { LandingSocialProofSection } from "@/components/landing/social-proof-section"
import { LandingSubjectsPickerSection } from "@/components/landing/subjects-picker-section"
import { LandingHowItWorksSection } from "@/components/landing/how-it-works-section"
import { LandingWorkshopsCalendarSection } from "@/components/landing/workshops-calendar-section"
import { LandingTeachersSection } from "@/components/landing/teachers-section"
import { LandingDemoVideoSection } from "@/components/landing/demo-video-section"
import { LandingPlanckPassSection } from "@/components/landing/planckpass-section"
import { LandingFounderSection } from "@/components/landing/founder-section"
import { LandingTestimonialsSection } from "@/components/landing/testimonials-section"
import { LandingPricingSection } from "@/components/landing/pricing-section"
import { LandingFaqSection } from "@/components/landing/faq-section"
import { LandingFinalCtaSection } from "@/components/landing/final-cta-section"
import { LandingStickyMobileCta } from "@/components/landing/sticky-mobile-cta"
import { LandingCtaIrisScope } from "@/components/landing/iris-transition"
import { useCountdown } from "@/lib/landing-campaign"

export function LandingPageContent() {
  const countdown = useCountdown()

  return (
    <LandingCtaIrisScope>
    <div className="relative min-h-screen overflow-x-hidden bg-white pb-16 sm:pb-0">
      <div className="relative bg-[#ffffff]">
        <HomePageNavbar variant="light" />
        <LandingHeroSection />
      </div>
      <LandingSocialProofSection />
      <LandingSubjectsPickerSection />
      <LandingDemoVideoSection />
      <LandingHowItWorksSection />
      <LandingWorkshopsCalendarSection />
      <LandingTeachersSection />
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
    </LandingCtaIrisScope>
  )
}

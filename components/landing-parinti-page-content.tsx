"use client"

import { HomePageNavbar } from "@/components/homepage-navbar"
import { Footer } from "@/components/footer"
import { ParentFomoBanner } from "@/components/landing-parinti/fomo-banner"
import { ParentHeroSection } from "@/components/landing-parinti/hero-section"
import { ParentSocialProofSection } from "@/components/landing-parinti/social-proof-section"
import { ParentSavingsSection } from "@/components/landing-parinti/savings-section"
import { ParentSubjectsPickerSection } from "@/components/landing-parinti/subjects-picker-section"
import { ParentHowItWorksSection } from "@/components/landing-parinti/how-it-works-section"
import { ParentWorkshopsCalendarSection } from "@/components/landing-parinti/workshops-calendar-section"
import { ParentTeachersSection } from "@/components/landing-parinti/teachers-section"
import { ParentDemoVideoSection } from "@/components/landing-parinti/demo-video-section"
import { ParentPlanckPassSection } from "@/components/landing-parinti/planckpass-section"
import { ParentFounderSection } from "@/components/landing-parinti/founder-section"
import { ParentTestimonialsSection } from "@/components/landing-parinti/testimonials-section"
import { ParentPricingSection } from "@/components/landing-parinti/pricing-section"
import { ParentFaqSection } from "@/components/landing-parinti/faq-section"
import { ParentFinalCtaSection } from "@/components/landing-parinti/final-cta-section"
import { ParentStickyMobileCta } from "@/components/landing-parinti/sticky-mobile-cta"
import { useCountdown } from "@/lib/landing-campaign"

export function LandingParintiPageContent() {
  const countdown = useCountdown()

  return (
    <div className="relative min-h-screen bg-white pb-16 sm:pb-0">
      <ParentFomoBanner days={countdown.days} />
      <div className="relative bg-[#ffffff]">
        <HomePageNavbar variant="light" />
        <ParentHeroSection />
      </div>
      <ParentSocialProofSection />
      <ParentSavingsSection />
      <ParentSubjectsPickerSection />
      <ParentHowItWorksSection />
      <ParentWorkshopsCalendarSection />
      <ParentTeachersSection />
      <ParentDemoVideoSection />
      <ParentPlanckPassSection />
      <ParentFounderSection />
      <ParentTestimonialsSection />
      <ParentPricingSection countdown={countdown} />
      <ParentFaqSection />
      <ParentFinalCtaSection countdown={countdown} />
      <Footer
        theme="light"
        backgroundColor="bg-[#F8F7FF]"
        borderColor="border-gray-200"
      />
      <ParentStickyMobileCta />
    </div>
  )
}

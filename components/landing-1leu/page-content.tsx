"use client"

import { HomePageNavbar } from "@/components/homepage-navbar"
import { Footer } from "@/components/footer"
import { LandingCtaIrisScope } from "@/components/landing/iris-transition"
import { LandingSocialProofSection } from "@/components/landing/social-proof-section"
import { LandingDemoVideoSection } from "@/components/landing/demo-video-section"
import { LandingHeroTestimonialsRow } from "@/components/landing/hero-review-rows"
import { Landing1LeuHeroSection } from "@/components/landing-1leu/hero-section"
import { Landing1LeuRulesSection } from "@/components/landing-1leu/rules-section"
import { Landing1LeuPrizeSection } from "@/components/landing-1leu/prize-section"
import { Landing1LeuFaqSection } from "@/components/landing-1leu/faq-section"
import { Landing1LeuFinalCtaSection } from "@/components/landing-1leu/final-cta-section"
import { Landing1LeuStickyMobileCta } from "@/components/landing-1leu/sticky-mobile-cta"
import { Landing1LeuMariaTestimonialSection } from "@/components/landing-1leu/maria-testimonial-section"

export function Landing1LeuPageContent() {
  return (
    <LandingCtaIrisScope>
      <div className="relative min-h-screen overflow-x-hidden bg-white pb-16 sm:pb-0">
        <div className="relative bg-transparent">
          <HomePageNavbar variant="light" />
          <Landing1LeuHeroSection />
        </div>
        <LandingHeroTestimonialsRow />
        <Landing1LeuRulesSection />
        <Landing1LeuPrizeSection />
        <LandingSocialProofSection />
        <LandingDemoVideoSection renderCta={() => null} />
        <Landing1LeuMariaTestimonialSection />
        <Landing1LeuFaqSection />
        <Landing1LeuFinalCtaSection />
        <Footer theme="light" backgroundColor="bg-[#F8F7FF]" borderColor="border-gray-200" />
        <Landing1LeuStickyMobileCta />
      </div>
    </LandingCtaIrisScope>
  )
}

import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import InsightScrollHero from "@/components/insight-scroll-hero"
import InsightBenefitsSection from "@/components/insight-benefits-section"
import InsightTestimonialsSection from "@/components/insight-testimonials-section"
import InsightThinkingSection from "@/components/insight-thinking-section"
import InsightReviewsCarousel from "@/components/insight-reviews-carousel"
import InsightPricingSection from "@/components/insight-pricing-section"
import InsightCTASection from "@/components/insight-cta-section"
import { generateMetadata } from "@/lib/metadata"
import ScrollAnimationProvider from "@/components/scroll-animation-provider"

export const metadata: Metadata = generateMetadata('insight')

export default function InsightPage() {
  return (
    <ScrollAnimationProvider>
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <Navigation />

        <InsightScrollHero />
        
        <InsightBenefitsSection />
        
        <InsightTestimonialsSection />
        
        <InsightThinkingSection />
        
        <InsightReviewsCarousel />
        
        <InsightPricingSection />
        
        <InsightCTASection />

        <Footer />
      </div>
    </ScrollAnimationProvider>
  )
}

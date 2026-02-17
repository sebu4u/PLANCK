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
import { Suspense, useEffect, useState } from "react"
import { createPortal } from "react-dom"
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

const HOME_SECTION_IDS = [
  "home-hero",
  "home-concurs",
  "home-video",
  "home-ai-demo",
  "home-courses",
  "home-reviews",
  "home-faq",
]

function HomeSectionIndicator() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isDarkBackground, setIsDarkBackground] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const elements = HOME_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionIndex = HOME_SECTION_IDS.indexOf(entry.target.id)
          if (sectionIndex !== -1) setActiveIndex(sectionIndex)
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const parseColor = (color: string): [number, number, number] | null => {
      const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      if (!rgbMatch) return null
      return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    }

    const findOpaqueBackground = (start: Element | null): [number, number, number] | null => {
      let node: Element | null = start
      while (node) {
        const style = window.getComputedStyle(node)
        const alpha = Number.parseFloat(style.backgroundColor.split(",")[3] ?? "1")
        if (style.backgroundColor !== "transparent" && !Number.isNaN(alpha) && alpha > 0) {
          const parsed = parseColor(style.backgroundColor)
          if (parsed) return parsed
        }
        node = node.parentElement
      }
      const bodyColor = parseColor(window.getComputedStyle(document.body).backgroundColor)
      return bodyColor ?? [255, 255, 255]
    }

    const evaluateBackground = () => {
      const sampleX = Math.max(window.innerWidth - 20, 0)
      const sampleY = Math.floor(window.innerHeight / 2)
      const elAtPoint = document.elementFromPoint(sampleX, sampleY)
      const rgb = findOpaqueBackground(elAtPoint)
      if (!rgb) return

      const [r, g, b] = rgb
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      setIsDarkBackground(luminance < 145)
    }

    evaluateBackground()

    let rafId = 0
    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(evaluateBackground)
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-[90] hidden lg:flex flex-col gap-3 py-4 items-end pointer-events-none"
      aria-label="Secțiuni homepage"
    >
      {HOME_SECTION_IDS.map((_, index) => (
        <div
          key={index}
          className={`h-0.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,0,0,0.22)] ${
            index === activeIndex
              ? isDarkBackground
                ? "w-8 bg-white"
                : "w-8 bg-zinc-900"
              : isDarkBackground
                ? "w-2 bg-zinc-600"
                : "w-2 bg-zinc-300"
          }`}
        />
      ))}
    </div>,
    document.body
  )
}

export function HomePageContent({ isMobile = false }: { isMobile?: boolean }) {
  const { user, loading } = useAuth()

  // Don't render homepage content if user is logged in or still loading
  // This prevents the homepage flash before redirect
  if (loading || user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <HomeSectionIndicator />

      {/* Hero Section cu temă spațială */}
      <section id="home-hero">
        <HomePageHeroRedesign isMobile={isMobile} />
      </section>

      {/* Concurs Banner */}
      <section id="home-concurs">
        <ConcursBanner />
      </section>

      {/* Video Cards Section */}
      <section id="home-video">
        <VideoCardsSection />
      </section>

      {/* AI Demo Section */}
      <section id="home-ai-demo">
        <AIDemoSection />
      </section>

      {/* Courses Section */}
      <section id="home-courses">
        <CoursesSectionHomepage />
      </section>

      {/* Reviews Section */}
      <section id="home-reviews">
        <ReviewsSection />
      </section>

      {/* FAQ Section */}
      <section id="home-faq">
        <FAQSection />
      </section>



      {/* Footer */}
      <Footer backgroundColor="bg-[#111111]" borderColor="border-white/10" />

      {/* Progress Notification */}
      <ProgressNotification />

      <ScrollToTopButton />
    </div>
  )
}


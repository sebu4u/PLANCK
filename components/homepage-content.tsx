"use client"

import { Navigation } from "@/components/navigation"
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

// Lazy load heavy Three.js components to reduce initial bundle size
const BlackHoleAnimation = dynamic(() => import("@/components/black-hole-animation").then((mod) => ({ default: mod.BlackHoleAnimation })), {
  ssr: false,
  loading: () => null, // Don't show loading state for background animation
})

const ColorBends = dynamic(() => import("@/components/ColorBends").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => null, // Don't show loading state for background animation
})

const HowItWorksSection = dynamic(() => import("@/components/how-it-works-section"))

export function HomePageContent() {
  const { user, loading } = useAuth()

  // Don't render homepage content if user is logged in or still loading
  // This prevents the homepage flash before redirect
  if (loading || user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navigation />

      {/* Hero Section cu temă spațială */}
      <section id="hero-section" className="relative h-screen-mobile flex items-center overflow-hidden cosmic-bg">
        <div className="cosmic-particles"></div>
        <BlackHoleAnimation />
        <div className="absolute inset-0 flex items-center z-10">
          <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-center items-center lg:pt-0 pt-12">
            {/* Content container - centered on mobile, left-aligned on desktop */}
            <div className="max-w-2xl lg:max-w-2xl text-center lg:text-left mx-auto lg:mx-0 w-full">
              <h1 className="scroll-animate-fade-up text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                Where human curiosity
                <span className="block">meets intelligent learning.</span>
              </h1>
              <p className="scroll-animate-fade-up animate-delay-200 text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                Înveți fizică și informatică cu AI, exerciții interactive și progres salvat.
              </p>

              {/* Action buttons */}
              <div className="scroll-animate-fade-up animate-delay-400 flex flex-row gap-4 justify-center items-center lg:justify-start lg:items-start">
                <Link href="/probleme" className="flex justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                  >
                    Rezolvă o problemă
                  </Button>
                </Link>
                <Link href="/insight/chat" className="group relative inline-flex">
                  {/* Glow effect on hover - behind everything */}
                  <span className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-purple-400/60 to-blue-400/60 -z-20 pointer-events-none"></span>

                  {/* Gradient border wrapper - creates the border effect */}
                  <span className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 pointer-events-none"></span>
                  <span className="absolute inset-[1px] rounded-md bg-transparent group-hover:bg-transparent -z-10 pointer-events-none"></span>

                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:border-transparent transition-all duration-300 flex items-center gap-2 bg-transparent relative z-10"
                  >
                    {/* Gradient text on hover */}
                    <span className="relative z-10 bg-gradient-to-r from-white to-white group-hover:from-purple-400 group-hover:to-blue-400 bg-clip-text group-hover:text-transparent transition-all duration-300">
                      Învață cu AI
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Animated cards - hidden on mobile, visible on desktop */}
            <div className="hidden lg:flex justify-center items-center lg:mt-0">
              <div className="relative lg:static w-full flex justify-center">
                <CardSwap
                  width={"clamp(300px, 24vw, 500px)"}
                  height={"clamp(240px, 18vw, 400px)"}
                  cardDistance={40}
                  verticalDistance={50}
                  delay={5000}
                  pauseOnHover={false}
                  offsetY={60}
                >
                  <Card className="flex flex-col justify-between text-left p-6">
                    <div>
                      <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white mb-3">Full Learning</div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-3"></div>
                      <div className="text-xs md:text-sm xl:text-base text-gray-200 leading-relaxed">Peste 500 de probleme video și lecții complete din toată materia de liceu, explicate pas cu pas.</div>
                    </div>
                    <div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-4"></div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-600/80 text-white text-xs rounded-full">500+ Probleme</span>
                        <span className="px-3 py-1 bg-pink-600/80 text-white text-xs rounded-full">Video</span>
                        <span className="px-3 py-1 bg-purple-500/80 text-white text-xs rounded-full">Lecții Complete</span>
                      </div>
                    </div>
                  </Card>
                  <Card className="flex flex-col justify-between text-left p-6">
                    <div>
                      <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white mb-3">Smart Coding</div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-3"></div>
                      <div className="text-xs md:text-sm xl:text-base text-gray-200 leading-relaxed">Descoperă Planck Code, IDE-ul cu AI integrat care te ajută să înveți și să înțelegi informatica direct din browser.</div>
                    </div>
                    <div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-4"></div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-600/80 text-white text-xs rounded-full">AI-Powered</span>
                        <span className="px-3 py-1 bg-indigo-600/80 text-white text-xs rounded-full">Browser IDE</span>
                        <span className="px-3 py-1 bg-blue-500/80 text-white text-xs rounded-full">Informatică</span>
                      </div>
                    </div>
                  </Card>
                  <Card className="flex flex-col justify-between text-left p-6">
                    <div>
                      <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white mb-3">Always Insight</div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-3"></div>
                      <div className="text-xs md:text-sm xl:text-base text-gray-200 leading-relaxed">Asistentul AI Insight este mereu gata să te ajute instant la fizică sau informatică.</div>
                    </div>
                    <div>
                      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-4"></div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-600/80 text-white text-xs rounded-full">24/7</span>
                        <span className="px-3 py-1 bg-emerald-600/80 text-white text-xs rounded-full">AI Assistant</span>
                        <span className="px-3 py-1 bg-green-500/80 text-white text-xs rounded-full">Instant Help</span>
                      </div>
                    </div>
                  </Card>
                </CardSwap>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce-delayed">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center cosmic-glow">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Marquee Section */}
      <ScrollingMarquee
        items={[
          "500+ Video Lessons",
          "AI-Powered Learning",
          "24/7 Instant Help",
          "Master Physics & Computer Science",
          "Interactive Problem Solving",
          "Smart Learning Platform",
          "Personalized Study Paths",
          "Join Thousands of Students"
        ]}
        speed={25}
      />

      {/* Feature Showcase Section - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <FeatureShowcaseSection />
      </Suspense>

      {/* Three Panel Section - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <ThreePanelSection />
      </Suspense>

      {/* Interactive Features Section - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <InteractiveFeaturesSection />
      </Suspense>

      {/* Insight CTA Section - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <InsightCTAHomepage />
      </Suspense>

      {/* How It Works Section */}
      <Suspense fallback={<div className="h-96 bg-[#0d1117]" />}>
        <HowItWorksSection />
      </Suspense>

      {/* ColorBends Background Section */}
      <section className="relative min-h-auto sm:min-h-auto lg:min-h-[130vh] xl:min-h-[110vh] 2xl:min-h-screen w-full overflow-hidden bg-black">
        {/* Fade overlay at the top for seamless transition */}
        <div className="absolute top-0 left-0 right-0 h-32 sm:h-48 md:h-64 lg:h-80 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #050505 0%, rgba(5, 5, 5, 0.8) 30%, rgba(5, 5, 5, 0.4) 60%, transparent 100%)'
          }}
        />
        {/* ColorBends background - only in upper part */}
        <div className="absolute top-0 left-0 right-0 h-screen-mobile w-full z-0">
          <ColorBends
            colors={["#0000ff", "#00ff00", "#ff0000"]}
            rotation={0}
            autoRotate={0}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={0}
            parallax={0}
            noise={0.1}
            transparent
          />
        </div>
        {/* Fade overlay at the bottom for seamless transition to black - positioned at end of ColorBends */}
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none"
          style={{
            top: 'calc(100vh - 8rem)',
            height: '8rem',
            background: 'linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.95) 35%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.4) 80%, rgba(0, 0, 0, 0.1) 95%, transparent 100%)'
          }}
        />
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none hidden sm:block"
          style={{
            top: 'calc(100vh - 12rem)',
            height: '12rem',
            background: 'linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.95) 35%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.4) 80%, rgba(0, 0, 0, 0.1) 95%, transparent 100%)'
          }}
        />
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none hidden md:block"
          style={{
            top: 'calc(100vh - 16rem)',
            height: '16rem',
            background: 'linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.95) 35%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.4) 80%, rgba(0, 0, 0, 0.1) 95%, transparent 100%)'
          }}
        />
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none hidden lg:block"
          style={{
            top: 'calc(100vh - 20rem)',
            height: '20rem',
            background: 'linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.95) 35%, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0.4) 80%, rgba(0, 0, 0, 0.1) 95%, transparent 100%)'
          }}
        />
        {/* Black background for bottom section */}
        <div className="absolute bottom-0 left-0 right-0 h-[15vh] sm:h-[20vh] lg:h-[36vh] xl:h-[28vh] 2xl:h-[22vh] bg-black z-0"></div>
        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 text-center pt-12 sm:pt-18 md:pt-24 lg:pt-32 pb-6 sm:pb-10 lg:pb-16">
          {/* Title */}
          <h2 className="scroll-animate-fade-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            Sketch your ideas to <span className="text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.8),0_0_40px_rgba(59,130,246,0.6),0_0_60px_rgba(59,130,246,0.4)]">life</span>
          </h2>
          {/* Subtitle */}
          <p className="scroll-animate-fade-up animate-delay-200 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-12 sm:mb-16">
            Tabla interactivă inteligentă pentru scris, desen și reprezentări matematice dinamice
          </p>
          {/* Image Card */}
          <div className="scroll-animate-fade-up animate-delay-400 mt-8 sm:mt-12">
            <GlassImageCard
              imageUrl="/sketch-image.jpg"
              alt="Sketch Demo"
            />
          </div>
        </div>
      </section>

      {/* RealTime Graphics Section - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-black" />}>
        <RealTimeGraphicsSection />
      </Suspense>

      {/* PlanckCode Hero Section */}
      <section className="relative flex items-center justify-center sm:justify-start overflow-hidden min-h-screen bg-[#0d0d0d]">
        {/* Image Background */}
        <img
          src="/images/planckcode-background.jpg"
          alt="PlanckCode background"
          className="absolute inset-0 h-full w-full object-cover z-0"
        />

        {/* Gradient overlay for glass effect */}
        <div
          className="absolute inset-0 z-5 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(59, 130, 246, 0.08) 100%)'
          }}
        />

        {/* Gradient transition overlay at the top */}
        <div
          className="absolute top-0 left-0 right-0 h-32 sm:h-48 md:h-64 lg:h-80 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #000000 0%, rgba(0, 0, 0, 0.8) 30%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)'
          }}
        />

        {/* Gradient transition overlay at the bottom - to pricing section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 sm:h-48 md:h-64 lg:h-80 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0.8) 30%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)'
          }}
        />

        {/* Content */}
        <div className="relative z-20 max-w-4xl px-4 sm:px-6 md:px-10 mt-12 sm:mt-16 md:mt-20 mx-auto sm:mx-0 sm:ml-8 md:ml-16 lg:ml-24 xl:ml-32 text-center sm:text-left">
          <h1 className="scroll-animate-fade-up font-vt323 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            <span className="block">Code smarter. Learn faster.</span>
            <span className="block">That's PlanckCode.</span>
          </h1>

          <p className="scroll-animate-fade-up animate-delay-200 font-vt323 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl sm:max-w-none mx-auto sm:mx-0">
            IDE online integrat + Online Judge care evaluează automat soluțiile + cursuri clare de C++ pentru liceeni. Totul într-un singur loc, proiectat pentru învățare rapidă și competiții.
          </p>

          {/* CTA Buttons */}
          <div className="scroll-animate-fade-up animate-delay-400 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:justify-start">
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-gray-200 transition-all duration-300 font-vt323 text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
            >
              <Link href="/planckcode/ide">
                Începe gratuit
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent border-white text-white hover:bg-white hover:text-black transition-all duration-300 font-vt323 text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
            >
              <Link href="/planckcode/learn">
                Vezi cursurile de C++
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <InsightPricingSection variant="homepage" />
      </Suspense>

      {/* Final CTA Section with Newsletter - lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-white" />}>
        <FinalCTASection />
      </Suspense>

      {/* Footer */}
      <Footer />

      {/* Progress Notification */}
      <ProgressNotification />

      <ScrollToTopButton />
    </div>
  )
}


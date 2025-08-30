import { Metadata } from "next"
import { BlackHoleAnimation } from "@/components/black-hole-animation"
import { Navigation } from "@/components/navigation"
import { AboutPlanckSection } from "@/components/about-planck-section"
import { BenefitsSection } from "@/components/benefits-section"
import { ContentExampleSection } from "@/components/content-example-section"
import { CoursesSection } from "@/components/courses-section"
import { NewsletterSection } from "@/components/newsletter-section"
import { Footer } from "@/components/footer"
import { generateMetadata } from "@/lib/metadata"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = generateMetadata('home')

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      {/* Hero Section cu temă spațială - MODIFICĂRI PENTRU MOBIL */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden cosmic-bg">
        <div className="cosmic-particles"></div>
        <BlackHoleAnimation />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {/* Container pentru text și buton - modificat pentru mobil */}
          <div className="flex flex-col items-center justify-center md:justify-center">
            <h1 className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] xl:text-[15rem] font-black text-white title-font mb-4 sm:mb-8 animate-scale-in text-center cosmic-text-glow">
              PLANCK
            </h1>
            <div className="w-16 sm:w-24 md:w-32 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mb-4 sm:mb-8 animate-expand cosmic-glow"></div>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 text-center max-w-3xl px-4 animate-fade-in-up-delay leading-relaxed">
              Explorează universul fizicii prin cursuri interactive și probleme captivante
            </p>
            
            {/* Buton CTA doar pentru mobil */}
            <div className="block md:hidden mt-8 animate-fade-in-up-delay">
              <Link href="/probleme">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 cosmic-glow shadow-lg hover:shadow-xl"
                >
                  Începe acum
                </Button>
              </Link>
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

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Content Example Section */}
      <ContentExampleSection />

      {/* About PLANCK Section - CU ANIMAȚII LA SCROLL */}
      <div className="scroll-animate-fade-up relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Moving stars */}
          <div className="absolute top-10 left-20 w-1 h-1 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
          <div
            className="absolute top-32 right-32 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 left-40 w-1 h-1 bg-purple-300 rounded-full opacity-70 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-60 right-60 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-40 animate-pulse"
            style={{ animationDelay: "3s" }}
          ></div>
          <div
            className="absolute bottom-20 right-20 w-1 h-1 bg-purple-500 rounded-full opacity-50 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>

          {/* Floating particles with movement */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 rounded-full opacity-40 animate-float"></div>
          <div
            className="absolute top-40 right-20 w-3 h-3 bg-pink-300 rounded-full opacity-30 animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-50 animate-float"
            style={{ animationDelay: "4s" }}
          ></div>
          <div
            className="absolute top-60 right-1/3 w-2.5 h-2.5 bg-pink-400 rounded-full opacity-35 animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-60 left-1/3 w-2 h-2 bg-purple-200 rounded-full opacity-45 animate-float"
            style={{ animationDelay: "3s" }}
          ></div>

          {/* Orbiting particles */}
          <div className="absolute top-1/4 left-1/4 w-20 h-20">
            <div
              className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60 animate-orbit"
              style={{ animationDuration: "15s" }}
            ></div>
          </div>
          <div className="absolute bottom-1/3 right-1/3 w-16 h-16">
            <div
              className="absolute w-1 h-1 bg-pink-400 rounded-full opacity-50 animate-orbit"
              style={{ animationDuration: "20s", animationDelay: "2s" }}
            ></div>
          </div>

          {/* Gradient orbs with enhanced animation */}
          <div
            className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-20 animate-pulse-scale"
            style={{ animationDelay: "3s" }}
          ></div>
          <div
            className="absolute bottom-20 left-16 w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full opacity-25 animate-pulse-scale"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute top-1/2 right-10 w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full opacity-30 animate-pulse-scale"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Moving light streaks */}
          <div
            className="absolute top-0 left-1/2 w-px h-20 bg-gradient-to-b from-purple-200 to-transparent opacity-30 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-0 right-1/3 w-px h-16 bg-gradient-to-t from-pink-200 to-transparent opacity-25 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/3 left-0 h-px w-12 bg-gradient-to-r from-transparent to-purple-200 opacity-20 animate-pulse"
            style={{ animationDelay: "3s" }}
          ></div>

          {/* Subtle geometric shapes */}
          <div
            className="absolute top-32 left-1/3 w-16 h-16 border border-purple-200 rounded-lg opacity-20 rotate-12 animate-float"
            style={{ animationDelay: "2.5s" }}
          ></div>
          <div
            className="absolute bottom-40 right-1/4 w-12 h-12 border border-pink-200 rounded-full opacity-25 animate-float"
            style={{ animationDelay: "3.5s" }}
          ></div>
          {/* Diagonal colored lines */}
          <div
            className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-purple-300 via-pink-300 to-transparent opacity-40 rotate-12 animate-pulse"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-0 right-1/4 w-px h-28 bg-gradient-to-t from-pink-400 via-purple-400 to-transparent opacity-35 -rotate-12 animate-pulse"
            style={{ animationDelay: "2.5s" }}
          ></div>
          <div
            className="absolute top-1/3 right-0 h-px w-24 bg-gradient-to-l from-purple-300 via-pink-300 to-transparent opacity-30 rotate-45 animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Curved aesthetic lines */}
          <div
            className="absolute top-20 left-0 w-40 h-40 border border-purple-200 rounded-full opacity-15 animate-pulse-scale"
            style={{ animationDelay: "3s" }}
          ></div>
          <div
            className="absolute bottom-20 right-0 w-32 h-32 border border-pink-200 rounded-full opacity-20 animate-pulse-scale"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Additional floating elements */}
          <div
            className="absolute top-1/4 right-1/2 w-4 h-4 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-25 animate-float"
            style={{ animationDelay: "5s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full opacity-30 animate-float"
            style={{ animationDelay: "6s" }}
          ></div>

          {/* Hexagonal shapes */}
          <div
            className="absolute top-40 left-1/2 w-8 h-8 border border-purple-300 opacity-20 animate-float"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              animationDelay: "2s",
            }}
          ></div>
          <div
            className="absolute bottom-1/3 right-1/2 w-6 h-6 border border-pink-300 opacity-25 animate-float"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              animationDelay: "4.5s",
            }}
          ></div>

          {/* Connecting lines between elements */}
          <div
            className="absolute top-1/2 left-1/4 w-16 h-px bg-gradient-to-r from-purple-200 to-pink-200 opacity-20 animate-pulse"
            style={{ animationDelay: "3.5s" }}
          ></div>
          <div
            className="absolute top-3/4 right-1/3 w-12 h-px bg-gradient-to-r from-pink-200 to-purple-200 opacity-25 animate-pulse"
            style={{ animationDelay: "5.5s" }}
          ></div>

          {/* Additional stars with different sizes */}
          <div
            className="absolute top-16 left-1/3 w-0.5 h-0.5 bg-purple-500 rounded-full opacity-80 animate-pulse"
            style={{ animationDelay: "0.8s" }}
          ></div>
          <div
            className="absolute top-80 right-1/4 w-0.5 h-0.5 bg-pink-500 rounded-full opacity-70 animate-pulse"
            style={{ animationDelay: "1.8s" }}
          ></div>
          <div
            className="absolute bottom-16 left-1/5 w-0.5 h-0.5 bg-purple-400 rounded-full opacity-60 animate-pulse"
            style={{ animationDelay: "2.8s" }}
          ></div>

          {/* Glowing dots */}
          <div
            className="absolute top-1/3 left-1/5 w-2 h-2 bg-purple-400 rounded-full opacity-40 animate-pulse"
            style={{
              boxShadow: "0 0 8px rgba(147, 51, 234, 0.5)",
              animationDelay: "1.2s",
            }}
          ></div>
          <div
            className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-pink-400 rounded-full opacity-40 animate-pulse"
            style={{
              boxShadow: "0 0 8px rgba(236, 72, 153, 0.5)",
              animationDelay: "3.2s",
            }}
          ></div>
        </div>

        <AboutPlanckSection />
      </div>

      {/* Success Section - CU ANIMAȚII LA SCROLL */}
      <section className="scroll-animate-fade-up relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated particles */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-30 animate-float"></div>
          <div
            className="absolute top-40 right-32 w-1.5 h-1.5 bg-purple-200 rounded-full opacity-40 animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-32 left-1/4 w-1 h-1 bg-pink-200 rounded-full opacity-50 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full opacity-20 animate-pulse-scale"
            style={{ animationDelay: "3s" }}
          ></div>

          {/* Gradient orbs */}
          <div
            className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-white/10 to-purple-300/20 rounded-full animate-pulse-scale"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-br from-pink-300/20 to-white/10 rounded-full animate-pulse-scale"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Geometric shapes */}
          <div
            className="absolute top-1/4 left-1/3 w-16 h-16 border border-white/20 rounded-lg rotate-45 animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-1/4 right-1/3 w-12 h-12 border border-pink-200/30 rounded-full animate-float"
            style={{ animationDelay: "3.5s" }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left Side - Main Title */}
          <div className="text-center lg:text-left scroll-animate-fade-right">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white title-font leading-tight cosmic-text-glow">
              Succesul În Fizică
              <span className="block text-yellow-300">
                Începe Aici
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mt-6 mx-auto lg:mx-0 animate-expand"></div>
          </div>

          {/* Right Side - Description and CTA */}
          <div className="text-center lg:text-left space-y-8 scroll-animate-fade-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 cosmic-glow">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-relaxed">
                De ce să cheltuiești <span className="text-yellow-300 font-black">100+ RON/oră</span> pe meditații când
                poți avea{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent font-black">
                  acces nelimitat
                </span>{" "}
                la tot cursul?
              </h3>

              <div className="space-y-4 text-purple-100 text-lg mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span>Acces pe viață la toate cursurile</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span>Învață în ritmul tău, oricând</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span>Suport complet și comunitate</span>
                </div>
              </div>

              <Link href="/cursuri">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 cosmic-glow shadow-2xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Descoperă Cursurile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section - CU ANIMAȚII LA SCROLL */}
      <div className="scroll-animate-fade-up">
        <CoursesSection />
      </div>

      {/* Newsletter Section - CU ANIMAȚII LA SCROLL */}
      <div className="scroll-animate-slide-up">
        <NewsletterSection />
      </div>

      {/* Footer - CU ANIMAȚII LA SCROLL */}
      <div className="scroll-animate-fade-up">
        <Footer />
      </div>
    </div>
  )
}

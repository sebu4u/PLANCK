"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import SplitText from "@/components/SplitText"

export default function InsightCTAHomepage() {
  return (
    <section className="relative w-full bg-[#0d1117] overflow-hidden">
      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 lg:pt-40 lg:pb-24 text-center">
        {/* Animated Title */}
        <SplitText
          text="Psst, știu eu..."
          tag="h1"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4"
          delay={100}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
        />
        
        {/* Subtitle */}
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
          Lasă-l pe Insight să-ți arate ce n-ai văzut încă în știință.
        </h3>

        {/* Feature Showcase Card */}
        <div className="relative mb-8 sm:mb-12 lg:mb-4 xl:mb-2">
          {/* Radial glow effect above the card - positioned to appear from small card */}
          <div className="relative flex justify-end mb-6 sm:mb-8">
            <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[150px] sm:h-[200px] md:h-[250px] lg:h-[300px] bg-gradient-radial from-blue-300/60 via-pink-300/40 to-transparent rounded-full blur-3xl"></div>
          </div>

          {/* Large outer card with glass effect */}
          <div className="relative scroll-animate-fade-up -mx-4 sm:-mx-6 lg:mx-0">
            {/* Outer card - flexible height on mobile, fixed on desktop */}
            <div className="relative w-full h-auto md:h-[490px] rounded-t-[1.5rem] sm:rounded-t-[2rem] border-x-0 lg:border-x-2 border-t-2 border-white/20 overflow-hidden md:overflow-visible after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[-1px] after:w-screen after:border-b after:border-white/10 after:pointer-events-none">
              {/* Glass background - transparent with blur */}
              <div className="absolute inset-0 bg-white/5 rounded-t-[1.5rem] sm:rounded-t-[2rem] backdrop-blur-xl"></div>
              
              {/* Additional glass layer for depth */}
              <div className="absolute inset-0 bg-white/3 rounded-t-[1.5rem] sm:rounded-t-[2rem] backdrop-blur-lg"></div>
              
              {/* Subtle blue gradient glow at bottom */}
              <div className="absolute inset-0 rounded-t-[1.5rem] sm:rounded-t-[2rem]" style={{background: 'linear-gradient(to top, rgba(59, 130, 246, 0.3) 0%, rgba(147, 197, 253, 0.2) 15%, rgba(147, 197, 253, 0.1) 25%, rgba(147, 197, 253, 0.05) 35%, transparent 50%)'}}></div>
              
              {/* Content container - relative on mobile with padding, absolute inset on desktop */}
              <div className="relative md:absolute md:inset-8 p-6 sm:p-8 md:p-0 flex flex-col min-[948px]:flex-row items-center justify-between gap-8 md:gap-8 z-10">
                {/* Left Section - Text and Button */}
                <div className="relative flex-1 md:pr-12 md:pl-8 text-center md:text-left w-full md:w-auto order-2 md:order-1">
                  <p className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold leading-relaxed max-w-md md:max-w-none mb-6 sm:mb-8 mx-auto md:mx-0">
                    <span className="text-white">El nu doar răspunde.</span>
                    <span className="text-gray-400"> Insight explică, ghidează și provoacă elevii să gândească fizica și informatica altfel.</span>
                  </p>
                  <Link 
                    href="/insight"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200 text-lg sm:text-xl font-medium group w-fit mx-auto md:mx-0"
                  >
                    <span className="relative">
                      Încearcă Insight gratuit acum
                      <span className="absolute bottom-0 left-0 h-0.5 bg-current w-0 transition-all duration-300 group-hover:w-full"></span>
                    </span>
                    <svg 
                      className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                {/* Right Section - Wider Card with more spacing */}
                <div className="relative flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end mr-0 md:mr-8 order-1 md:order-2">
                  {/* Wider card - more width, fixed height - maintaining aspect ratio */}
                  <div className="relative w-full max-w-[320px] md:max-w-none md:w-[450px] aspect-[4/3] md:h-[320px] bg-gradient-to-br from-white to-purple-50/80 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    {/* Insight image */}
                    <div className="relative w-full h-full">
                      <Image
                        src="/Insight-CTA.jpg"
                        alt="Insight feature showcase"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 90vw, (max-width: 768px) 320px, 450px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Panels Section - connected to card above */}
        <div className="relative w-screen lg:w-full lg:max-w-[90rem] left-1/2 lg:left-auto -translate-x-1/2 lg:translate-x-0 mx-0 px-0 -mt-4 sm:-mt-6 md:-mt-8 lg:-mt-3 xl:-mt-2">
          <div className="border-b border-x-0 lg:border-x border-white/10 bg-white/[0.02] backdrop-blur-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 px-4 sm:px-6 lg:px-0">
            {/* Panel 1 - 24/7 disponibil */}
            <div className="p-6 sm:p-8 lg:p-12 border-r-0 md:border-r border-white/10 lg:border-r text-center lg:text-left">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                24/7 disponibil
              </div>
              <div className="text-base sm:text-lg text-gray-400">
                Asistență continuă la fizică și informatică{' '}
                <Link 
                  href="/insight" 
                  className="text-blue-400 underline hover:text-blue-300 transition-colors duration-200"
                >
                  oricând ai nevoie
                </Link>
              </div>
            </div>

            {/* Panel 2 - răspunsuri în <5s */}
            <div className="p-6 sm:p-8 lg:p-12 border-r-0 md:border-r lg:border-r border-white/10 border-t md:border-t-0 text-center lg:text-left">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                răspunsuri în &lt;5s
              </div>
              <div className="text-base sm:text-lg text-gray-400">
                Explicații rapide și clare pentru{' '}
                <Link 
                  href="/insight" 
                  className="text-blue-400 underline hover:text-blue-300 transition-colors duration-200"
                >
                  orice problemă
                </Link>
              </div>
            </div>

            {/* Panel 3 - 95% acuratețe */}
            <div className="p-6 sm:p-8 lg:p-12 border-t md:border-t-0 text-center lg:text-left">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                95% acuratețe
              </div>
              <div className="text-base sm:text-lg text-gray-400">
                Verificat de profesori la{' '}
                <Link 
                  href="/insight" 
                  className="text-blue-400 underline hover:text-blue-300 transition-colors duration-200"
                >
                  toate materiile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


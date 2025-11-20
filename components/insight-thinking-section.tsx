"use client"

import Image from "next/image"

export default function InsightThinkingSection() {
  return (
    <section className="relative py-12 sm:py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          {/* Left side - Image placeholder */}
          <div className="order-2 lg:order-1 scroll-animate-fade-left">
            <div className="w-full h-64 sm:h-96 bg-gray-800 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm">Imagine placeholder</p>
                  <p className="text-[10px] sm:text-xs text-gray-600">Înlocuiește cu imaginea ta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Text content */}
          <div className="order-1 lg:order-2 flex items-center scroll-animate-fade-right">
            <div className="w-full max-w-md space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Insight te provoacă să gândești, nu doar să memorezi
              </h2>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Insight îți antrenează gândirea critică. În loc să-ți dea soluții instant, îți pune întrebările potrivite și te ghidează pas cu pas spre răspuns. Așa îți formezi o înțelegere reală, solidă și logică a materiei — exact cum lucrează un mentor adevărat.
              </p>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Cu fiecare conversație, Insight îți dezvoltă capacitatea de a analiza, explica și aplica noțiunile, nu doar de a le repeta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import Image from "next/image"

export default function InsightTestimonialsSection() {
  return (
    <section className="relative py-12 sm:py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          {/* Left side - Image */}
          <div className="order-2 lg:order-1 scroll-animate-fade-left">
            <div className="w-full h-64 sm:h-96 bg-gray-800 rounded-lg overflow-hidden relative">
              <Image 
                src="/insight-learning-tools.jpg" 
                alt="Insight learning tools and features" 
                fill
                className="object-cover"
                priority
                quality={95}
              />
            </div>
          </div>

          {/* Right side - Text content */}
          <div className="order-1 lg:order-2 flex items-center scroll-animate-fade-right">
            <div className="w-full max-w-md space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Tot ce ai nevoie pentru a învăța inteligent
              </h2>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Insight transformă orice material – PDF, video sau notițe – într-un set complet de instrumente de studiu interactive. AI-ul sintetizează esențialul și creează notițe clare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

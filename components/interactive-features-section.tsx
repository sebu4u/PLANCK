'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FeatureButton {
  id: string
  title: string
  subtext: string
  imageSrc: string
}

const features: FeatureButton[] = [
  {
    id: 'fizica',
    title: 'Fizica predata pe bune',
    subtext: 'lectii de calitate si exemple clare, cu sute de probleme',
    imageSrc: '/feature-1.jpg'
  },
  {
    id: 'insight',
    title: 'Insight cu tine, oriunde',
    subtext: 'Asistent inteligent care este gata sa te ajute cu orice tema sau test',
    imageSrc: '/feature-2.jpg'
  },
  {
    id: 'mentorat',
    title: 'Mentorat one on one',
    subtext: 'Programeaza o sedinta de pregatire cu profesorii nostri',
    imageSrc: '/feature-3.jpg'
  }
]

export default function InteractiveFeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string>('fizica')

  const activeFeatureData = features.find(f => f.id === activeFeature) || features[0]

  return (
    <section className="bg-[#0d1117] px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-stretch">
          {/* Left side - Feature buttons */}
          <div className="lg:col-span-5 h-full flex items-center pl-0 sm:pl-4 lg:pl-12 scroll-animate-fade-left">
            {/* Feature buttons */}
            <div className="w-full space-y-0 py-0">
              {features.map((feature, index) => {
                const isActive = feature.id === activeFeature
                return (
                  <div key={feature.id}>
                    <button
                      onClick={() => setActiveFeature(feature.id)}
                      className="w-full text-left py-4 sm:py-6 transition-all duration-300 hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xl sm:text-2xl font-bold transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`}>
                          {feature.title}
                        </h3>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-colors duration-200 ${
                          isActive ? 'text-purple-400' : 'text-gray-500'
                        }`}>
                          <span className="text-lg sm:text-xl font-light">+</span>
                        </div>
                      </div>
                      <div
                        className={`pr-4 sm:pr-8 overflow-hidden transition-all duration-300 ease-out ${
                          isActive
                            ? 'mt-2 sm:mt-3 max-h-24 opacity-100 translate-y-0'
                            : 'max-h-0 opacity-0 -translate-y-1'
                        }`}
                      >
                        <p className="text-gray-300 text-sm sm:text-base font-bold leading-relaxed">
                          {feature.subtext}
                        </p>
                      </div>
                    </button>
                    {index < features.length - 1 && (
                      <div className="h-[0.5px] bg-gray-800/60"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right side - Image */}
          <div className="lg:col-span-7 relative flex justify-center sm:justify-end items-center scroll-animate-fade-right mt-8 lg:mt-0">
            <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl aspect-[4/3]">
              <Image
                src={activeFeatureData.imageSrc}
                alt={activeFeatureData.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 320px, (max-width: 768px) 384px, (max-width: 1024px) 448px, (max-width: 1280px) 512px, 640px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

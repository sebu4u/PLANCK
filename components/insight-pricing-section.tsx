"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

interface PricingPlan {
  id: string
  name: string
  price: string
  description?: string
  features: Array<{
    text: string
    type: 'check' | 'cross' | 'gray'
  }>
  ctaText: string
  isRecommended?: boolean
  bgColor: string
  borderColor: string
  shadowClass?: string
}

interface InsightPricingSectionProps {
  variant?: 'default' | 'homepage'
}

export default function InsightPricingSection({ variant = 'default' }: InsightPricingSectionProps = {}) {
  const router = useRouter()
  
  // Date pentru planurile de pricing
  const pricingPlans: PricingPlan[] = useMemo(() => [
    {
      id: "free",
      name: "Free",
      price: "Gratuit",
      features: [
        { text: "3 prompt-uri gratuite pe zi", type: "check" },
        { text: "acces limitat la fișiere", type: "check" },
        { text: "acces limitat la learning roadmaps", type: "check" },
        { text: "learning roadmaps", type: "cross" },
        { text: "acces la toate modelele", type: "cross" },
        { text: "memorie îmbunătățită", type: "cross" },
        { text: "acces nelimitat la PlanckCode", type: "cross" }
      ],
      ctaText: "Începe acum",
      bgColor: "bg-gray-900", // #0A0A0A
      borderColor: "border-gray-700"
    },
    {
      id: "plus",
      name: "Plus",
      price: "29 RON/lună",
      features: [
        { text: "tot ce conține planul Free", type: "check" },
        { text: "800 prompt-uri pe lună", type: "check" },
        { text: "upload de 10 fișiere pe zi", type: "check" },
        { text: "learning roadmaps", type: "check" },
        { text: "acces la toate modelele", type: "check" },
        { text: "memorie îmbunătățită", type: "check" },
        { text: "acces nelimitat la PlanckCode", type: "cross" }
      ],
      ctaText: "Alege planul",
      isRecommended: true,
      bgColor: "bg-gray-800", // #0D0D0D
      borderColor: "border-blue-500",
      shadowClass: "shadow-blue-500/20"
    },
    {
      id: "premium",
      name: "Premium",
      price: "59 RON/lună",
      features: [
        { text: "tot ce conține planul Free și Plus", type: "check" },
        { text: "prompt-uri nelimitate", type: "check" },
        { text: "acces nelimitat la PlanckCode", type: "check" }
      ],
      ctaText: "Alege planul",
      bgColor: "bg-gray-900", // Aceeași culoare ca Free
      borderColor: "border-gray-700" // Aceeași culoare ca Free
    }
  ], [])

  return (
    <section className="relative py-12 sm:py-24 px-4 sm:px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header cu titlu și subtitlu */}
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="scroll-animate-fade-up text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6">
            Educația inteligentă devine accesibilă
          </h2>
          <p className="scroll-animate-fade-up animate-delay-200 text-base sm:text-lg lg:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed px-2">
            Insight oferă tutorat personalizat la prețul unei cafele pe săptămână.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Educația de calitate nu mai e un lux — e pentru oricine vrea să învețe eficient.
          </p>
        </div>

        {/* Grid pentru cardurile de pricing */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${variant === 'homepage' ? 'gap-4 lg:gap-6' : 'gap-4 sm:gap-8 lg:gap-12'}`}>
          {pricingPlans.map((plan, index) => (
            <article
              key={plan.id}
              className={`relative scroll-animate-fade-up ${
                index === 0 ? '' : index === 1 ? 'animate-delay-200' : 'animate-delay-400'
              } ${
                  variant === 'homepage' 
                  ? `bg-white/10 backdrop-blur-xl ${plan.isRecommended ? 'border-blue-500' : 'border-white/20'} border rounded-2xl p-6 shadow-2xl` 
                  : `${plan.bgColor} ${plan.borderColor} border-2 rounded-xl p-4 sm:p-6 lg:p-8 ${plan.shadowClass ? `shadow-lg ${plan.shadowClass}` : ''}`
              } transition-all duration-300 hover:scale-105 flex flex-col h-full`}
              role="article"
              aria-label={`Plan ${plan.name}`}
            >
              {/* Badge "Recomandat" pentru planul Plus */}
              {plan.isRecommended && (
                <div className={`absolute ${variant === 'homepage' ? '-top-3' : '-top-3 sm:-top-4'} left-1/2 transform -translate-x-1/2`}>
                  <div className={`bg-blue-600 text-white ${variant === 'homepage' ? 'px-3 py-0.5 text-xs' : 'px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm'} rounded-full font-medium`}>
                    Recomandat
                  </div>
                </div>
              )}

              {/* Titlu plan */}
              <h3 className={`font-bold text-white mb-2 ${variant === 'homepage' ? 'text-xl' : 'text-xl sm:text-2xl'}`}>
                {plan.name}
              </h3>

              {/* Preț */}
              <div className={`${variant === 'homepage' ? 'mb-4' : 'mb-4 sm:mb-6'}`}>
                <span className={`font-bold text-gray-400 ${variant === 'homepage' ? 'text-2xl' : 'text-2xl sm:text-3xl'}`}>
                  {plan.price}
                </span>
              </div>

              {/* Lista de beneficii */}
              <ul className={`${variant === 'homepage' ? 'space-y-3 mb-6' : 'space-y-3 sm:space-y-4 mb-6 sm:mb-8'} flex-grow`}>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {/* Iconiță în funcție de tip */}
                    <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 mt-0.5">
                      {feature.type === 'check' && (
                        <svg
                          className="w-full h-full text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {feature.type === 'cross' && (
                        <svg
                          className="w-full h-full text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {feature.type === 'gray' && (
                        <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className={`leading-relaxed ${
                      feature.type === 'gray' ? 'text-gray-600' : variant === 'homepage' ? 'text-gray-200' : 'text-gray-300'
                    } ${variant === 'homepage' ? 'text-sm' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Buton CTA - poziționat la baza cardului */}
              <div className="mt-auto">
                <button
                  onClick={() => {
                    if (plan.id === 'free') {
                      router.push('/probleme')
                    } else if (plan.id === 'plus' || plan.id === 'premium') {
                      router.push('/pricing')
                    }
                  }}
                  className={`w-full ${variant === 'homepage' ? 'py-2.5 px-5 text-sm' : 'py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base'} rounded-lg font-medium transition-all duration-200 ${
                    plan.isRecommended
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : variant === 'homepage'
                        ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                        : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  }`}
                  aria-label={`${plan.ctaText} pentru planul ${plan.name}`}
                >
                  {plan.ctaText}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

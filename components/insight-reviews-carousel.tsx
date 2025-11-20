"use client"

import Image from "next/image"
import { useMemo } from "react"

interface Testimonial {
  id: number
  name: string
  review: string
}

export default function InsightReviewsCarousel() {
  // Date testimoniale cu nume realiste de elevi români
  const testimonials: Testimonial[] = useMemo(() => [
    {
      id: 1,
      name: "Alexandru Popescu",
      review: "Temele la fizică erau un coșmar. Acum sunt chiar simple."
    },
    {
      id: 2,
      name: "Maria Ionescu",
      review: "Simt că învăț cu adevărat, nu doar memorez."
    },
    {
      id: 3,
      name: "David Stanciu",
      review: "Pregătirea pentru examene e fără stres și mai rapidă."
    },
    {
      id: 4,
      name: "Ana Gheorghe",
      review: "Insight explică totul clar și logic. În sfârșit înțeleg materia."
    },
    {
      id: 5,
      name: "Mihai Dumitrescu",
      review: "Învăț mai repede și fără stres. Chiar simt că progresez."
    }
  ], [])

  // Duplicăm testimonialele pentru animația seamless
  const duplicatedTestimonials = useMemo(() => [
    ...testimonials,
    ...testimonials,
    ...testimonials
  ], [testimonials])

  return (
    <section className="relative py-12 sm:py-24 px-4 sm:px-6 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header cu titlu și subtitlu */}
        <div className="text-center mb-8 sm:mb-16 scroll-animate-fade-up">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6">
            Mai puțin <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">stres</span>. Note mai <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">mari</span>.
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-2">
            Elevii ce folosesc Insight învață mai eficient, se simt mai încrezători și obțin performanțe vizibile.
          </p>
        </div>

        {/* Container pentru carousel cu gradient fade-out */}
        <div className="relative scroll-animate-fade-up animate-delay-200">
          {/* Gradient fade-out overlay - stânga */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          
          {/* Gradient fade-out overlay - dreapta */}
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          {/* Carousel container */}
          <div className="relative overflow-hidden">
            <div 
              className="flex gap-4 sm:gap-6 animate-scroll-infinite"
              style={{
                width: 'max-content',
                animationDuration: '30s' // Mai lent: ~6 secunde per card (5 carduri * 6s = 30s)
              }}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className="flex-shrink-0 w-[280px] sm:w-80 md:w-96 bg-black border border-gray-600 rounded-xl p-4 sm:p-6"
                  style={{ willChange: 'transform' }}
                  role="article"
                  aria-label={`Testimonial de la ${testimonial.name}`}
                >
                  {/* Avatar și nume */}
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                      <Image
                        src="/placeholder-user.jpg"
                        alt={`Avatar pentru ${testimonial.name}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-gray-400 font-medium text-base sm:text-lg">
                      {testimonial.name}
                    </h3>
                  </div>

                  {/* Review */}
                  <blockquote className="text-gray-300 italic text-sm sm:text-base leading-relaxed">
                    "{testimonial.review}"
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS pentru animația infinită */}
      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll-infinite {
          animation: scroll-infinite linear infinite;
        }

        /* Responsive adjustments - animație mai lentă pe toate device-urile */
        @media (max-width: 640px) {
          .animate-scroll-infinite {
            animation-duration: 25s; /* Mai lent pe mobile */
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .animate-scroll-infinite {
            animation-duration: 28s; /* Mai lent pe tablet */
          }
        }
      `}</style>
    </section>
  )
}

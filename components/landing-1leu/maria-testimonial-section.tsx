"use client"

import { Star } from "lucide-react"

import { FadeInUp } from "@/components/scroll-animations"
import { HOMEPAGE_TESTIMONIALS } from "@/lib/homepage-testimonials"

const MARIA_TESTIMONIAL = HOMEPAGE_TESTIMONIALS.find((testimonial) => testimonial.name === "Maria Ionescu")

export function Landing1LeuMariaTestimonialSection() {
  if (!MARIA_TESTIMONIAL) return null

  return (
    <section className="bg-[#F8F7FF] py-20 sm:py-28" aria-label="Testimonial Maria Ionescu">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <FadeInUp>
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- local testimonial avatar */}
            <img
              src="/reviews/avatar-3.webp"
              alt={MARIA_TESTIMONIAL.name}
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-4 ring-white shadow-[0_8px_20px_rgba(15,23,42,0.10)] sm:h-20 sm:w-20"
            />
            <div className="pt-1">
              <div className="flex gap-0.5" aria-label="5 din 5 stele">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="h-4 w-4 fill-[#F59E3A] text-[#F59E3A]" aria-hidden />
                ))}
              </div>
              <p className="mt-2 text-base font-black text-gray-900 sm:text-lg">{MARIA_TESTIMONIAL.name}</p>
              <p className="text-sm text-gray-500">{MARIA_TESTIMONIAL.role}</p>
            </div>
          </div>

          <div className="mt-7 h-[3px] w-16 rounded-full bg-[#A3E635]" aria-hidden />
          <blockquote className="mt-5 text-xl italic leading-relaxed text-gray-700 sm:text-2xl sm:leading-relaxed">
            „{MARIA_TESTIMONIAL.quote}”
          </blockquote>
        </FadeInUp>
      </div>
    </section>
  )
}

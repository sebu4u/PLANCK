"use client"

import { Star } from "lucide-react"
import {
  AnimatedWords,
  ONBOARDING_STEP_BUTTON_ANIM,
} from "@/components/onboarding/animated-words"
import {
  getStudentTestimonialsCopy,
  STUDENT_TESTIMONIALS,
  type StudentTestimonial,
} from "@/lib/student-testimonials"

function StarRating({ rating }: { rating: StudentTestimonial["rating"] }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 !== 0

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} din 5 stele`}>
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1
        const isFull = starIndex <= fullStars
        const isHalf = hasHalf && starIndex === fullStars + 1

        return (
          <span key={starIndex} className="relative h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4">
            <Star className="h-3.5 w-3.5 text-[#e5e7eb] sm:h-4 sm:w-4" aria-hidden />
            {(isFull || isHalf) && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: isHalf ? "50%" : "100%" }}
              >
                <Star className="h-3.5 w-3.5 fill-[#f59e3a] text-[#f59e3a] sm:h-4 sm:w-4" aria-hidden />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

function TestimonialCard({
  testimonial,
  animationDelay,
}: {
  testimonial: StudentTestimonial
  animationDelay: string
}) {
  return (
    <article
      className="w-[calc(100vw-4.75rem)] max-w-[320px] shrink-0 snap-start snap-always rounded-2xl border border-[#eceff3] bg-[#fafafa] px-3.5 py-3 opacity-0 sm:px-5 sm:py-5 lg:w-auto lg:max-w-none lg:shrink lg:snap-none"
      style={{ animation: ONBOARDING_STEP_BUTTON_ANIM, animationDelay }}
    >
      <StarRating rating={testimonial.rating} />
      <p className="mt-2.5 text-[13px] leading-relaxed text-[#374151] sm:mt-3 sm:text-[15px]">
        „{testimonial.quote}"
      </p>
      <div className="mt-3 sm:mt-4">
        <p className="text-sm font-semibold text-[#111827]">{testimonial.name}</p>
        <p className="text-xs text-[#6b7280]">{testimonial.role}</p>
      </div>
    </article>
  )
}

export function StudentTestimonialsStep() {
  const copy = getStudentTestimonialsCopy()

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4 lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
      <div className="shrink-0 lg:w-[42%] lg:pt-1">
        <AnimatedWords
          as="h1"
          text={copy.title}
          className="text-[22px] font-semibold leading-tight text-[#0f1115] sm:text-[32px]"
        />
        <AnimatedWords
          text={copy.subtitle}
          className="mt-2 text-[13px] leading-snug text-[#666a73] sm:mt-4 sm:text-base sm:leading-relaxed"
          startDelay={180}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-4 scroll-pr-4 px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-pl-6 sm:scroll-pr-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-3.5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {STUDENT_TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              animationDelay={`${240 + index * 90}ms`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

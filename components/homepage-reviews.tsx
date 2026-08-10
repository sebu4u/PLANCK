"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ArrowRight, Trophy, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FadeInUp } from "@/components/scroll-animations"
import { TESTIMONIALS_LABEL } from "@/lib/platform-marketing"
import {
  HOMEPAGE_TESTIMONIALS,
  type HomepageTestimonial,
} from "@/lib/homepage-testimonials"

const PREVIEW_CHAR_LIMIT = 120

function truncateQuote(quote: string, limit = PREVIEW_CHAR_LIMIT): string {
  const normalized = quote.trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit).trimEnd()}…`
}

function needsExpand(quote: string): boolean {
  return quote.trim().length > PREVIEW_CHAR_LIMIT
}

function TestimonialImage({ testimonial }: { testimonial: HomepageTestimonial }) {
  const [failed, setFailed] = useState(false)
  const initial = testimonial.name.trim().charAt(0).toUpperCase() || "?"

  if (failed) {
    return (
      <div
        className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-2xl font-semibold text-gray-400"
        aria-hidden
      >
        {initial}
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
      <Image
        src={testimonial.imageSrc}
        alt={testimonial.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 85vw, 280px"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function TestimonialCard({
  testimonial,
  onExpand,
  className,
}: {
  testimonial: HomepageTestimonial
  onExpand: () => void
  className?: string
}) {
  const preview = truncateQuote(testimonial.quote)
  const showExpand = needsExpand(testimonial.quote)

  return (
    <article
      className={cn(
        "flex h-full w-[260px] flex-shrink-0 flex-col rounded-[24px] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] sm:w-[300px]",
        className
      )}
    >
      <TestimonialImage testimonial={testimonial} />

      <div className="mt-4 flex flex-col flex-1 min-h-0">
        <h3 className="text-base font-bold text-gray-900 leading-tight">{testimonial.name}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{testimonial.role}</p>

        <div className="mt-4 flex-1 min-h-0">
          <span
            className="text-3xl font-serif leading-none text-gray-300 select-none"
            aria-hidden
          >
            „
          </span>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 line-clamp-4">
            {preview}
          </p>
          {showExpand && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={onExpand}
                className="text-xs font-medium text-gray-500 underline-offset-2 transition-colors hover:text-gray-900 hover:underline"
              >
                Arată mai mult
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-gray-500">
          <Trophy className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          <span className="text-sm font-semibold tabular-nums text-gray-700">
            {testimonial.score}
          </span>
        </div>
      </div>
    </article>
  )
}

function TestimonialModal({
  testimonial,
  onClose,
}: {
  testimonial: HomepageTestimonial
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Testimonial de la ${testimonial.name}`}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] ring-1 ring-black/5 sm:p-8"
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-w-[320px]">
          <TestimonialImage testimonial={testimonial} />
        </div>

        <div className="mt-5 pr-8">
          <h3 className="text-xl font-bold text-gray-900">{testimonial.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{testimonial.role}</p>
        </div>

        <div className="mt-5">
          <span className="text-4xl font-serif leading-none text-gray-300 select-none" aria-hidden>
            „
          </span>
          <p className="mt-2 text-base leading-relaxed text-gray-700">{testimonial.quote}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-5">
          <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
          <span className="text-base font-semibold tabular-nums text-gray-800">
            {testimonial.score}
          </span>
          <span className="text-sm text-gray-400">puncte PLANCK</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ReviewsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [expandedTestimonial, setExpandedTestimonial] = useState<HomepageTestimonial | null>(null)

  const scrollByAmount = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const firstCard = container.firstElementChild as HTMLElement | null
    const cardWidth = firstCard?.offsetWidth ?? 300
    const gap = 16
    const scrollAmount = cardWidth + gap

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }, [])

  return (
    <section className="relative w-full overflow-hidden bg-[#f6f5f4] py-20 sm:py-24">
      {/* Subtle geometric accent */}
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-[420px] w-[420px] opacity-[0.35]"
        aria-hidden
      >
        <svg viewBox="0 0 200 200" className="h-full w-full text-gray-300/40" fill="currentColor">
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" fill="none" stroke="currentColor" strokeWidth="1" />
          <polygon points="100,35 155,65 155,135 100,165 45,135 45,65" fill="none" stroke="currentColor" strokeWidth="0.75" />
          <polygon points="100,60 130,75 130,125 100,140 70,125 70,75" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <FadeInUp className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
            Ce spun elevii, părinții și profesorii
          </h2>
          <p className="text-base font-normal leading-relaxed text-gray-500 md:text-lg">
            {TESTIMONIALS_LABEL} — alături de mii de elevi care deja învață cu PLANCK.
          </p>
        </FadeInUp>
      </div>

      <FadeInUp delay={0.1} className="relative w-full">
        <div
          ref={scrollContainerRef}
          className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory pl-8 pr-4 sm:gap-4 sm:pl-12 md:pl-16 md:pr-0"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {HOMEPAGE_TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.id} className="snap-center flex-shrink-0">
              <TestimonialCard
                testimonial={testimonial}
                onExpand={() => setExpandedTestimonial(testimonial)}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            aria-label="Testimonial anterior"
          >
            <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            aria-label="Testimonial următor"
          >
            <ChevronRight className="h-5 w-5 stroke-[1.5]" />
          </button>
        </div>
      </FadeInUp>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <FadeInUp delay={0.2} className="mt-14 flex flex-col items-center">
          <p className="mb-6 text-center text-lg font-medium text-gray-600">
            Alătură-te elevilor care deja învață altfel
          </p>
          <div className="flex w-full max-w-2xl justify-center px-4">
            <Link
              href="/register"
              className="dashboard-start-glow box-border inline-flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] px-9 text-base font-semibold text-white shadow-[0_4px_0_#5B47D6] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#5B47D6] active:translate-y-1 active:shadow-[0_1px_0_#5B47D6] lg:w-auto"
              style={{ "--start-glow-tint": "rgba(224, 215, 255, 0.88)" } as CSSProperties}
            >
              <span className="relative z-10 inline-flex items-center gap-2 text-white">
                Vreau să încep acum
                <ArrowRight className="h-4 w-4 shrink-0 text-white" aria-hidden />
              </span>
            </Link>
          </div>
        </FadeInUp>
      </div>

      <AnimatePresence>
        {expandedTestimonial && (
          <TestimonialModal
            testimonial={expandedTestimonial}
            onClose={() => setExpandedTestimonial(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

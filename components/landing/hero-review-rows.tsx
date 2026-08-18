"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import {
  LANDING_HERO_REVIEW_ROWS,
  type LandingHeroReview,
} from "@/lib/landing-hero-reviews"
import { cn } from "@/lib/utils"

function StarRating({
  rating,
  size = "md",
}: {
  rating: LandingHeroReview["rating"]
  size?: "sm" | "md"
}) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 !== 0
  const starClass = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} din 5 stele`}>
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1
        const isFull = starIndex <= fullStars
        const isHalf = hasHalf && starIndex === fullStars + 1

        return (
          <span key={starIndex} className={cn("relative shrink-0", starClass)}>
            <Star className={cn(starClass, "text-gray-200")} aria-hidden />
            {(isFull || isHalf) && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: isHalf ? "50%" : "100%" }}
              >
                <Star className={cn(starClass, "fill-[#F59E3A] text-[#F59E3A]")} aria-hidden />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

function ReviewAvatar({ src, size }: { src: string; size: number }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className="shrink-0 rounded-full bg-gray-100 ring-1 ring-black/5"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 96×96 webp avatars; next/image adds no benefit at this size */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        decoding="async"
        loading="lazy"
        draggable={false}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function ReviewCard({
  review,
  compact = false,
}: {
  review: LandingHeroReview
  compact?: boolean
}) {
  return (
    <article
      className={cn(
        "flex flex-shrink-0 flex-col justify-between rounded-2xl bg-white ring-1 ring-black/[0.06]",
        compact
          ? "h-[108px] w-[210px] p-2.5"
          : "h-[148px] w-[250px] p-3.5 sm:w-[270px]",
      )}
    >
      <p
        className={cn(
          "leading-snug text-gray-700",
          compact ? "text-[11px]" : "text-sm",
        )}
      >
        {review.quote}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <StarRating rating={review.rating} size={compact ? "sm" : "md"} />
        <ReviewAvatar src={review.avatarSrc} size={compact ? 22 : 28} />
      </div>
    </article>
  )
}

function MarqueeRow({
  reviews,
  direction,
  duration,
  compact = false,
}: {
  reviews: LandingHeroReview[]
  direction: "left" | "right"
  duration: string
  compact?: boolean
}) {
  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-3 motion-reduce:animate-none motion-safe:hover:[animation-play-state:paused]",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right",
        )}
        style={{ animationDuration: duration }}
      >
        <div className="flex gap-3 pr-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} compact={compact} />
          ))}
        </div>
        <div className="flex gap-3 pr-3" aria-hidden>
          {reviews.map((review) => (
            <ReviewCard key={`${review.id}-dup`} review={review} compact={compact} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function LandingHeroReviewRowsDesktop() {
  const [row1, row2, row3] = LANDING_HERO_REVIEW_ROWS

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(52%,40rem)] overflow-hidden lg:block">
      <div className="flex h-full flex-col justify-center gap-3 py-8">
        <MarqueeRow reviews={row1} direction="right" duration="32s" />
        <MarqueeRow reviews={row2} direction="left" duration="44s" />
        <MarqueeRow reviews={row3} direction="right" duration="24s" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#ffffff] via-[#ffffff]/90 to-transparent xl:w-36"
        aria-hidden
      />
    </div>
  )
}

/** Two centered marquee rows (4 cards each) for the homepage, directly under the hero. */
export function HomepageHeroTestimonials() {
  const [row1, row2] = LANDING_HERO_REVIEW_ROWS

  return (
    <section
      className="relative overflow-hidden bg-white py-8 sm:py-12"
      aria-label="Recenzii elevi Planck"
    >
      <div className="relative mx-auto w-full max-w-[1116px]">
        <div className="flex flex-col gap-3">
          <MarqueeRow reviews={row1} direction="right" duration="36s" />
          <MarqueeRow reviews={row2} direction="left" duration="48s" />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16 lg:w-24"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16 lg:w-24"
          aria-hidden
        />
      </div>
    </section>
  )
}

export function LandingHeroReviewRowsMobile() {
  const [row1, row2] = LANDING_HERO_REVIEW_ROWS

  return (
    <div className="relative mt-8 overflow-hidden lg:hidden" aria-label="Recenzii elevi">
      <div className="flex flex-col gap-2">
        <MarqueeRow reviews={row1} direction="right" duration="28s" compact />
        <MarqueeRow reviews={row2} direction="left" duration="36s" compact />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#ffffff] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#ffffff] to-transparent"
        aria-hidden
      />
    </div>
  )
}

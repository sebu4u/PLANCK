"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { HOMEPAGE_MOBILE_REVIEWS, type HomepageMobileReview } from "@/lib/homepage-mobile-reviews"

function StarRating({ rating, className }: { rating: HomepageMobileReview["rating"]; className?: string }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 !== 0

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating} din 5 stele`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1
        const isFull = starIndex <= fullStars
        const isHalf = hasHalf && starIndex === fullStars + 1

        return (
          <span key={starIndex} className="relative h-3 w-3 shrink-0">
            <Star className="h-3 w-3 text-gray-200" aria-hidden />
            {(isFull || isHalf) && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: isHalf ? "50%" : "100%" }}
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

function ReviewAvatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  if (failed) {
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200/80"
        aria-hidden
      >
        {initial}
      </div>
    )
  }

  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200/80">
      <Image
        src={src}
        alt=""
        width={28}
        height={28}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function ReviewCard({ review }: { review: HomepageMobileReview }) {
  return (
    <article
      className="flex w-[min(88vw,300px)] shrink-0 items-center gap-2 rounded-lg border border-gray-100/90 bg-white px-2 py-1.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
      aria-label={`Review de la ${review.name}`}
    >
      <ReviewAvatar src={review.avatarSrc} name={review.name} />
      <div className="min-w-0 flex-1">
        <div className="mb-px flex items-center gap-1.5">
          <StarRating rating={review.rating} />
          <span className="truncate text-[10px] font-medium text-gray-500">{review.name}</span>
        </div>
        <p className="truncate text-xs leading-tight text-gray-800">&ldquo;{review.quote}&rdquo;</p>
      </div>
    </article>
  )
}

export function HomepageMobileReviewsBar() {
  const marqueeItems = useMemo(
    () => [...HOMEPAGE_MOBILE_REVIEWS, ...HOMEPAGE_MOBILE_REVIEWS],
    []
  )

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-gray-200/90 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 md:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Review-uri elevi"
    >
      <div className="relative overflow-hidden py-1.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />

        <div className="homepage-mobile-reviews-marquee flex w-max gap-2 pl-2">
          {marqueeItems.map((review, index) => (
            <ReviewCard key={`${review.id}-${index}`} review={review} />
          ))}
        </div>
      </div>
    </div>
  )
}

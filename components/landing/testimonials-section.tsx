"use client"

import { Star } from "lucide-react"
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/scroll-animations"
import {
  HOMEPAGE_TESTIMONIALS,
  type HomepageTestimonial,
} from "@/lib/homepage-testimonials"

const AVATAR_FALLBACKS = [
  "/reviews/avatar-1.webp",
  "/reviews/avatar-2.webp",
  "/reviews/avatar-3.webp",
  "/reviews/avatar-5.webp",
  "/reviews/avatar-6.webp",
  "/reviews/avatar-1.webp",
]

/** Prefer students with concrete results; fill with other strong quotes. */
function pickLandingTestimonials(): Array<HomepageTestimonial & { avatarSrc: string }> {
  const students = HOMEPAGE_TESTIMONIALS.filter((t) => t.category === "student")
  const others = HOMEPAGE_TESTIMONIALS.filter((t) => t.category !== "student")
  const picked = [...students, ...others].slice(0, 6)
  return picked.map((t, i) => ({
    ...t,
    avatarSrc: AVATAR_FALLBACKS[i % AVATAR_FALLBACKS.length],
  }))
}

const TESTIMONIALS = pickLandingTestimonials()

function TestimonialCard({
  t,
  className = "",
}: {
  t: (typeof TESTIMONIALS)[number]
  className?: string
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-[20px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.07)] ring-1 ring-black/5 ${className}`}
    >
      <div className="mb-4 flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-4 w-4 fill-[#F59E3A] text-[#F59E3A]" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-gray-600 sm:text-base">„{t.quote}”</p>
      <div className="mt-5 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny local avatars; next/image optimizer stalls `next dev` */}
        <img
          src={t.avatarSrc}
          alt={t.name}
          width={40}
          height={40}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-bold text-gray-900">{t.name}</p>
          <p className="text-xs text-gray-400">{t.role}</p>
        </div>
      </div>
    </div>
  )
}

export function LandingTestimonialsSection() {
  const mobile = TESTIMONIALS.slice(0, 5)

  return (
    <section className="bg-[#F8F7FF] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Ce spun elevii care au trecut deja prin BAC cu Planck
          </h2>
          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            Nume reale, rezultate concrete — nu marketing gol.
          </p>
        </FadeInUp>

        <div
          className="sm:hidden motion-reduce:hidden -mx-4 w-[calc(100%+2rem)] overflow-hidden select-none [touch-action:pan-y]"
          aria-label="Testimoniale elevi Planck"
        >
          <div className="flex w-max items-stretch gap-4 px-4 motion-safe:animate-stats-marquee">
            {[...mobile, ...mobile].map((t, index) => (
              <TestimonialCard
                key={`${t.id}-${index}`}
                t={t}
                className="h-[280px] w-[300px] flex-shrink-0"
              />
            ))}
          </div>
        </div>

        <div className="hidden gap-4 motion-reduce:grid sm:motion-reduce:hidden">
          {mobile.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>

        <StaggerContainer
          className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.09}
        >
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.id}>
              <TestimonialCard t={t} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

"use client"

import { Lightbulb, Sparkles } from "lucide-react"
import { LazyYouTubePlayer } from "@/components/lazy-youtube-player"

const PLATFORM_YOUTUBE_VIDEO_ID = "S0pa880n2D8"

export function HomePagePlatformVideoSection() {
  return (
    <section
      id="home-platform"
      className="bg-[#ffffff] py-20 sm:py-24 lg:py-28"
      aria-labelledby="home-platform-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          {/* Video 16:9 — stânga pe desktop */}
          <div className="home-platform-enter scroll-animate-fade-left min-w-0">
            <div className="overflow-hidden rounded-2xl bg-[#e8e6e3] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06]">
              <LazyYouTubePlayer
                videoId={PLATFORM_YOUTUBE_VIDEO_ID}
                title="Preview platformă PLANCK"
                caption="Cum să înveți cu PLANCK?"
                className="rounded-none shadow-none"
              />
            </div>
          </div>

          {/* Titlu + text — dreapta pe desktop */}
          <div className="home-platform-enter scroll-animate-fade-right animate-delay-200 min-w-0 lg:pl-2">
            <div className="mb-4 flex gap-2 sm:mb-5 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.06] sm:gap-2.5 sm:px-3 sm:py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F8F7FF] text-[#7C5CFC] sm:h-8 sm:w-8">
                  <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <p className="min-w-0 text-[11px] font-semibold leading-snug text-gray-700 sm:text-sm">
                  Gândești, nu tocești
                </p>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.06] sm:gap-2.5 sm:px-3 sm:py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F8F7FF] text-[#7C5CFC] sm:h-8 sm:w-8">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <p className="min-w-0 text-[11px] font-semibold leading-snug text-gray-700 sm:text-sm">
                  Insight te ghidează
                </p>
              </div>
            </div>

            <h2
              id="home-platform-heading"
              className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
            >
              Platforma care te face să înțelegi, nu doar să memorezi
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-700 sm:mt-5 sm:text-lg">
              PLANCK îmbină trasee de învățare, probleme interactive și feedback instant într-un
              singur loc. Vezi cum arată platforma în acțiune — de la lecții la exerciții și
              progresul tău.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

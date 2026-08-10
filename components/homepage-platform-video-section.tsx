"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

/**
 * Setează URL-ul final al videoclipului când e gata.
 * Lăsat gol = se afișează doar placeholder-ul / thumbnail-ul.
 */
const PLATFORM_VIDEO_SRC = ""

/** Poster / thumbnail afișat înainte de încărcarea videoclipului. */
const PLATFORM_VIDEO_POSTER = ""

export function HomePagePlatformVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !PLATFORM_VIDEO_SRC) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px 0px", threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handlePlayClick = () => {
    const video = videoRef.current
    if (!video || !PLATFORM_VIDEO_SRC) return
    void video.play().then(() => setIsPlaying(true)).catch(() => {})
  }

  return (
    <section
      id="home-platform"
      className="bg-gradient-to-b from-[#f7f7f7] via-white to-[#f3f6fb] py-20 sm:py-24 lg:py-28"
      aria-labelledby="home-platform-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          {/* Video 16:9 — stânga pe desktop */}
          <div ref={containerRef} className="scroll-animate-fade-left min-w-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#e8e6e3] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06]">
              {PLATFORM_VIDEO_POSTER ? (
                <Image
                  src={PLATFORM_VIDEO_POSTER}
                  alt=""
                  fill
                  className={`object-cover transition-opacity duration-300 ${
                    isPlaying ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={false}
                />
              ) : (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#ebe9e6] via-[#e4e2df] to-[#d9d6d2] transition-opacity duration-300 ${
                    isPlaying ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                  aria-hidden={isPlaying}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-black/5 sm:h-16 sm:w-16">
                    <Play className="ml-0.5 h-6 w-6 text-gray-800 sm:h-7 sm:w-7" fill="currentColor" />
                  </div>
                  <p className="px-4 text-center text-sm font-medium text-gray-500 sm:text-base">
                    Preview platformă
                  </p>
                </div>
              )}

              {shouldLoad && PLATFORM_VIDEO_SRC ? (
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={PLATFORM_VIDEO_SRC}
                  poster={PLATFORM_VIDEO_POSTER || undefined}
                  controls={isPlaying}
                  playsInline
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                >
                  Videoclipul nu poate fi redat în browserul tău.
                </video>
              ) : null}

              {PLATFORM_VIDEO_SRC && !isPlaying ? (
                <button
                  type="button"
                  onClick={handlePlayClick}
                  className="absolute inset-0 z-10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] focus-visible:ring-offset-2"
                  aria-label="Redă videoclipul de prezentare"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 sm:h-16 sm:w-16">
                    <Play className="ml-0.5 h-6 w-6 text-gray-900 sm:h-7 sm:w-7" fill="currentColor" />
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Titlu + text — dreapta pe desktop */}
          <div className="scroll-animate-fade-right animate-delay-200 min-w-0 lg:pl-2">
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

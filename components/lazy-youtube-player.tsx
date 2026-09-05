'use client'

import { useState } from 'react'
import { Lock, Play } from 'lucide-react'

interface LazyYouTubePlayerProps {
  videoId: string
  title: string
  className?: string
  locked?: boolean
  onLockedClick?: () => void
  lockedLabel?: string
  /** Caption shown at the bottom of the thumbnail before playback. */
  caption?: string
  /** Default 16:9. Use 9:16 for Shorts / vertical teacher clips. */
  aspect?: "16/9" | "9/16"
}

// Utility function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null

  const trimmed = url.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
    /youtube\.com\/watch\?.*v=([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function LazyYouTubePlayer({
  videoId,
  title,
  className = "",
  locked = false,
  onLockedClick,
  lockedLabel = "Disponibil cu Planck Plus+",
  caption,
  aspect = "16/9",
}: LazyYouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePlayClick = () => {
    if (locked) {
      onLockedClick?.()
      return
    }
    setIsLoading(true)
    setIsLoaded(true)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  // Generate YouTube thumbnail URL
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&playsinline=1`

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-gray-100 shadow-lg ${
        aspect === "9/16" ? "aspect-[9/16]" : "aspect-video"
      } ${className}`}
    >
      {!isLoaded || locked ? (
        // Thumbnail with play button (or locked overlay)
        <div className="relative w-full h-full cursor-pointer group" onClick={handlePlayClick}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to a different thumbnail quality if maxresdefault fails
              const target = e.target as HTMLImageElement
              target.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            }}
          />
          
          {locked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-4 text-center transition-all duration-300 group-hover:bg-black/65">
              <div className="rounded-full bg-white/95 p-3.5 shadow-2xl">
                <Lock className="h-6 w-6 text-[#0b0d10]" strokeWidth={2.25} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white sm:text-base">Rezolvare video</p>
                <p className="text-xs font-medium text-white/85 sm:text-sm">{lockedLabel}</p>
              </div>
              <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                Upgrade
              </span>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent to-50% transition-all duration-300 group-hover:from-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`rounded-full bg-red-600 shadow-2xl transition-all duration-300 hover:bg-red-700 group-hover:scale-110 ${
                    aspect === "9/16" ? "p-3" : "p-4"
                  }`}
                >
                  <Play
                    className={`ml-0.5 fill-white text-white ${aspect === "9/16" ? "h-6 w-6" : "ml-1 h-8 w-8"}`}
                  />
                </div>
              </div>
              {caption ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-12 sm:px-4 sm:pb-4">
                  <p className="text-sm font-bold leading-snug tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:text-base">
                    {caption}
                  </p>
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white">
                  YouTube
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Iframe when loaded
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            onLoad={handleIframeLoad}
          />
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, type ReactNode } from "react"
import { Play } from "lucide-react"

interface YouTubeFacadeProps {
  videoId: string
  title: string
  /** Thumbnail quality requested from i.ytimg.com. */
  posterQuality?: "hqdefault" | "sddefault" | "maxresdefault"
  className?: string
  /** Optional caption overlay (e.g. name/role), only shown before playback starts. */
  children?: ReactNode
}

/**
 * Lazy-load facade for a YouTube video: renders only a thumbnail + play button
 * until clicked, then swaps in the real iframe. Avoids loading YouTube's JS/iframe
 * cost for videos the user never plays.
 */
export function YouTubeFacade({
  videoId,
  title,
  posterQuality = "hqdefault",
  className = "",
  children,
}: YouTubeFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (isPlaying) {
    return (
      <div className={`relative aspect-[9/16] w-full overflow-hidden rounded-[20px] bg-black ${className}`}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label={`Redă: ${title}`}
      className={`group relative aspect-[9/16] w-full overflow-hidden rounded-[20px] bg-gray-900 shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] ${className}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/${posterQuality}.jpg`}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition-transform duration-200 group-hover:scale-110">
          <Play className="h-6 w-6 fill-[#7C5CFC] text-[#7C5CFC]" />
        </div>
      </div>

      {children && (
        <div className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">{children}</div>
      )}
    </button>
  )
}

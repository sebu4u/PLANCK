"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { extractYouTubeVideoId } from "@/components/lazy-youtube-player"
import { cn } from "@/lib/utils"

/**
 * Paste a full YouTube URL here when ready, e.g.
 * "https://www.youtube.com/watch?v=XXXXXXXXXXX"
 */
export const INVATA_HOWTO_YOUTUBE_URL = "https://www.youtube.com/watch?v=S0pa880n2D8"

const TITLE = "Cum să înveți cu PLANCK?"
const SUBTITLE = "Descoperă toată platforma"

export function InvataHowToLearnCard({ className }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoId = extractYouTubeVideoId(INVATA_HOWTO_YOUTUBE_URL)

  return (
    <section className={cn(className)} aria-label={TITLE}>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/10 ring-1 ring-black/10">
        {isPlaying && videoId ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
            title={TITLE}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (videoId) setIsPlaying(true)
            }}
            disabled={!videoId}
            aria-label={videoId ? `Redă: ${TITLE}` : TITLE}
            className={cn(
              "absolute inset-0 w-full",
              videoId ? "cursor-pointer" : "cursor-default",
            )}
          >
            {videoId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.12),_transparent_60%),linear-gradient(160deg,#1a0a4a_0%,#0b0c0f_100%)]"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_20px_rgba(0,0,0,0.28)]">
                <Play className="h-4 w-4 fill-[#5020F0] text-[#5020F0]" aria-hidden />
              </span>
            </div>
          </button>
        )}

        {!isPlaying ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2.5">
            <h2 className="text-[13px] font-bold leading-snug tracking-tight text-white">
              {TITLE}
            </h2>
          </div>
        ) : null}
      </div>
      <p className="mt-2.5 text-center text-[13px] font-semibold leading-snug text-[#5f5f5f]">
        {SUBTITLE}
      </p>
    </section>
  )
}

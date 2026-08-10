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
}

// Utility function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
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
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100 ${className}`}>
      {!isLoaded || locked ? (
        // Thumbnail with play button (or locked overlay)
        <div className="relative w-full h-full cursor-pointer group" onClick={handlePlayClick}>
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to a different thumbnail quality if maxresdefault fails
              const target = e.target as HTMLImageElement
              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
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
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300">
                <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-all duration-300 group-hover:scale-110 shadow-2xl">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
              
              {/* YouTube logo overlay */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                YouTube
              </div>
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

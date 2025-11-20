'use client'

import { useState, useEffect, useRef } from 'react'
import { extractYouTubeVideoId } from './lazy-youtube-player'

interface GlassVideoPlayerProps {
  videoUrl: string
  title?: string
}

export function GlassVideoPlayer({ videoUrl, title = "Video" }: GlassVideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldLoad, setShouldLoad] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const videoId = extractYouTubeVideoId(videoUrl)
  
  if (!videoId) {
    return (
      <div className="w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-white text-lg">Link YouTube invalid</p>
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&mute=1&controls=1&loop=0`

  // Preconnect pentru YouTube pentru încărcare mai rapidă
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = 'https://www.youtube.com'
    document.head.appendChild(link)
    
    const link2 = document.createElement('link')
    link2.rel = 'preconnect'
    link2.href = 'https://i.ytimg.com'
    document.head.appendChild(link2)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(link2)
    }
  }, [])

  // Intersection Observer pentru lazy loading - începe încărcarea mult mai devreme
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shouldLoad) {
          setShouldLoad(true)
        }
      },
      { 
        threshold: 0.01,
        rootMargin: '1500px 0px 0px 0px' // Începe încărcarea când elementul este la 1500px deasupra viewport-ului
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [shouldLoad])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  // Când shouldLoad devine true, începem încărcarea iframe-ului imediat
  useEffect(() => {
    if (shouldLoad) {
      setIsVisible(true)
    }
  }, [shouldLoad])

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl relative"
      style={{
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}
    >
      {/* Glass effect layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-sm">Se încarcă videoclipul...</p>
          </div>
        </div>
      )}

      {isVisible ? (
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
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/30">
          <div className="text-center">
            <p className="text-white text-sm opacity-75">Videoclipul se va încărca când devine vizibil</p>
          </div>
        </div>
      )}
    </div>
  )
}


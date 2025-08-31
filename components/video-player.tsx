"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PlayCircle, Loader2 } from "lucide-react"

interface VideoPlayerProps {
  videoUrl: string
  title: string
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Check if video URL is valid
  if (!videoUrl || videoUrl.trim() === '') {
    return (
      <div className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl bg-gray-100">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📹</div>
            <p className="text-gray-600 mb-2">Rezolvare video indisponibilă</p>
            <p className="text-sm text-gray-500">Această problemă nu are încă o rezolvare video</p>
          </div>
        </div>
      </div>
    )
  }

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return ""
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`
      }
    }
    
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)

  // Intersection Observer to load video only when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    const videoContainer = document.getElementById('video-container')
    if (videoContainer) {
      observer.observe(videoContainer)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl bg-gray-100">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-gray-600">Nu s-a putut încărca videoclipul</p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Vezi pe YouTube
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="video-container" className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl">
      {isLoading && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Se încarcă videoclipul...</p>
          </div>
        </div>
      )}
      
      {isVisible && (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      )}
      
      {!isVisible && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Videoclipul se va încărca când devine vizibil</p>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import Image from 'next/image'

interface GlassImageCardProps {
  imageUrl: string
  alt?: string
}

export function GlassImageCard({ imageUrl, alt = "Sketch Demo" }: GlassImageCardProps) {
  return (
    <div 
      className="w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl relative"
      style={{
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}
    >
      {/* Glass effect layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Image */}
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
        />
      </div>
    </div>
  )
}


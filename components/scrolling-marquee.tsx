"use client"

import React, { useEffect, useState } from 'react'

interface ScrollingMarqueeProps {
  items: string[]
  speed?: number // Duration in seconds for one complete cycle
}

export default function ScrollingMarquee({ items, speed = 25 }: ScrollingMarqueeProps) {
  // Duplicate items for seamless looping
  const duplicatedItems = [...items, ...items]
  
  // Calculate mobile speed (faster on mobile - 60% of desktop speed)
  const mobileSpeed = speed * 0.6
  
  // Detect screen size
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="relative bg-[#0d1117] pt-10 pb-6 lg:pt-20 lg:pb-8 overflow-hidden">
      {/* Top divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-600" />
      
      {/* Glow effect from hero section */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent via-[#1a1b3a]/40 to-transparent opacity-70" />
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#2d1b69]/50 to-transparent opacity-60" />
      
      {/* Fade-out gradients on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0d1117] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-r from-transparent to-[#0d1117] z-10 pointer-events-none" />
      
      {/* Scrolling content - faster on mobile */}
      <div 
        className="flex whitespace-nowrap text-gray-400 text-lg font-medium tracking-wide"
        style={{
          animation: isMobile 
            ? `scroll-left ${mobileSpeed}s linear infinite`
            : `scroll-left ${speed}s linear infinite`
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={index} className="flex items-center mx-8">
            <span className="text-4xl mr-4 text-gray-400 filter grayscale">{getEmojiForText(item)}</span>
            <div className="flex flex-col">
              <span className="leading-tight">{item}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottom divider line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-600" />
    </section>
  )
}

// Helper function to get appropriate emoji for each text
function getEmojiForText(text: string): string {
  const textLower = text.toLowerCase()
  
  if (textLower.includes('video') || textLower.includes('lesson')) return '📺'
  if (textLower.includes('ai') || textLower.includes('smart')) return '🤖'
  if (textLower.includes('24/7') || textLower.includes('instant')) return '⚡'
  if (textLower.includes('physics') || textLower.includes('computer science')) return '🔬'
  if (textLower.includes('interactive') || textLower.includes('problem')) return '🧩'
  if (textLower.includes('platform') || textLower.includes('learning')) return '🎯'
  if (textLower.includes('personalized') || textLower.includes('study')) return '📚'
  if (textLower.includes('students') || textLower.includes('join')) return '👥'
  
  return '✨' // Default emoji
}

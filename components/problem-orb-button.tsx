"use client"

import { useState, useEffect } from "react"
import Orb from "@/components/orb"

const bubbleTexts = [
  "Psst, te-ai blocat..?",
  "Cred ca stiu eu..",
  "Vrei un sfat..?",
  "Ah, e simpla asta..",
  "Uite cum se rezolva.."
]

// Function to get a random text different from the current one
const getRandomDifferentText = (currentText: string): string => {
  const otherTexts = bubbleTexts.filter(text => text !== currentText)
  return otherTexts[Math.floor(Math.random() * otherTexts.length)]
}

interface ProblemOrbButtonProps {
  onOpenSidebar?: () => void
}

export default function ProblemOrbButton({ onOpenSidebar }: ProblemOrbButtonProps) {
  const [showBubble, setShowBubble] = useState(false)
  const [orbVisible, setOrbVisible] = useState(false)
  const [currentText, setCurrentText] = useState(bubbleTexts[0])
  const [isBubbleTransitioning, setIsBubbleTransitioning] = useState(false)

  // Fade-in animation for orb on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrbVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Show text bubble after 5 seconds with random initial text
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(true)
      // Set initial random text
      setCurrentText(bubbleTexts[Math.floor(Math.random() * bubbleTexts.length)])
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Change text every 15 seconds after bubble is shown with fade animation
  useEffect(() => {
    if (!showBubble) return

    const interval = setInterval(() => {
      // Start fade-out
      setIsBubbleTransitioning(true)
      
      // After fade-out animation (0.3s), change text and fade-in
      setTimeout(() => {
        setCurrentText(prevText => getRandomDifferentText(prevText))
        setIsBubbleTransitioning(false)
      }, 300) // Duration of fade-out
    }, 15000)

    return () => clearInterval(interval)
  }, [showBubble])

  return (
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
      style={{
        opacity: orbVisible ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <button
        className="rounded-full overflow-hidden hover:scale-105 active:scale-95 transition-all duration-200 bg-transparent"
        style={{
          width: '96px',
          height: '96px',
          padding: '8px',
        }}
        onClick={() => {
          onOpenSidebar?.()
        }}
        aria-label="Help button"
      >
        {/* Orb container with exact 80px size */}
        <div className="w-20 h-20 relative rounded-full overflow-hidden">
          {/* Animated orb in background */}
          <Orb hue={0} />
          {/* Circular background in the center - same color as text bubble */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[60px] h-[60px] rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
          </div>
        </div>
      </button>

      {/* Text bubble - positioned relative to the wrapper */}
      {showBubble && (
        <div
          className="absolute bottom-full right-0 mb-0 px-4 py-2 bg-black/80 backdrop-blur-md text-white text-sm rounded-lg shadow-lg border border-purple-400/30 whitespace-nowrap max-w-[200px] sm:max-w-none"
          style={{ 
            transform: isBubbleTransitioning 
              ? 'translateY(8px)' 
              : 'translateY(4px)',
            opacity: isBubbleTransitioning ? 0 : 1,
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
          }}
        >
          <span>{currentText}</span>
          {/* Arrow pointing to orb */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
        </div>
      )}
    </div>
  )
}


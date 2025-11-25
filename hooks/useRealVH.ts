'use client'

import { useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Hook to fix mobile viewport height issue caused by Chrome/Safari hiding the URL bar.
 * Sets a CSS variable --vh based on the real innerHeight, only on mobile devices.
 */
export function useRealVH() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const setVH = () => {
      // Only run on mobile devices (< 768px width)
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        return
      }

      // Calculate the real viewport height
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Set initial value
    setVH()

    // Debounce function for resize events
    let resizeTimeout: NodeJS.Timeout | null = null
    const debouncedResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      resizeTimeout = setTimeout(() => {
        setVH()
      }, 150)
    }

    // Update on resize (debounced)
    window.addEventListener('resize', debouncedResize)

    // Update on orientation change
    const handleOrientationChange = () => {
      // Small delay to ensure innerHeight is updated after orientation change
      setTimeout(setVH, 100)
    }
    window.addEventListener('orientationchange', handleOrientationChange)

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
    }
  }, [])
}


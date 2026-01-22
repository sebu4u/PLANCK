'use client'

import { useEffect } from 'react'

/**
 * Component to fix mobile Chrome address bar scroll issue
 * Prevents the address bar from hiding/showing on scroll which causes layout inconsistencies
 * 
 * NOTE: On Android Chrome, we disable the touchmove preventDefault logic because it can
 * cause scroll to be permanently blocked. We rely on CSS overscroll-behavior instead.
 */
export function MobileViewportFix() {
  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined') return
    
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (!isMobile) return

    // Detect Android Chrome - we skip touchmove preventDefault on this browser
    // because it can cause scroll to be permanently blocked
    const isAndroidChrome = /Android/i.test(navigator.userAgent) && /Chrome/i.test(navigator.userAgent)
    
    // On Android Chrome, we only rely on CSS overscroll-behavior (in globals.css)
    // This prevents the scroll blocking bug while still preventing pull-to-refresh via CSS
    if (isAndroidChrome) {
      // Only add a passive scroll listener to prevent negative scroll positions
      const handleScroll = () => {
        if (window.scrollY < 0) {
          window.scrollTo(0, 0)
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }

    // For iOS and other mobile browsers, use the full overscroll prevention logic
    let lastTouchY = 0
    
    const getScrollMetrics = () => {
      const scrollElement = document.scrollingElement || document.documentElement
      return {
        scrollTop: scrollElement.scrollTop,
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
      }
    }

    // Prevent pull-to-refresh and overscroll (iOS only)
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      
      // Check if the target is inside a scrollable container
      const scrollableParent = target.closest('[data-scrollable], .overflow-y-auto, .overflow-auto, [style*="overflow"]')
      
      // If inside a scrollable container, let it handle its own scroll
      if (scrollableParent) {
        return
      }
      
      const { scrollTop, scrollHeight, clientHeight } = getScrollMetrics()

      // Prevent overscroll at top (pull-to-refresh)
      if (e.cancelable && scrollTop <= 0 && e.touches[0].clientY > lastTouchY) {
        e.preventDefault()
      }
      // Prevent overscroll at bottom
      else if (e.cancelable && scrollTop + clientHeight >= scrollHeight - 1 && e.touches[0].clientY < lastTouchY) {
        e.preventDefault()
      }
    }

    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY
    }

    // Handle touch move - prevent address bar interaction
    const handleTouchMove = (e: TouchEvent) => {
      preventOverscroll(e)
      lastTouchY = e.touches[0].clientY
    }

    // Prevent default touch behaviors that cause address bar to hide
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    // Prevent scroll events that would trigger address bar hide
    const handleScroll = () => {
      if (window.scrollY < 0) {
        window.scrollTo(0, 0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return null
}

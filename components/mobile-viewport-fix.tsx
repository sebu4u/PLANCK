'use client'

import { useEffect } from 'react'

/**
 * Component to fix mobile Chrome address bar scroll issue
 * Prevents the address bar from hiding/showing on scroll which causes layout inconsistencies
 */
export function MobileViewportFix() {
  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined') return
    
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (!isMobile) return

    // Prevent the address bar from hiding by preventing overscroll
    let lastTouchY = 0
    const getScrollMetrics = () => {
      const scrollElement = document.scrollingElement || document.documentElement
      return {
        scrollTop: scrollElement.scrollTop,
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
      }
    }

    // Prevent pull-to-refresh and overscroll
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      
      // Check if the target is inside a scrollable container
      const scrollableParent = target.closest('[data-scrollable], .overflow-y-auto, .overflow-auto, [style*="overflow"]')
      
      // If not in a scrollable container, prevent overscroll on body
      if (!scrollableParent) {
        const { scrollTop, scrollHeight, clientHeight } = getScrollMetrics()

        // Prevent overscroll at top (pull-to-refresh)
        if (e.cancelable && scrollTop === 0 && e.touches[0].clientY > lastTouchY) {
          e.preventDefault()
        }
        // Prevent overscroll at bottom
        else if (e.cancelable && scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY < lastTouchY) {
          e.preventDefault()
        }
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
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // If scroll position goes negative, reset it
      if (currentScrollY < 0) {
        window.scrollTo(0, 0)
      }
      
      lastScrollY = currentScrollY
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


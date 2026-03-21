'use client'

import { useEffect } from 'react'

/**
 * Component to fix mobile viewport issues
 * 
 * On Android: Adds a safety mechanism to prevent body.overflow from getting stuck as "hidden"
 * On iOS: Uses preventDefault on touchmove at window scroll boundaries to reduce overscroll,
 * but skips when the gesture targets a nested overflow scroll container (window.scrollY is not authoritative there).
 */
export function MobileViewportFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isMobile = isAndroid || isIOS || window.innerWidth <= 768
    
    if (!isMobile) return

    // On Android: Add a safety mechanism to ensure scroll is never permanently blocked
    if (isAndroid) {
      // Check if there's actually a modal/dialog open
      const hasOpenModal = () => {
        // Check for common modal indicators
        const hasRadixDialog = document.querySelector('[data-state="open"][role="dialog"]')
        const hasRadixSheet = document.querySelector('[data-state="open"][data-radix-popper-content-wrapper]')
        const hasFixedOverlay = document.querySelector('.fixed.inset-0.z-\\[9999\\]')
        return hasRadixDialog || hasRadixSheet || hasFixedOverlay
      }
      
      // Safety check: If body.overflow is hidden but no modal is open, reset it
      const ensureScrollable = () => {
        const bodyStyle = document.body.style
        if (bodyStyle.overflow === 'hidden' && !hasOpenModal()) {
          bodyStyle.overflow = ''
          bodyStyle.position = ''
          bodyStyle.top = ''
          bodyStyle.left = ''
          bodyStyle.right = ''
        }
      }
      
      // Run safety check on page load and after any touch interaction
      ensureScrollable()
      
      // Also run periodically as a fallback (every 2 seconds)
      const intervalId = setInterval(ensureScrollable, 2000)
      
      // Run on touchend to catch cases where modals close
      const handleTouchEnd = () => {
        setTimeout(ensureScrollable, 100)
      }
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
      
      return () => {
        clearInterval(intervalId)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }

    // iOS-only: prevent overscroll at page boundaries
    if (isIOS) {
      let lastTouchY = 0

      const getScrollableOverflowAncestor = (start: Element | null): Element | null => {
        let el: Element | null = start
        while (el) {
          const style = window.getComputedStyle(el)
          const oy = style.overflowY
          if (
            (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
            el.scrollHeight > el.clientHeight + 1
          ) {
            return el
          }
          el = el.parentElement
        }
        return null
      }

      const handleTouchStart = (e: TouchEvent) => {
        lastTouchY = e.touches[0].clientY
      }

      const handleTouchMove = (e: TouchEvent) => {
        const scrollTop = window.scrollY
        const scrollHeight = document.documentElement.scrollHeight
        const clientHeight = window.innerHeight
        const currentTouchY = e.touches[0].clientY
        const isScrollingUp = currentTouchY > lastTouchY
        const isScrollingDown = currentTouchY < lastTouchY

        const touchTarget = e.target instanceof Element ? e.target : null
        const scrollableAnc = getScrollableOverflowAncestor(touchTarget)

        // Window scrollY stays 0 when the real scroll is inside overflow-y-auto; do not steal those gestures.
        if (scrollableAnc) {
          lastTouchY = currentTouchY
          return
        }

        // Only prevent default at the very top or bottom of the *window* scroll
        if (e.cancelable) {
          if (scrollTop <= 0 && isScrollingUp) {
            e.preventDefault()
          } else if (scrollTop + clientHeight >= scrollHeight && isScrollingDown) {
            e.preventDefault()
          }
        }

        lastTouchY = currentTouchY
      }

      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchmove', handleTouchMove, { passive: false })

      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', handleTouchMove)
      }
    }
  }, [])

  return null
}

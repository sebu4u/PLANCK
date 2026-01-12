'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ScrollAnimationProviderProps {
  children: React.ReactNode
  /**
   * Smoothness factor (0-1). Higher = smoother but more lag
   * @default 0.1
   */
  smoothness?: number
}

export default function ScrollAnimationProvider({
  children,
  smoothness = 0.1
}: ScrollAnimationProviderProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const scrollDataRef = useRef({
    current: 0,
    target: 0,
    ease: smoothness,
    rafId: 0
  })
  const isInitializedRef = useRef(false)

  // Check if device is touch-based
  const isTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }, [])

  // Lerp function for smooth interpolation
  const lerp = useCallback((start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }, [])

  // Set body height to match content for correct scrollbar
  const setBodyHeight = useCallback(() => {
    if (!contentRef.current || typeof document === 'undefined') return
    const height = contentRef.current.scrollHeight
    document.body.style.height = `${height}px`
  }, [])

  // Main smooth scroll animation
  const smoothScroll = useCallback(() => {
    const data = scrollDataRef.current

    if (!contentRef.current) {
      data.rafId = requestAnimationFrame(smoothScroll)
      return
    }

    // Update target from window scroll
    data.target = window.scrollY

    // Lerp current value towards target
    data.current = lerp(data.current, data.target, data.ease)

    // Round to avoid sub-pixel rendering issues
    const roundedCurrent = Math.round(data.current * 100) / 100

    // Apply GPU-accelerated transform
    contentRef.current.style.transform = `translate3d(0, ${-roundedCurrent}px, 0)`

    // Continue animation loop
    data.rafId = requestAnimationFrame(smoothScroll)
  }, [lerp])

  // Initialize smooth scroll
  useEffect(() => {
    if (typeof window === 'undefined' || isInitializedRef.current) return

    const content = contentRef.current
    const wrapper = wrapperRef.current

    if (!content || !wrapper) return

    // Disable smooth scroll on mobile to prevent address bar issues
    const isMobile = isTouchDevice()
    if (isMobile) {
      // On mobile, don't apply smooth scroll - use native scroll
      // This prevents the body height manipulation that causes address bar hiding
      isInitializedRef.current = true
      return
    }

    isInitializedRef.current = true

    scrollDataRef.current.ease = smoothness

    // Set initial styles for smooth scroll container
    wrapper.style.position = 'fixed'
    wrapper.style.top = '0'
    wrapper.style.left = '0'
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'
    wrapper.style.overflow = 'hidden'
    wrapper.style.zIndex = '1'

    // Enable hardware acceleration on content
    content.style.willChange = 'transform'

    // Set body height for native scrollbar
    setBodyHeight()

    // Handle resize
    const handleResize = () => {
      setBodyHeight()
    }

    // Initialize scroll position
    scrollDataRef.current.current = window.scrollY
    scrollDataRef.current.target = window.scrollY

    // Apply initial transform
    content.style.transform = `translate3d(0, ${-window.scrollY}px, 0)`

    // Start animation loop
    scrollDataRef.current.rafId = requestAnimationFrame(smoothScroll)

    // Add event listeners
    window.addEventListener('resize', handleResize, { passive: true })

    // Use MutationObserver to detect content changes and update height
    const mutationObserver = new MutationObserver(() => {
      setTimeout(setBodyHeight, 100)
    })

    mutationObserver.observe(content, {
      childList: true,
      subtree: true
    })

    // Recalculate height after images load
    const images = content.querySelectorAll('img')
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', setBodyHeight)
      }
    })

    // Cleanup
    return () => {
      cancelAnimationFrame(scrollDataRef.current.rafId)
      window.removeEventListener('resize', handleResize)
      mutationObserver.disconnect()
      isInitializedRef.current = false

      // Reset body height
      if (typeof document !== 'undefined') {
        document.body.style.height = ''
      }

      // Reset wrapper styles
      if (wrapper) {
        wrapper.style.position = ''
        wrapper.style.top = ''
        wrapper.style.left = ''
        wrapper.style.width = ''
        wrapper.style.height = ''
        wrapper.style.overflow = ''
        wrapper.style.zIndex = ''
      }

      // Reset content styles
      if (content) {
        content.style.willChange = ''
        content.style.transform = ''
      }
    }
  }, [isTouchDevice, setBodyHeight, smoothScroll, smoothness])

  // Scroll-triggered animations (existing functionality)
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const scrollAnimationSelector = '.scroll-animate-fade-up, .scroll-animate-slide-up, .scroll-animate-fade-left, .scroll-animate-fade-right, .scroll-animate-scale, .scroll-animate-transform-up'

    // Track observed elements to avoid duplicates
    const observedElements = new Set<Element>()

    // Function to check if an element is in viewport and add animate class
    const checkAndAnimateElement = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0

      if (isInViewport && !element.classList.contains('animate')) {
        element.classList.add('animate')
      }
    }

    // Function to observe an element
    const observeElement = (element: Element) => {
      if (!observedElements.has(element)) {
        // Check if element is already in viewport on initial load
        checkAndAnimateElement(element)
        // Also observe for future scroll events
        observer.observe(element)
        observedElements.add(element)
      }
    }

    // Create IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate')
          // Once animated, we can unobserve to improve performance
          observer.unobserve(entry.target)
          observedElements.delete(entry.target)
        }
      })
    }, observerOptions)

    // Function to find and observe all animation elements
    const observeAllElements = () => {
      const elements = document.querySelectorAll(scrollAnimationSelector)
      elements.forEach(observeElement)
    }

    // Initial observation - wait a bit to ensure DOM is ready
    const initialTimeout = setTimeout(() => {
      observeAllElements()
    }, 100)

    // Re-check after a delay to catch dynamically loaded content
    const delayedCheck = setTimeout(() => {
      observeAllElements()
    }, 500)

    // Use MutationObserver to watch for new elements being added to the DOM
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            // Check if the added node itself has animation classes
            if (element.matches && element.matches(scrollAnimationSelector)) {
              observeElement(element)
            }
            // Check if the added node contains elements with animation classes
            if (element.querySelectorAll) {
              const animatedChildren = element.querySelectorAll(scrollAnimationSelector)
              animatedChildren.forEach(observeElement)
            }
          }
        })
      })
    })

    // Start observing the document for changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Also check on load event (in case it fires after our initial check)
    const handleLoad = () => {
      observeAllElements()
    }
    window.addEventListener('load', handleLoad)

    return () => {
      clearTimeout(initialTimeout)
      clearTimeout(delayedCheck)
      observer.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('load', handleLoad)
      observedElements.clear()
    }
  }, [])

  return (
    <div ref={wrapperRef} className="smooth-scroll-wrapper">
      <div ref={contentRef} className="smooth-scroll-content">
        {children}
      </div>
    </div>
  )
}


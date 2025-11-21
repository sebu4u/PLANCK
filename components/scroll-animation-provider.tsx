'use client'

import { useEffect } from 'react'

export default function ScrollAnimationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const scrollAnimationSelector = '.scroll-animate-fade-up, .scroll-animate-slide-up, .scroll-animate-fade-left, .scroll-animate-fade-right, .scroll-animate-scale'

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

  return <>{children}</>
}

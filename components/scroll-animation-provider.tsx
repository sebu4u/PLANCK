'use client'

import { useEffect } from 'react'

export default function ScrollAnimationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate')
        }
      })
    }, observerOptions)

    // Observe all elements with scroll animation classes
    const elements = document.querySelectorAll(
      '.scroll-animate-fade-up, .scroll-animate-fade-left, .scroll-animate-fade-right, .scroll-animate-scale'
    )
    
    elements.forEach((el) => observer.observe(el))

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return <>{children}</>
}

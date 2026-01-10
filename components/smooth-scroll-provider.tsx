'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
}

interface SmoothScrollProviderProps {
    children: React.ReactNode
    /**
     * Smoothness factor (0-1). Higher = smoother but more lag
     * @default 0.08
     */
    smoothness?: number
    /**
     * Whether to enable smooth scroll on mobile
     * @default true
     */
    enableOnMobile?: boolean
}

export default function SmoothScrollProvider({
    children,
    smoothness = 0.08,
    enableOnMobile = true
}: SmoothScrollProviderProps) {
    const contentRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const scrollDataRef = useRef({
        current: 0,
        target: 0,
        ease: smoothness,
        rafId: 0,
        isScrolling: false
    })

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
        document.body.style.height = `${contentRef.current.scrollHeight}px`
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

        // Update ScrollTrigger
        ScrollTrigger.update()

        // Continue animation loop
        data.rafId = requestAnimationFrame(smoothScroll)
    }, [lerp])

    useEffect(() => {
        // Skip if not in browser
        if (typeof window === 'undefined') return

        // Check if we should disable on mobile
        if (!enableOnMobile && isTouchDevice()) return

        const content = contentRef.current
        const wrapper = wrapperRef.current

        if (!content || !wrapper) return

        // Set initial styles for smooth scroll container
        wrapper.style.position = 'fixed'
        wrapper.style.top = '0'
        wrapper.style.left = '0'
        wrapper.style.width = '100%'
        wrapper.style.height = '100%'
        wrapper.style.overflow = 'hidden'
        wrapper.style.willChange = 'transform'

        // Enable hardware acceleration on content
        content.style.willChange = 'transform'
        content.style.backfaceVisibility = 'hidden'
        content.style.perspective = '1000px'

        // Set body height for native scrollbar
        setBodyHeight()

        // Handle resize
        const handleResize = () => {
            setBodyHeight()
            ScrollTrigger.refresh()
        }

        // Configure ScrollTrigger for smooth scroll
        ScrollTrigger.defaults({
            scroller: wrapper
        })

        // Refresh on images load
        const handleLoad = () => {
            setBodyHeight()
            ScrollTrigger.refresh()
        }

        // Initialize scroll position
        scrollDataRef.current.current = window.scrollY
        scrollDataRef.current.target = window.scrollY

        // Start animation loop
        scrollDataRef.current.rafId = requestAnimationFrame(smoothScroll)

        // Add event listeners
        window.addEventListener('resize', handleResize, { passive: true })
        window.addEventListener('load', handleLoad)

        // Use MutationObserver to detect content changes
        const mutationObserver = new MutationObserver(() => {
            setBodyHeight()
        })

        mutationObserver.observe(content, {
            childList: true,
            subtree: true,
            attributes: true
        })

        // Cleanup
        return () => {
            cancelAnimationFrame(scrollDataRef.current.rafId)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('load', handleLoad)
            mutationObserver.disconnect()

            // Reset body height
            document.body.style.height = ''

            // Reset wrapper styles
            if (wrapper) {
                wrapper.style.position = ''
                wrapper.style.top = ''
                wrapper.style.left = ''
                wrapper.style.width = ''
                wrapper.style.height = ''
                wrapper.style.overflow = ''
                wrapper.style.willChange = ''
            }

            // Reset content styles
            if (content) {
                content.style.willChange = ''
                content.style.transform = ''
                content.style.backfaceVisibility = ''
                content.style.perspective = ''
            }

            // Kill ScrollTrigger instances
            ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
    }, [enableOnMobile, isTouchDevice, setBodyHeight, smoothScroll])

    return (
        <div ref={wrapperRef} className="smooth-scroll-wrapper">
            <div ref={contentRef} className="smooth-scroll-content">
                {children}
            </div>
        </div>
    )
}

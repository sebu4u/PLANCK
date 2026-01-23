'use client'

import { useEffect, useState } from 'react'
import { useCatalogTheme } from '@/components/catalog-theme-provider'

interface CatalogThemeBackgroundProps {
  children: React.ReactNode
  defaultBackgroundClass?: string
}

export function CatalogThemeBackground({ 
  children, 
  defaultBackgroundClass = 'bg-white' 
}: CatalogThemeBackgroundProps) {
  const { themeImage, isLoading, theme } = useCatalogTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Ensure we're mounted on the client before applying custom theme
  // This prevents hydration mismatch between server and client
  useEffect(() => {
    setMounted(true)
    // Detect mobile/touch devices
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // On initial render (server + first client render), always show default background
  // After hydration (mounted), check for custom theme
  const hasCustomTheme = mounted && themeImage && theme !== 'default'

  if (hasCustomTheme) {
    // We have a custom theme - show it after hydration
    return (
      <div className={`relative has-custom-theme`}>
        {/* Background image */}
        {/* NOTE: On mobile, avoid fixed positioning and background-attachment to prevent scroll bugs */}
        <div
          className={`${isMobile ? 'absolute' : 'fixed'} inset-0 z-0 bg-cover bg-center bg-no-repeat h-screen-mobile pointer-events-none`}
          style={{
            backgroundImage: `url(${themeImage})`,
            // backgroundAttachment: 'fixed' breaks scroll on Android Chrome - only use on desktop
            backgroundAttachment: isMobile ? 'scroll' : 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maxHeight: '100vh',
          }}
        />
        
        {/* Content overlay - ensures content is above background */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  // Show default background if no custom theme (or not yet mounted)
  return (
    <div className={`relative ${defaultBackgroundClass}`}>
      {children}
    </div>
  )
}


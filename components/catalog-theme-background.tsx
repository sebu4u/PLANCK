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

  // Ensure we're mounted on the client before applying custom theme
  // This prevents hydration mismatch between server and client
  useEffect(() => {
    setMounted(true)
  }, [])

  // On initial render (server + first client render), always show default background
  // After hydration (mounted), check for custom theme
  const hasCustomTheme = mounted && themeImage && theme !== 'default'

  if (hasCustomTheme) {
    // We have a custom theme - show it after hydration
    return (
      <div className={`relative has-custom-theme`}>
        {/* Fixed background image - stops before footer */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat h-screen-mobile"
          style={{
            backgroundImage: `url(${themeImage})`,
            backgroundAttachment: 'fixed',
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


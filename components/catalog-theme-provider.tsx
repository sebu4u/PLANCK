'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabaseClient'
import { CatalogType, ThemeId, getThemeImage, getTheme, PageType } from '@/lib/catalog-themes'

interface CatalogThemeContextValue {
  theme: ThemeId
  themeImage: string
  setTheme: (themeId: ThemeId) => Promise<void>
  isLoading: boolean
}

const CatalogThemeContext = createContext<CatalogThemeContextValue | null>(null)

interface CatalogThemeProviderProps {
  children: React.ReactNode
  catalogType: CatalogType
  pageType?: PageType
}

const THEME_STORAGE_KEY = 'catalog-theme-universal'

export function CatalogThemeProvider({ children, catalogType, pageType = 'list' }: CatalogThemeProviderProps) {
  const { user } = useAuth()
  // Initialize from localStorage immediately to avoid flash
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored && ['default', 'theme-1', 'theme-2', 'theme-3', 'theme-4'].includes(stored)) {
          return stored as ThemeId
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    return 'default'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch theme from database on mount - check both columns and use the one that exists
  // Use localStorage for instant loading, then sync with database
  useEffect(() => {
    if (!user) {
      // Clear localStorage if user is not authenticated
      try {
        localStorage.removeItem(THEME_STORAGE_KEY)
      } catch (e) {
        // Ignore
      }
      setThemeState('default')
      setIsLoading(false)
      return
    }

    const fetchTheme = async () => {
      try {
        // Fetch both theme columns to get the universal theme
        const { data, error } = await supabase
          .from('profiles')
          .select('catalog_theme_physics, catalog_theme_info')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('[CatalogTheme] Failed to fetch theme:', error)
          setThemeState('default')
        } else {
          // Use physics theme if exists, otherwise info theme, otherwise default
          const themeId = (data?.catalog_theme_physics || data?.catalog_theme_info || 'default') as ThemeId
          // Validate theme ID
          if (['default', 'theme-1', 'theme-2', 'theme-3', 'theme-4'].includes(themeId)) {
            setThemeState(themeId)
            // Update localStorage cache
            try {
              localStorage.setItem(THEME_STORAGE_KEY, themeId)
            } catch (e) {
              // Ignore localStorage errors
            }
          } else {
            setThemeState('default')
            try {
              localStorage.setItem(THEME_STORAGE_KEY, 'default')
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (error) {
        console.error('[CatalogTheme] Error fetching theme:', error)
        setThemeState('default')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTheme()
  }, [user])

  // Update theme in database - save to both columns for universal theme
  const setTheme = useCallback(async (themeId: ThemeId) => {
    if (!user) {
      console.warn('[CatalogTheme] Cannot set theme: user not authenticated')
      return
    }

    // Validate theme ID
    if (!['default', 'theme-1', 'theme-2', 'theme-3', 'theme-4'].includes(themeId)) {
      console.error('[CatalogTheme] Invalid theme ID:', themeId)
      return
    }

    try {
      // Update both columns simultaneously to make theme universal
      const { error } = await supabase
        .from('profiles')
        .update({ 
          catalog_theme_physics: themeId,
          catalog_theme_info: themeId
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('[CatalogTheme] Failed to update theme:', error)
        throw error
      }

      setThemeState(themeId)
      // Update localStorage cache immediately
      try {
        localStorage.setItem(THEME_STORAGE_KEY, themeId)
      } catch (e) {
        // Ignore localStorage errors
      }
    } catch (error) {
      console.error('[CatalogTheme] Error updating theme:', error)
      throw error
    }
  }, [user])

  // Get current theme image path
  const themeImage = getThemeImage(theme, catalogType, isMobile, pageType)

  const value: CatalogThemeContextValue = {
    theme,
    themeImage,
    setTheme,
    isLoading,
  }

  return (
    <CatalogThemeContext.Provider value={value}>
      {children}
    </CatalogThemeContext.Provider>
  )
}

export function useCatalogTheme() {
  const context = useContext(CatalogThemeContext)
  if (!context) {
    throw new Error('useCatalogTheme must be used within CatalogThemeProvider')
  }
  return context
}


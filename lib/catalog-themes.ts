/**
 * Catalog theme configuration
 * Each theme has images for physics and info catalogs, for list and detail pages
 */

export type CatalogType = 'physics' | 'info'
export type ThemeId = 'default' | 'theme-1' | 'theme-2' | 'theme-3' | 'theme-4'
export type PageType = 'list' | 'detail'

export interface ThemeImagePaths {
  physics: {
    desktop: string
    mobile: string
    detail?: string  // Same image for both mobile and desktop on detail page
  }
  info: {
    desktop: string
    mobile: string
    detail?: string  // Same image for both mobile and desktop on detail page
  }
}

export interface Theme {
  id: ThemeId
  name: string
  description: string
  images: ThemeImagePaths
}

export const THEMES: Record<ThemeId, Theme> = {
  'default': {
    id: 'default',
    name: 'Implicit',
    description: 'Fundal standard (fără imagine)',
    images: {
      physics: {
        desktop: '',
        mobile: '',
      },
      info: {
        desktop: '',
        mobile: '',
      },
    },
  },
  'theme-1': {
    id: 'theme-1',
    name: 'Tema 1',
    description: 'Prima temă personalizată',
    images: {
      physics: {
        desktop: '/themes/theme-1/physics-desktop.jpg',
        mobile: '/themes/theme-1/physics-mobile.jpg',
        detail: '/themes/theme-1/physics-problema.jpg',
      },
      info: {
        desktop: '/themes/theme-1/info-desktop.jpg',
        mobile: '/themes/theme-1/info-mobile.jpg',
        detail: '/themes/theme-1/info-problema.jpg',
      },
    },
  },
  'theme-2': {
    id: 'theme-2',
    name: 'Tema 2',
    description: 'A doua temă personalizată',
    images: {
      physics: {
        desktop: '/themes/theme-2/physics-desktop.jpg',
        mobile: '/themes/theme-2/physics-mobile.jpg',
        detail: '/themes/theme-2/physics-problema.jpg',
      },
      info: {
        desktop: '/themes/theme-2/info-desktop.jpg',
        mobile: '/themes/theme-2/info-mobile.jpg',
        detail: '/themes/theme-2/info-problema.jpg',
      },
    },
  },
  'theme-3': {
    id: 'theme-3',
    name: 'Tema 3',
    description: 'A treia temă personalizată',
    images: {
      physics: {
        desktop: '/themes/theme-3/physics-desktop.jpg',
        mobile: '/themes/theme-3/physics-mobile.jpg',
        detail: '/themes/theme-3/physics-problema.jpg',
      },
      info: {
        desktop: '/themes/theme-3/info-desktop.jpg',
        mobile: '/themes/theme-3/info-mobile.jpg',
        detail: '/themes/theme-3/info-problema.jpg',
      },
    },
  },
  'theme-4': {
    id: 'theme-4',
    name: 'Tema 4',
    description: 'A patra temă personalizată',
    images: {
      physics: {
        desktop: '/themes/theme-4/physics-desktop.jpg',
        mobile: '/themes/theme-4/physics-mobile.jpg',
        detail: '/themes/theme-4/physics-problema.jpg',
      },
      info: {
        desktop: '/themes/theme-4/info-desktop.jpg',
        mobile: '/themes/theme-4/info-mobile.jpg',
        detail: '/themes/theme-4/info-problema.jpg',
      },
    },
  },
}

/**
 * Get theme by ID
 */
export function getTheme(themeId: ThemeId): Theme {
  return THEMES[themeId] || THEMES.default
}

/**
 * Get image path for a theme and catalog type
 * Returns empty string for default theme or if not found
 */
export function getThemeImage(
  themeId: ThemeId,
  catalogType: CatalogType,
  isMobile: boolean = false,
  pageType: PageType = 'list'
): string {
  if (themeId === 'default') {
    return ''
  }
  
  const theme = THEMES[themeId]
  if (!theme) {
    return ''
  }
  
  const images = theme.images[catalogType]
  
  // For detail pages, use the same image for both mobile and desktop
  // Use detail image if available, otherwise fall back to desktop image
  if (pageType === 'detail') {
    return images.detail || images.desktop
  }
  
  // For list pages, use regular images (different for mobile and desktop)
  return isMobile 
    ? images.mobile 
    : images.desktop
}

/**
 * Get all available themes (excluding default)
 */
export function getAvailableThemes(): Theme[] {
  return Object.values(THEMES).filter(theme => theme.id !== 'default')
}


'use client'

import { useEffect, useState } from 'react'

export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export interface CookieInfo {
  name: string
  purpose: string
  duration: string
  category: 'essential' | 'analytics' | 'marketing'
}

const STORAGE_KEY = 'planck_cookie_preferences'
const CONSENT_VERSION = '1.0'
const COOKIE_PREFERENCES_UPDATED_EVENT = 'planck-cookie-preferences-updated'

export class CookieManager {
  private static instance: CookieManager
  private preferences: CookiePreferences | null = null

  static getInstance(): CookieManager {
    if (!CookieManager.instance) {
      CookieManager.instance = new CookieManager()
    }
    return CookieManager.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences()
    }
  }

  private emitPreferencesChanged(): void {
    if (typeof window === 'undefined') return

    window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_UPDATED_EVENT, {
      detail: { preferences: this.preferences }
    }))
  }

  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const version = localStorage.getItem(`${STORAGE_KEY}_version`)
      
      if (saved && version === CONSENT_VERSION) {
        this.preferences = JSON.parse(saved)
      } else {
        this.preferences = null
      }
    } catch (error) {
      console.error('Error loading cookie preferences:', error)
      this.preferences = null
    }
  }

  getPreferences(): CookiePreferences | null {
    return this.preferences
  }

  hasConsent(): boolean {
    return this.preferences !== null
  }

  hasAnalyticsConsent(): boolean {
    return this.preferences?.analytics ?? false
  }

  hasMarketingConsent(): boolean {
    return this.preferences?.marketing ?? false
  }

  savePreferences(preferences: CookiePreferences): void {
    try {
      this.preferences = preferences
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      localStorage.setItem(`${STORAGE_KEY}_version`, CONSENT_VERSION)
      this.emitPreferencesChanged()
    } catch (error) {
      console.error('Error saving cookie preferences:', error)
    }
  }

  clearPreferences(): void {
    try {
      this.preferences = null
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(`${STORAGE_KEY}_version`)
      this.emitPreferencesChanged()
    } catch (error) {
      console.error('Error clearing cookie preferences:', error)
    }
  }

  reloadPreferences(): void {
    this.loadPreferences()
    this.emitPreferencesChanged()
  }

  // Cookie-uri specifice pentru PLANCK
  static getCookieInfo(): CookieInfo[] {
    return [
      // Essential cookies
      {
        name: 'supabase_session',
        purpose: 'Păstrează sesiunea de autentificare utilizator',
        duration: 'Sesiune (se șterge la închiderea browser-ului)',
        category: 'essential'
      },
      {
        name: 'theme_preference',
        purpose: 'Păstrează preferința de temă (dark/light)',
        duration: '1 an',
        category: 'essential'
      },
      {
        name: 'user_preferences',
        purpose: 'Păstrează setările personale ale utilizatorului',
        duration: '1 an',
        category: 'essential'
      },
      
      // Analytics cookies
      {
        name: '_ga',
        purpose: 'Identifică utilizatorii unici pentru Google Analytics',
        duration: '2 ani',
        category: 'analytics'
      },
      {
        name: '_ga_[ID]',
        purpose: 'Stochează ID-ul de sesiune pentru Google Analytics',
        duration: '2 ani',
        category: 'analytics'
      },
      {
        name: '_gid',
        purpose: 'Identifică utilizatorii pentru Google Analytics (24h)',
        duration: '24 ore',
        category: 'analytics'
      },
      
      // Marketing cookies
      {
        name: 'newsletter_tracking',
        purpose: 'Urmărește abonarea la newsletter și comunicările',
        duration: '1 an',
        category: 'marketing'
      }
    ]
  }

  // Verifică dacă un cookie specific este permis
  isCookieAllowed(cookieName: string): boolean {
    if (!this.preferences) return false

    const cookieInfo = CookieManager.getCookieInfo().find(c => c.name === cookieName)
    if (!cookieInfo) return false

    switch (cookieInfo.category) {
      case 'essential':
        return true
      case 'analytics':
        return this.preferences.analytics
      case 'marketing':
        return this.preferences.marketing
      default:
        return false
    }
  }

  // Obține toate cookie-urile permise
  getAllowedCookies(): CookieInfo[] {
    if (!this.preferences) return []

    return CookieManager.getCookieInfo().filter(cookie => {
      switch (cookie.category) {
        case 'essential':
          return true
        case 'analytics':
          return this.preferences!.analytics
        case 'marketing':
          return this.preferences!.marketing
        default:
          return false
      }
    })
  }
}

// Hook pentru a folosi CookieManager în componente React
export function useCookieManager() {
  const manager = CookieManager.getInstance()

  const [preferences, setPreferences] = useState<CookiePreferences | null>(() => manager.getPreferences())

  useEffect(() => {
    const syncPreferences = () => {
      setPreferences(manager.getPreferences())
    }

    const handlePreferencesChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ preferences?: CookiePreferences | null }>
      setPreferences(customEvent.detail?.preferences ?? manager.getPreferences())
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === `${STORAGE_KEY}_version`) {
        manager.reloadPreferences()
      }
    }

    syncPreferences()
    window.addEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, handlePreferencesChanged as EventListener)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_UPDATED_EVENT, handlePreferencesChanged as EventListener)
      window.removeEventListener('storage', handleStorage)
    }
  }, [manager])

  return {
    preferences,
    hasConsent: preferences !== null,
    hasAnalyticsConsent: preferences?.analytics ?? false,
    hasMarketingConsent: preferences?.marketing ?? false,
    savePreferences: (prefs: CookiePreferences) => manager.savePreferences(prefs),
    clearPreferences: () => manager.clearPreferences(),
    isCookieAllowed: (name: string) => manager.isCookieAllowed(name),
    getAllowedCookies: () => manager.getAllowedCookies(),
    cookieInfo: CookieManager.getCookieInfo()
  }
}

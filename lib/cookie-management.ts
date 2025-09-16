'use client'

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
    } catch (error) {
      console.error('Error saving cookie preferences:', error)
    }
  }

  clearPreferences(): void {
    try {
      this.preferences = null
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(`${STORAGE_KEY}_version`)
    } catch (error) {
      console.error('Error clearing cookie preferences:', error)
    }
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
  
  return {
    preferences: manager.getPreferences(),
    hasConsent: manager.hasConsent(),
    hasAnalyticsConsent: manager.hasAnalyticsConsent(),
    hasMarketingConsent: manager.hasMarketingConsent(),
    savePreferences: (prefs: CookiePreferences) => manager.savePreferences(prefs),
    clearPreferences: () => manager.clearPreferences(),
    isCookieAllowed: (name: string) => manager.isCookieAllowed(name),
    getAllowedCookies: () => manager.getAllowedCookies(),
    cookieInfo: CookieManager.getCookieInfo()
  }
}

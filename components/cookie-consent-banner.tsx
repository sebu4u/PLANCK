'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'planck_cookie_preferences'
const CONSENT_VERSION = '1.0'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Verifică dacă utilizatorul a dat deja consimțământul
    const savedPreferences = localStorage.getItem(STORAGE_KEY)
    const savedVersion = localStorage.getItem(`${STORAGE_KEY}_version`)
    
    if (!savedPreferences || savedVersion !== CONSENT_VERSION) {
      setShowBanner(true)
    } else {
      const prefs = JSON.parse(savedPreferences)
      setPreferences(prefs)
      // Initializează serviciile bazate pe preferințe
      initializeServices(prefs)
    }
  }, [])

  const initializeServices = (prefs: CookiePreferences) => {
    // Initializează Google Analytics dacă este acceptat
    if (prefs.analytics && typeof window !== 'undefined') {
      // Load Google Analytics script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`
      document.head.appendChild(script)

      // Initialize gtag
      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }
      window.gtag = gtag
      gtag('js', new Date())
      gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      })
    }
  }

  const handleAcceptAll = () => {
    const newPreferences = {
      essential: true,
      analytics: true,
      marketing: true
    }
    setPreferences(newPreferences)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    localStorage.setItem(`${STORAGE_KEY}_version`, CONSENT_VERSION)
    setShowBanner(false)
    initializeServices(newPreferences)
  }

  const handleRejectAll = () => {
    const newPreferences = {
      essential: true,
      analytics: false,
      marketing: false
    }
    setPreferences(newPreferences)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    localStorage.setItem(`${STORAGE_KEY}_version`, CONSENT_VERSION)
    setShowBanner(false)
    initializeServices(newPreferences)
  }

  const handleSaveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    localStorage.setItem(`${STORAGE_KEY}_version`, CONSENT_VERSION)
    setShowBanner(false)
    setShowSettings(false)
    initializeServices(preferences)
  }

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return // Essential cookies nu pot fi dezactivate
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-5xl mx-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl overflow-hidden sm:max-h-[90vh] sm:flex sm:flex-col">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-1 sm:flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl">
            <div className="p-6 sm:max-h-[80vh] sm:overflow-y-auto">
          {!showSettings ? (
            // Banner principal
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🍪</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Cookie-uri pentru o experiență personalizată
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    PLANCK folosește cookie-uri pentru a-ți oferi o experiență personalizată, 
                    pentru a analiza traficul site-ului și pentru a îmbunătăți conținutul educațional. 
                    Cookie-urile esențiale sunt necesare pentru funcționarea site-ului.
                  </p>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <Link href="/termeni" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Citește mai multe în Termenii și Condițiile noastre
                    </Link>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Acceptă toate
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Personalizează
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="flex-1 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  Respinge toate
                </Button>
              </div>
            </div>
          ) : (
            // Setări detaliate
            <div className="space-y-4">
              <div className="flex items-center justify-between sm:sticky sm:top-0 bg-white dark:bg-gray-900 py-2 sm:z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Setări Cookie-uri
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 sm:max-h-[50vh] sm:overflow-y-auto sm:pr-2">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-sm sm:text-lg">
                      🛡️ Esențiale
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      Funcționare de bază
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      <strong>Cookie-uri:</strong> supabase_session, theme_preference, user_preferences
                    </div>
                  </div>
                  <div className="flex items-center ml-4">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">Obligatoriu</span>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-sm sm:text-lg">
                      📊 Analytics
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      Analiză utilizare
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      <strong>Cookie-uri:</strong> _ga, _gid, _gat (Google Analytics)
                    </div>
                  </div>
                  <div className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-sm sm:text-lg">
                      📧 Marketing
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      Newsletter
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      <strong>Cookie-uri:</strong> newsletter_tracking
                    </div>
                  </div>
                  <div className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sm:sticky sm:bottom-0 bg-white dark:bg-gray-900 py-2 sm:z-10">
                <Button
                  onClick={handleSaveSettings}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Salvează preferințele
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="flex-1 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 font-semibold py-3 rounded-xl transition-all duration-200"
                >
                  Anulează
                </Button>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Declarăm gtag global pentru TypeScript
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

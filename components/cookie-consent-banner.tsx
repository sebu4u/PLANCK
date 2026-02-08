'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STORAGE_KEY = 'planck_cookie_preferences'
const CONSENT_VERSION = '1.0'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verifică dacă utilizatorul a dat deja consimțământul
    const savedPreferences = localStorage.getItem(STORAGE_KEY)
    const savedVersion = localStorage.getItem(`${STORAGE_KEY}_version`)
    
    if (!savedPreferences || savedVersion !== CONSENT_VERSION) {
      setShowBanner(true)
    } else {
      const prefs = JSON.parse(savedPreferences)
      // Initializează serviciile bazate pe preferințe
      initializeServices(prefs)
    }
  }, [])

  const initializeServices = (prefs: any) => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    localStorage.setItem(`${STORAGE_KEY}_version`, CONSENT_VERSION)
    setShowBanner(false)
    initializeServices(newPreferences)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="max-w-sm rounded-2xl bg-white px-5 py-4 shadow-xl border border-gray-200">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Preferințe cookie
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              PLANCK folosește cookie-uri pentru a funcționa corect și pentru a analiza
              modul în care este folosită platforma. Îți poți ajusta oricând opțiunile
              din setările de confidențialitate.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="min-w-0 flex-1 border-gray-300 bg-white text-xs font-medium text-gray-900 hover:bg-gray-50"
                asChild
              >
                <Link href="/confidentialitate">
                  Gestionează cookie-urile
                </Link>
              </Button>
              <Button
                onClick={handleRejectAll}
                variant="outline"
                className="min-w-0 flex-1 bg-gray-100 text-xs font-medium text-gray-900 hover:bg-gray-200 border-transparent"
              >
                Respinge tot
              </Button>
            </div>

            <Button
              onClick={handleAcceptAll}
              className="w-full bg-black text-xs font-semibold text-white hover:bg-gray-900"
            >
              Acceptă tot
            </Button>
          </div>

          <button
            type="button"
            className="text-[11px] text-gray-500 underline-offset-2 hover:underline text-left"
          >
            Vezi partenerii noștri
          </button>
        </div>
      </div>
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

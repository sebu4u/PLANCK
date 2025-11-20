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
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-black border border-white rounded-lg p-4 max-w-sm shadow-lg">
        <div className="space-y-3">
          <div>
            <h3 className="text-white text-sm font-medium mb-1">
              Acceptă cookie-uri?
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              PLANCK folosește cookie-uri pentru a-ți oferi o experiență personalizată.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAcceptAll}
              className="flex-1 bg-white text-black hover:bg-gray-100 text-xs font-medium py-2 px-3 rounded transition-colors"
            >
              Acceptă tot
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="flex-1 border border-white text-white hover:bg-white hover:text-black text-xs font-medium py-2 px-3 rounded transition-colors bg-transparent"
            >
              Respinge tot
            </Button>
          </div>
          
          <div className="text-xs">
            <Link href="/termeni" className="text-gray-400 hover:text-white transition-colors">
              Citește mai multe
            </Link>
          </div>
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

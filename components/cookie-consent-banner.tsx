'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCookieManager, type CookiePreferences } from '@/lib/cookie-management'

export function CookieConsentBanner() {
  const cookieManager = useCookieManager()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const savePreferences = (preferences: CookiePreferences) => {
    cookieManager.savePreferences(preferences)
  }

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true
    })
  }

  const handleRejectAll = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false
    })
  }

  // Avoid SSR/client mismatches caused by localStorage-backed consent state.
  if (!mounted || cookieManager.hasConsent) return null

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

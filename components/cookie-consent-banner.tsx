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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-auto md:right-4 md:w-auto">
      <div className="w-full rounded-t-2xl border border-gray-200 border-b-0 bg-white px-3 pt-3 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] shadow-xl md:max-w-sm md:rounded-2xl md:border-b md:px-5 md:py-4 md:pb-4">
        <div className="space-y-2 md:space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-gray-900 md:text-sm">
              Preferințe cookie
            </h3>
            <p className="mt-1 text-[11px] leading-snug text-gray-600 line-clamp-2 md:text-xs md:leading-relaxed md:line-clamp-none">
              PLANCK folosește cookie-uri pentru a funcționa corect și pentru a analiza
              modul în care este folosită platforma. Îți poți ajusta oricând opțiunile
              din setările de confidențialitate.
            </p>
          </div>

          {/* Mobil: bară compactă lipită de ecran */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRejectAll}
                variant="outline"
                size="sm"
                className="border-transparent bg-gray-100 text-[11px] font-medium text-gray-900 hover:bg-gray-200"
              >
                Respinge tot
              </Button>
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="bg-black text-[11px] font-semibold text-white hover:bg-gray-900"
              >
                Acceptă tot
              </Button>
            </div>
            <Link
              href="/confidentialitate"
              className="text-center text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              Gestionează cookie-urile
            </Link>
          </div>

          {/* Desktop: layout neschimbat */}
          <div className="hidden flex-col gap-2 md:flex">
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
            className="hidden text-left text-[11px] text-gray-500 underline-offset-2 hover:underline md:block"
          >
            Vezi partenerii noștri
          </button>
        </div>
      </div>
    </div>
  )
}

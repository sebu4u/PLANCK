'use client'

import { CookieManager } from '@/lib/cookie-management'
import { EARLYBIRD_YEARLY_RON } from '@/lib/landing-earlybird'
import { getCampaignPriceRon } from '@/lib/pricing-campaign'
import type { PremiumBillingInterval } from '@/components/pricing/premium-pricing'

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1082544554271149'
export const META_CURRENCY = 'RON'

const PENDING_CHECKOUT_KEY = 'meta_pending_checkout'
const PURCHASE_PREFIX = 'meta_purchase_'
const REGISTRATION_PREFIX = 'meta_registration_'

type FbqFunction = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  loaded: boolean
  version: string
  push: FbqFunction
}

export type MetaIdentifyInput = {
  email?: string | null
  phone?: string | null
  externalId?: string | null
}

export type MetaCommerceParams = {
  content_ids: string[]
  content_type: 'product' | 'product_group'
  content_name: string
  value: number
  currency: string
}

export type MetaCheckoutOffer = {
  interval: PremiumBillingInterval
  value: number
  contentName: string
  campaign?: 'earlybird'
}

function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  return trimmed.includes('@') ? trimmed : null
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '')
  if (!digits) return null

  let e164 = digits
  if (e164.startsWith('00')) e164 = `+${e164.slice(2)}`
  if (e164.startsWith('07') && e164.length === 10) e164 = `+4${e164}`
  if (e164.startsWith('40') && !e164.startsWith('+')) e164 = `+${e164}`
  if (!e164.startsWith('+') && e164.length >= 8) e164 = `+${e164}`
  if (!e164.startsWith('+') || e164.length < 10) return null
  return e164
}

function premiumName(interval: PremiumBillingInterval, campaign?: 'earlybird'): string {
  if (campaign === 'earlybird' && interval === 'year') return 'Planck Premium anual earlybird'
  if (interval === 'week') return 'Planck Premium săptămânal'
  if (interval === 'year') return 'Planck Premium anual'
  return 'Planck Premium lunar'
}

function premiumCommerceParams(
  interval: PremiumBillingInterval,
  options?: { value?: number; campaign?: 'earlybird' },
): MetaCommerceParams {
  const value = options?.value ?? (
    options?.campaign === 'earlybird' && interval === 'year'
      ? EARLYBIRD_YEARLY_RON
      : getCampaignPriceRon(interval)
  )
  const contentId = options?.campaign === 'earlybird' ? `premium_${interval}_earlybird` : `premium_${interval}`
  return {
    content_ids: [contentId],
    content_type: 'product',
    content_name: premiumName(interval, options?.campaign),
    value,
    currency: META_CURRENCY,
  }
}

function namedContent(contentId: string, contentName: string, value = 0): MetaCommerceParams {
  return {
    content_ids: [contentId],
    content_type: 'product',
    content_name: contentName,
    value,
    currency: META_CURRENCY,
  }
}

function rememberCheckoutOffer(offer: MetaCheckoutOffer): void {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(offer))
  } catch {
    // ignore
  }
}

function readCheckoutOffer(): MetaCheckoutOffer | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MetaCheckoutOffer
  } catch {
    return null
  }
}

function markOnce(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return true
  }
}

class MetaPixel {
  private static instance: MetaPixel
  private isInitialized = false
  private lastPagePath = ''
  private lastPageAt = 0
  private pendingUser: MetaIdentifyInput = {}

  static getInstance(): MetaPixel {
    if (!MetaPixel.instance) {
      MetaPixel.instance = new MetaPixel()
    }
    return MetaPixel.instance
  }

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    if (!CookieManager.getInstance().hasMarketingConsent()) return
    if (!META_PIXEL_ID) return

    if (!window.fbq) {
      const n = function (...args: unknown[]) {
        if (n.callMethod) {
          n.callMethod(...args)
        } else {
          n.queue.push(args)
        }
      } as FbqFunction
      window.fbq = n
      if (!window._fbq) window._fbq = n
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      const firstScript = document.getElementsByTagName('script')[0]
      firstScript?.parentNode?.insertBefore(script, firstScript)
    }

    const fbq = window.fbq
    if (!fbq) return

    const userData = this.toAdvancedMatching(this.pendingUser)
    if (userData) {
      fbq('init', META_PIXEL_ID, userData)
    } else {
      fbq('init', META_PIXEL_ID)
    }

    this.isInitialized = true
  }

  private canSend(): boolean {
    if (typeof window === 'undefined') return false
    if (!CookieManager.getInstance().hasMarketingConsent()) return false
    this.initialize()
    return this.isInitialized && typeof window.fbq === 'function'
  }

  private toAdvancedMatching(input: MetaIdentifyInput): Record<string, string> | null {
    const payload: Record<string, string> = {}
    const email = input.email ? normalizeEmail(input.email) : null
    const phone = input.phone ? normalizePhone(input.phone) : null
    const externalId = input.externalId?.trim() || null

    if (email) payload.em = email
    if (phone) payload.ph = phone
    if (externalId) payload.external_id = externalId
    return Object.keys(payload).length > 0 ? payload : null
  }

  identify(input: MetaIdentifyInput): void {
    this.pendingUser = {
      email: input.email ?? this.pendingUser.email,
      phone: input.phone ?? this.pendingUser.phone,
      externalId: input.externalId ?? this.pendingUser.externalId,
    }
    if (!this.canSend()) return

    const userData = this.toAdvancedMatching(this.pendingUser)
    if (!userData) return
    window.fbq?.('init', META_PIXEL_ID, userData)
  }

  page(): void {
    if (!this.canSend()) return
    const path = window.location.pathname
    const now = Date.now()
    if (path === this.lastPagePath && now - this.lastPageAt < 1500) return
    this.lastPagePath = path
    this.lastPageAt = now
    window.fbq?.('track', 'PageView')
  }

  track(event: string, params?: Record<string, unknown>): void {
    if (!this.canSend()) return
    if (params) {
      window.fbq?.('track', event, params)
      return
    }
    window.fbq?.('track', event)
  }

  private trackCommerce(event: string, params: MetaCommerceParams): void {
    this.track(event, {
      content_ids: params.content_ids,
      content_type: params.content_type,
      content_name: params.content_name,
      value: params.value,
      currency: params.currency,
    })
  }

  trackViewContent(params: MetaCommerceParams): void {
    this.trackCommerce('ViewContent', params)
  }

  trackLead(contentId: string, contentName: string): void {
    this.trackCommerce('Lead', namedContent(contentId, contentName))
  }

  trackContact(contentId: string, contentName: string): void {
    this.trackCommerce('Contact', namedContent(contentId, contentName))
  }

  trackCompleteRegistration(params: MetaCommerceParams, onceKey?: string): void {
    if (onceKey && !markOnce(`${REGISTRATION_PREFIX}${onceKey}`)) return
    this.trackCommerce('CompleteRegistration', params)
  }

  trackCheckoutStart(offer: MetaCheckoutOffer): void {
    const params = premiumCommerceParams(offer.interval, {
      value: offer.value,
      campaign: offer.campaign,
    })
    rememberCheckoutOffer(offer)
    this.trackCommerce('AddToCart', params)
    this.trackCommerce('InitiateCheckout', params)
  }

  trackCheckoutPaymentInfo(offer: MetaCheckoutOffer): void {
    this.trackCommerce(
      'AddPaymentInfo',
      premiumCommerceParams(offer.interval, {
        value: offer.value,
        campaign: offer.campaign,
      }),
    )
  }

  trackCheckoutSuccess(sessionId?: string | null): void {
    try {
      const recent = Number(sessionStorage.getItem('meta_purchase_recent') || 0)
      if (recent && Date.now() - recent < 8000) return
    } catch {
      // ignore
    }

    const key = sessionId?.trim()
    if (!key) return
    if (!markOnce(`${PURCHASE_PREFIX}${key}`)) return

    try {
      sessionStorage.setItem('meta_purchase_recent', String(Date.now()))
    } catch {
      // ignore
    }

    const offer = readCheckoutOffer()
    const params = offer
      ? premiumCommerceParams(offer.interval, { value: offer.value, campaign: offer.campaign })
      : premiumCommerceParams('month')

    this.trackCommerce('Purchase', params)
    this.trackCommerce('Subscribe', params)
    if (offer?.interval === 'week') {
      this.trackCommerce('StartTrial', params)
    }
  }

  trackViewContentForPath(pathname: string): void {
    if (pathname === '/pricing' || pathname === '/abonament') {
      this.trackViewContent(premiumCommerceParams('year', { campaign: 'earlybird' }))
      return
    }
    if (pathname === '/landing' || pathname === '/rezerva' || pathname === '/1leu') {
      if (pathname === '/1leu') {
        this.trackViewContent({
          content_ids: ['premium_year_1leu'],
          content_type: 'product',
          content_name: 'Planck Premium anual 1 leu',
          value: 1,
          currency: META_CURRENCY,
        })
        return
      }
      this.trackViewContent(premiumCommerceParams('year', { campaign: 'earlybird' }))
      if (pathname === '/rezerva') {
        this.trackCommerce(
          'Schedule',
          namedContent('rezerva', 'Rezervare loc Premium', EARLYBIRD_YEARLY_RON),
        )
      }
      return
    }
    if (pathname === '/shop') {
      this.trackViewContent({
        content_ids: ['shop'],
        content_type: 'product_group',
        content_name: 'Planck Shop',
        value: 0,
        currency: META_CURRENCY,
      })
      return
    }
    if (pathname === '/pregatire' || pathname.startsWith('/pregatire/')) {
      this.trackViewContent({
        content_ids: ['pregatire'],
        content_type: 'product_group',
        content_name: 'Pregătiri live Planck',
        value: getCampaignPriceRon('week'),
        currency: META_CURRENCY,
      })
      return
    }
    if (pathname === '/gratuit') {
      this.trackViewContent(namedContent('webinar', 'Webinar Planck'))
      return
    }
    if (pathname === '/gratuit/confirmare') {
      this.trackLead('webinar', 'Webinar Planck')
      return
    }
    if (pathname === '/planck-week') {
      this.trackViewContent(namedContent('planck_week', 'Planck Week'))
      return
    }
  }
}

export const metaPixel = MetaPixel.getInstance()

export function persistMetaClickId(): void {
  if (typeof window === 'undefined') return
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')?.trim()
  if (!fbclid) return
  document.cookie = `fbclid=${encodeURIComponent(fbclid)}; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax`
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: FbqFunction
  }
}

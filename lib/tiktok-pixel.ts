'use client'

import { CookieManager } from '@/lib/cookie-management'
import { EARLYBIRD_YEARLY_RON } from '@/lib/landing-earlybird'
import { getCampaignPriceRon } from '@/lib/pricing-campaign'
import {
  type PremiumBillingInterval,
} from '@/components/pricing/premium-pricing'
import { TIKTOK_CURRENCY, TIKTOK_PIXEL_ID, tiktokEventId } from '@/lib/tiktok-constants'

const PENDING_CHECKOUT_KEY = 'ttq_pending_checkout'
const PURCHASE_PREFIX = 'ttq_purchase_'
const REGISTRATION_PREFIX = 'ttq_registration_'

type TikTokQueue = {
  page: () => void
  track: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void
  identify: (params: Record<string, string>) => void
  load: (pixelId: string, options?: Record<string, unknown>) => void
  enableCookie: () => void
  grantConsent: () => void
}

export type TikTokContent = {
  content_id: string
  content_type: 'product' | 'product_group'
  content_name: string
}

export type TikTokCommerceParams = {
  contents: TikTokContent[]
  value: number
  currency: string
  search_string?: string
}

export type TikTokIdentifyInput = {
  email?: string | null
  phone?: string | null
  externalId?: string | null
}

export type TikTokCheckoutOffer = {
  interval: PremiumBillingInterval
  value: number
  contentName: string
  campaign?: 'earlybird'
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
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

function namedContent(
  contentId: string,
  contentName: string,
  value = 0,
): TikTokCommerceParams {
  return {
    contents: [
      {
        content_id: contentId,
        content_type: 'product',
        content_name: contentName,
      },
    ],
    value,
    currency: TIKTOK_CURRENCY,
  }
}

export function premiumCheckoutValue(
  interval: PremiumBillingInterval,
  campaign?: 'earlybird',
): number {
  if (campaign === 'earlybird' && interval === 'year') return EARLYBIRD_YEARLY_RON
  return getCampaignPriceRon(interval)
}

export function premiumCommerceParams(
  interval: PremiumBillingInterval,
  options?: { value?: number; campaign?: 'earlybird' },
): TikTokCommerceParams {
  const value = options?.value ?? premiumCheckoutValue(interval, options?.campaign)
  return {
    contents: [
      {
        content_id: options?.campaign === 'earlybird' ? `premium_${interval}_earlybird` : `premium_${interval}`,
        content_type: 'product',
        content_name: premiumName(interval, options?.campaign),
      },
    ],
    value,
    currency: TIKTOK_CURRENCY,
  }
}

function rememberCheckoutOffer(offer: TikTokCheckoutOffer): void {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(offer))
  } catch {
    // ignore
  }
}

function readCheckoutOffer(): TikTokCheckoutOffer | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TikTokCheckoutOffer
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

class TikTokPixel {
  private static instance: TikTokPixel
  private isInitialized = false
  private lastPagePath = ''
  private lastPageAt = 0
  private searchTimer = 0
  private pendingUser: TikTokIdentifyInput = {}

  static getInstance(): TikTokPixel {
    if (!TikTokPixel.instance) {
      TikTokPixel.instance = new TikTokPixel()
    }
    return TikTokPixel.instance
  }

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    if (!CookieManager.getInstance().hasMarketingConsent()) return

    !function (w: Window, d: Document, t: string) {
      ;(w as Window & { TiktokAnalyticsObject: string }).TiktokAnalyticsObject = t
      const ttq = ((w as Record<string, unknown>)[t] || []) as TikTokQueue & {
        methods: string[]
        setAndDefer: (target: Record<string, unknown>, method: string) => void
        instance: (id: string) => unknown
        _i?: Record<string, unknown[]>
        _t?: Record<string, number>
        _o?: Record<string, unknown>
        push: (item: unknown) => number
      }
      ;(w as Record<string, unknown>)[t] = ttq
      ttq.methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
        'disableCookie',
        'holdConsent',
        'revokeConsent',
        'grantConsent',
      ]
      ttq.setAndDefer = function (target, method) {
        target[method] = function () {
          target.push([method].concat(Array.prototype.slice.call(arguments, 0)))
        }
      }
      for (let i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq as unknown as Record<string, unknown>, ttq.methods[i])
      }
      ttq.instance = function (id: string) {
        const e = ttq._i?.[id] || []
        for (let n = 0; n < ttq.methods.length; n++) {
          ttq.setAndDefer(e as unknown as Record<string, unknown>, ttq.methods[n])
        }
        return e
      }
      ttq.load = function (pixelId, options) {
        const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
        ttq._i = ttq._i || {}
        ttq._i[pixelId] = []
        ;(ttq._i[pixelId] as { _u?: string })._u = src
        ttq._t = ttq._t || {}
        ttq._t[pixelId] = +new Date()
        ttq._o = ttq._o || {}
        ttq._o[pixelId] = options || {}
        const script = d.createElement('script')
        script.type = 'text/javascript'
        script.async = true
        script.src = `${src}?sdkid=${pixelId}&lib=${t}`
        const firstScript = d.getElementsByTagName('script')[0]
        firstScript.parentNode?.insertBefore(script, firstScript)
      }

      ttq.load(TIKTOK_PIXEL_ID)
    }(window, document, 'ttq')

    this.isInitialized = true
  }

  private canSend(): boolean {
    if (typeof window === 'undefined') return false
    if (!CookieManager.getInstance().hasMarketingConsent()) return false
    this.initialize()
    return this.isInitialized && typeof window.ttq?.track === 'function'
  }

  async identify(input: TikTokIdentifyInput): Promise<void> {
    this.pendingUser = {
      email: input.email ?? this.pendingUser.email,
      phone: input.phone ?? this.pendingUser.phone,
      externalId: input.externalId ?? this.pendingUser.externalId,
    }
    if (!this.canSend() || typeof window.ttq?.identify !== 'function') return

    const payload: Record<string, string> = {}
    const email = input.email ? normalizeEmail(input.email) : null
    const phone = input.phone ? normalizePhone(input.phone) : null
    const externalId = input.externalId?.trim() || null

    if (email) payload.email = await sha256Hex(email)
    if (phone) payload.phone_number = await sha256Hex(phone)
    if (externalId) payload.external_id = await sha256Hex(externalId)
    if (Object.keys(payload).length === 0) return

    window.ttq.identify(payload)
  }

  page(): void {
    if (!this.canSend()) return
    const path = window.location.pathname
    const now = Date.now()
    if (path === this.lastPagePath && now - this.lastPageAt < 1500) return
    this.lastPagePath = path
    this.lastPageAt = now
    window.ttq?.page()
  }

  track(event: string, params?: TikTokCommerceParams, eventId = tiktokEventId(event, crypto.randomUUID())): void {
    if (!this.canSend()) return
    window.ttq?.track(event, params, { event_id: eventId })
    this.sendServerEvent(event, params, eventId)
  }

  private sendServerEvent(event: string, params: TikTokCommerceParams | undefined, eventId: string): void {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV === 'development') return

    const payload = {
      event,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      url: window.location.href,
      referrer: document.referrer || null,
      value: params?.value,
      currency: params?.currency,
      contents: params?.contents,
      search_string: params?.search_string ?? null,
      email: this.pendingUser.email || null,
      phone: this.pendingUser.phone || null,
      external_id: this.pendingUser.externalId || null,
    }

    try {
      void fetch('/api/tiktok/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch {
      // Tracking must never break the product.
    }
  }

  trackViewContent(params: TikTokCommerceParams): void {
    this.track('ViewContent', params)
  }

  trackAddToWishlist(params: TikTokCommerceParams): void {
    this.track('AddToWishlist', params)
  }

  trackSearch(params: TikTokCommerceParams): void {
    this.track('Search', params)
  }

  trackSearchDebounced(params: TikTokCommerceParams): void {
    if (typeof window === 'undefined') return
    window.clearTimeout(this.searchTimer)
    this.searchTimer = window.setTimeout(() => {
      this.trackSearch(params)
    }, 700)
  }

  trackAddPaymentInfo(params: TikTokCommerceParams): void {
    this.track('AddPaymentInfo', params)
  }

  trackAddToCart(params: TikTokCommerceParams): void {
    this.track('AddToCart', params)
  }

  trackInitiateCheckout(params: TikTokCommerceParams): void {
    this.track('InitiateCheckout', params)
  }

  trackPlaceAnOrder(params: TikTokCommerceParams, eventId?: string): void {
    this.track('PlaceAnOrder', params, eventId)
  }

  trackCompleteRegistration(params: TikTokCommerceParams, onceKey?: string): void {
    if (onceKey && !markOnce(`${REGISTRATION_PREFIX}${onceKey}`)) return
    this.track('CompleteRegistration', params, onceKey ? tiktokEventId('CompleteRegistration', onceKey) : undefined)
  }

  trackPurchase(params: TikTokCommerceParams, eventId?: string): void {
    this.track('Purchase', params, eventId)
  }

  trackContact(contentId: string, contentName: string): void {
    this.track('Contact', namedContent(contentId, contentName))
  }

  trackCustomizeProduct(params: TikTokCommerceParams): void {
    this.track('CustomizeProduct', params)
  }

  trackDownload(contentId: string, contentName: string): void {
    this.track('Download', namedContent(contentId, contentName))
  }

  trackFindLocation(contentId: string, contentName: string): void {
    this.track('FindLocation', namedContent(contentId, contentName))
  }

  trackSubmitApplication(contentId: string, contentName: string): void {
    this.track('SubmitApplication', namedContent(contentId, contentName))
  }

  trackApplicationApproval(contentId: string, contentName: string, onceKey?: string): void {
    if (onceKey && !markOnce(`ttq_app_approval_${onceKey}`)) return
    this.track('ApplicationApproval', namedContent(contentId, contentName))
  }

  trackSchedule(contentId: string, contentName: string, value = 0): void {
    this.track('Schedule', namedContent(contentId, contentName, value))
  }

  trackStartTrial(params: TikTokCommerceParams, eventId?: string): void {
    this.track('StartTrial', params, eventId)
  }

  trackSubmitForm(contentId: string, contentName: string): void {
    this.track('SubmitForm', namedContent(contentId, contentName))
  }

  trackSubscribe(params: TikTokCommerceParams, eventId?: string): void {
    this.track('Subscribe', params, eventId)
  }

  rememberCheckout(offer: TikTokCheckoutOffer): void {
    rememberCheckoutOffer(offer)
  }

  trackCheckoutStart(offer: TikTokCheckoutOffer): void {
    const params = premiumCommerceParams(offer.interval, {
      value: offer.value,
      campaign: offer.campaign,
    })
    this.rememberCheckout(offer)
    this.trackAddToCart(params)
    this.trackInitiateCheckout(params)
  }

  trackCheckoutPaymentInfo(offer: TikTokCheckoutOffer): void {
    this.trackAddPaymentInfo(
      premiumCommerceParams(offer.interval, {
        value: offer.value,
        campaign: offer.campaign,
      }),
    )
  }

  trackCheckoutSuccess(sessionId?: string | null): void {
    try {
      const recent = Number(sessionStorage.getItem('ttq_purchase_recent') || 0)
      if (recent && Date.now() - recent < 8000) return
    } catch {
      // ignore
    }

    const key = sessionId?.trim()
    if (!key) return
    if (!markOnce(`${PURCHASE_PREFIX}${key}`)) return

    try {
      sessionStorage.setItem('ttq_purchase_recent', String(Date.now()))
    } catch {
      // ignore
    }

    const offer = readCheckoutOffer()
    const params = offer
      ? premiumCommerceParams(offer.interval, { value: offer.value, campaign: offer.campaign })
      : premiumCommerceParams('month')

    this.trackPlaceAnOrder(params, tiktokEventId('PlaceAnOrder', key))
    this.trackPurchase(params, tiktokEventId('Purchase', key))
    this.trackSubscribe(params, tiktokEventId('Subscribe', key))
    if (offer?.interval === 'week') {
      this.trackStartTrial(params, tiktokEventId('StartTrial', key))
    }
  }

  trackViewContentForPath(pathname: string): void {
    if (pathname === '/pricing' || pathname === '/abonament') {
      this.trackViewContent(premiumCommerceParams('year', { campaign: 'earlybird' }))
      return
    }
    if (pathname === '/landing' || pathname === '/rezerva') {
      this.trackViewContent(premiumCommerceParams('year', { campaign: 'earlybird' }))
      if (pathname === '/rezerva') {
        this.trackSchedule(
          'rezerva',
          'Rezervare loc Premium',
          premiumCheckoutValue('year', 'earlybird'),
        )
      }
      return
    }
    if (pathname === '/shop') {
      this.trackViewContent({
        contents: [{ content_id: 'shop', content_type: 'product_group', content_name: 'Planck Shop' }],
        value: 0,
        currency: TIKTOK_CURRENCY,
      })
      return
    }
    if (pathname === '/pregatire' || pathname.startsWith('/pregatire/')) {
      this.trackViewContent({
        contents: [{ content_id: 'pregatire', content_type: 'product_group', content_name: 'Pregătiri live Planck' }],
        value: premiumCheckoutValue('week'),
        currency: TIKTOK_CURRENCY,
      })
      return
    }
    if (pathname === '/gratuit') {
      this.trackViewContent({
        contents: [{ content_id: 'webinar', content_type: 'product', content_name: 'Webinar Planck' }],
        value: 0,
        currency: TIKTOK_CURRENCY,
      })
      return
    }
    if (pathname === '/gratuit/confirmare') {
      this.trackSubmitForm('webinar', 'Webinar Planck')
      return
    }
    if (pathname === '/contact') {
      this.trackFindLocation('contact', 'Planck contact')
      return
    }
    if (pathname === '/aplicatie-mobila') {
      this.trackDownload('aplicatie-mobila', 'Aplicație mobilă Planck')
    }
  }
}

export const tiktokPixel = TikTokPixel.getInstance()

export function persistTikTokClickId(): void {
  if (typeof window === 'undefined') return
  const ttclid = new URLSearchParams(window.location.search).get('ttclid')?.trim()
  if (!ttclid) return
  document.cookie = `ttclid=${encodeURIComponent(ttclid)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
}

declare global {
  interface Window {
    TiktokAnalyticsObject?: string
    ttq?: TikTokQueue
  }
}

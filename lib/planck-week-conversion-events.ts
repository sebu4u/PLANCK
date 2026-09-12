import "server-only"

import { logger } from "@/lib/logger"
import { META_CURRENCY, metaEventId } from "@/lib/meta-constants"
import { sendMetaCapiEvents } from "@/lib/meta-capi"
import { getPlanckWeekSiteUrl } from "@/lib/planck-week"
import { TIKTOK_CURRENCY, tiktokEventId } from "@/lib/tiktok-constants"
import { sendTikTokServerEvents } from "@/lib/tiktok-events-api"

export const PLANCK_WEEK_PIXEL_CONTENT_ID = "planck_week"
export const PLANCK_WEEK_PIXEL_CONTENT_NAME = "Planck Week"

export type PlanckWeekConversionContext = {
  url?: string | null
  referrer?: string | null
  ip?: string | null
  userAgent?: string | null
  ttclid?: string | null
  ttp?: string | null
  fbp?: string | null
  fbc?: string | null
  fbclid?: string | null
  locale?: string | null
}

export function planckWeekConversionEventId(userId: string): string {
  return `planck_week_${userId}`
}

export function planckWeekConversionContext(input: {
  getHeader: (name: string) => string | null
  getCookie: (name: string) => string | null | undefined
}): PlanckWeekConversionContext {
  const forwarded = input.getHeader("x-forwarded-for")
  return {
    url: `${getPlanckWeekSiteUrl()}/planck-week`,
    referrer: input.getHeader("referer") ?? input.getHeader("referrer"),
    ip: forwarded?.split(",")[0]?.trim() || input.getHeader("x-real-ip"),
    userAgent: input.getHeader("user-agent"),
    ttclid: input.getCookie("ttclid") ?? null,
    ttp: input.getCookie("_ttp") ?? null,
    fbp: input.getCookie("_fbp") ?? null,
    fbc: input.getCookie("_fbc") ?? null,
    fbclid: input.getCookie("fbclid") ?? null,
    locale: input.getHeader("accept-language")?.split(",")[0]?.trim() ?? null,
  }
}

export async function sendPlanckWeekConversionEvents(input: {
  userId: string
  email: string
  unique: string
  context?: PlanckWeekConversionContext | null
}): Promise<void> {
  const url = input.context?.url?.trim() || `${getPlanckWeekSiteUrl()}/planck-week`
  const referrer = input.context?.referrer ?? null
  const eventTime = Math.floor(Date.now() / 1000)

  try {
    await Promise.all([
      sendTikTokServerEvents([
        {
          event: "CompleteRegistration",
          eventId: tiktokEventId("CompleteRegistration", input.unique),
          eventTime,
          url,
          referrer,
          value: 0,
          currency: TIKTOK_CURRENCY,
          contents: [
            {
              content_id: PLANCK_WEEK_PIXEL_CONTENT_ID,
              content_type: "product",
              content_name: PLANCK_WEEK_PIXEL_CONTENT_NAME,
            },
          ],
          contentType: "product",
          user: {
            email: input.email,
            externalId: input.userId,
            ip: input.context?.ip,
            userAgent: input.context?.userAgent,
            ttclid: input.context?.ttclid,
            ttp: input.context?.ttp,
            locale: input.context?.locale,
          },
        },
        {
          event: "SubmitForm",
          eventId: tiktokEventId("SubmitForm", input.unique),
          eventTime,
          url,
          referrer,
          value: 0,
          currency: TIKTOK_CURRENCY,
          contents: [
            {
              content_id: PLANCK_WEEK_PIXEL_CONTENT_ID,
              content_type: "product",
              content_name: PLANCK_WEEK_PIXEL_CONTENT_NAME,
            },
          ],
          contentType: "product",
          user: {
            email: input.email,
            externalId: input.userId,
            ip: input.context?.ip,
            userAgent: input.context?.userAgent,
            ttclid: input.context?.ttclid,
            ttp: input.context?.ttp,
            locale: input.context?.locale,
          },
        },
      ]),
      sendMetaCapiEvents([
        {
          eventName: "CompleteRegistration",
          eventId: metaEventId("CompleteRegistration", input.unique),
          eventTime,
          url,
          value: 0,
          currency: META_CURRENCY,
          contentIds: [PLANCK_WEEK_PIXEL_CONTENT_ID],
          contentType: "product",
          contentName: PLANCK_WEEK_PIXEL_CONTENT_NAME,
          user: {
            email: input.email,
            externalId: input.userId,
            ip: input.context?.ip,
            userAgent: input.context?.userAgent,
            fbp: input.context?.fbp,
            fbc: input.context?.fbc,
            fbclid: input.context?.fbclid,
          },
        },
        {
          eventName: "Lead",
          eventId: metaEventId("Lead", input.unique),
          eventTime,
          url,
          value: 0,
          currency: META_CURRENCY,
          contentIds: [PLANCK_WEEK_PIXEL_CONTENT_ID],
          contentType: "product",
          contentName: PLANCK_WEEK_PIXEL_CONTENT_NAME,
          user: {
            email: input.email,
            externalId: input.userId,
            ip: input.context?.ip,
            userAgent: input.context?.userAgent,
            fbp: input.context?.fbp,
            fbc: input.context?.fbc,
            fbclid: input.context?.fbclid,
          },
        },
      ]),
    ])
  } catch (error) {
    logger.warn(
      "[planck-week] conversion events failed",
      error instanceof Error ? error.message : error,
    )
  }
}

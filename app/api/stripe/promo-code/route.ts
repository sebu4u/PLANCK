import { NextRequest, NextResponse } from "next/server"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getStripeClient } from "@/lib/stripe"
import { parseAccessToken } from "@/lib/subscription-plan-server"
import { getPrizeByCodeForUser } from "@/lib/prize-wheel/server"
import { getShopCouponByCodeForUser } from "@/lib/shop/server"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

type PromoCodeBody = {
  code?: string
}

const MIN_CODE_LENGTH = 3
const MAX_CODE_LENGTH = 64

export async function POST(req: NextRequest) {
  try {
    const accessToken = parseAccessToken(req)
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    let body: PromoCodeBody
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
    }

    const rawCode = typeof body?.code === "string" ? body.code.trim() : ""
    if (rawCode.length < MIN_CODE_LENGTH || rawCode.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { error: "Codul nu este valid sau a expirat." },
        { status: 404 }
      )
    }

    const stripe = getStripeClient()
    const normalizedCode = rawCode.toUpperCase()

    const wheelPrize = await getPrizeByCodeForUser(userData.user.id, normalizedCode)
    if (wheelPrize) {
      return NextResponse.json({
        promotion_code_id: `wheel:${wheelPrize.id}`,
        code: wheelPrize.code,
        percent_off: wheelPrize.percentOff,
        amount_off: wheelPrize.amountOff,
        currency: wheelPrize.currency,
        prize_type: wheelPrize.type,
        interval: wheelPrize.interval,
        is_trial: wheelPrize.isTrial,
        source: "prize_wheel",
      })
    }

    const shopCoupon = await getShopCouponByCodeForUser(userData.user.id, normalizedCode)
    if (shopCoupon) {
      return NextResponse.json({
        promotion_code_id: `shop:${shopCoupon.id}`,
        code: shopCoupon.code,
        percent_off: shopCoupon.percentOff,
        amount_off: null,
        currency: null,
        interval: shopCoupon.interval,
        source: "shop",
      })
    }

    const list = await stripe.promotionCodes.list({
      code: normalizedCode,
      active: true,
      limit: 1,
      expand: ["data.promotion.coupon"],
    })

    const promotionCode = list.data[0]
    const coupon = promotionCode?.promotion?.coupon

    if (!promotionCode || !coupon || typeof coupon === "string" || coupon.valid === false) {
      return NextResponse.json(
        { error: "Codul nu este valid sau a expirat." },
        { status: 404 }
      )
    }

    if (
      typeof promotionCode.max_redemptions === "number" &&
      promotionCode.times_redeemed >= promotionCode.max_redemptions
    ) {
      return NextResponse.json(
        { error: "Codul nu este valid sau a expirat." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      promotion_code_id: promotionCode.id,
      code: promotionCode.code,
      percent_off: coupon.percent_off ?? null,
      amount_off: coupon.amount_off ?? null,
      currency: coupon.currency ?? null,
    })
  } catch (error: unknown) {
    logger.error("[stripe/promo-code] Error:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

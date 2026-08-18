import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { getShopStatus, purchaseShopItem } from "@/lib/shop/server"
import { isShopProductKey } from "@/lib/shop/types"
import { createServerClientWithToken } from "@/lib/supabaseServer"

export const runtime = "nodejs"

async function authenticate(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) return { error: "Necesită autentificare.", status: 401 as const }
  if (isJwtExpired(accessToken)) {
    return { error: "Sesiune expirată.", status: 401 as const }
  }
  const supabase = createServerClientWithToken(accessToken)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { error: "Sesiune invalidă.", status: 401 as const }
  return { user: data.user, supabase }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    return NextResponse.json(await getShopStatus(auth.user.id, auth.supabase))
  } catch (error) {
    logger.error("[shop] Failed to load shop:", error)
    return NextResponse.json({ error: "Nu am putut încărca magazinul." }, { status: 500 })
  }
}

const purchaseSchema = z.object({ productKey: z.string().refine(isShopProductKey) })

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const parsed = purchaseSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success || !isShopProductKey(parsed.data.productKey)) {
      return NextResponse.json({ error: "Produs invalid." }, { status: 400 })
    }

    const result = await purchaseShopItem(auth.supabase, parsed.data.productKey)
    return NextResponse.json({
      purchase: result,
      shop: await getShopStatus(auth.user.id, auth.supabase),
    })
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error ? String(error.message) : ""
    logger.error("[shop] Purchase failed:", error)
    if (/insufficient|not enough|coins|monede/i.test(message)) {
      return NextResponse.json({ error: "Nu ai suficiente monede." }, { status: 409 })
    }
    if (/already|active coupon|unused|coupon already active/i.test(message)) {
      return NextResponse.json(
        { error: "Ai deja un cupon activ pentru acest produs." },
        { status: 409 }
      )
    }
    if (/purchase_planckpass_shop_item|function.*does not exist|schema cache/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Magazinul nu este încă activ pe acest mediu. Rulează migrarea 20260817_planckpass_shop.sql în Supabase.",
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Achiziția nu a putut fi finalizată." }, { status: 500 })
  }
}

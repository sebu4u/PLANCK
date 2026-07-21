import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { createServerClientWithToken } from "@/lib/supabaseServer"

const equipSchema = z.object({
  cosmeticId: z.string().uuid(),
})

const unequipSchema = z.object({
  kind: z.enum(["icon", "border", "badge", "skin"]),
  unequip: z.literal(true),
})

export async function GET(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const userId = userData.user.id

    const [{ data: inventory }, { data: equipped }] = await Promise.all([
      supabase
        .from("user_cosmetics_inventory")
        .select(
          "cosmetic_id, acquired_at, source, planckpass_cosmetics(id, kind, name, image_url, meta)",
        )
        .eq("user_id", userId)
        .order("acquired_at", { ascending: false }),
      supabase
        .from("user_cosmetics_equipped")
        .select(
          "icon_id, border_id, badge_id, skin_id",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ])

    const items = (inventory ?? []).map((row) => {
      const cos = Array.isArray(row.planckpass_cosmetics)
        ? row.planckpass_cosmetics[0]
        : row.planckpass_cosmetics
      return {
        cosmeticId: row.cosmetic_id,
        acquiredAt: row.acquired_at,
        source: row.source,
        cosmetic: cos
          ? {
              id: cos.id,
              kind: cos.kind,
              name: cos.name,
              imageUrl: cos.image_url,
              meta: cos.meta,
            }
          : null,
      }
    })

    return NextResponse.json({
      inventory: items,
      equipped: {
        iconId: equipped?.icon_id ?? null,
        borderId: equipped?.border_id ?? null,
        badgeId: equipped?.badge_id ?? null,
        skinId: equipped?.skin_id ?? null,
      },
    })
  } catch (err) {
    logger.error("[planckpass/equip] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
    if (!accessToken) {
      return NextResponse.json({ error: "Necesită autentificare." }, { status: 401 })
    }
    if (isJwtExpired(accessToken)) {
      return NextResponse.json({ error: "Sesiune expirată." }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const unequip = unequipSchema.safeParse(body)
    if (unequip.success) {
      const { error } = await supabase.rpc("unequip_planckpass_cosmetic", {
        p_kind: unequip.data.kind,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ success: true, unequipped: unequip.data.kind })
    }

    const parsed = equipSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 })
    }

    const { data, error } = await supabase.rpc("equip_planckpass_cosmetic", {
      p_cosmetic_id: parsed.data.cosmeticId,
    })

    if (error) {
      return NextResponse.json({ error: error.message || "Nu am putut echipa." }, { status: 400 })
    }

    return NextResponse.json({ success: true, equipped: data })
  } catch (err) {
    logger.error("[planckpass/equip] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

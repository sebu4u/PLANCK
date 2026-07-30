import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { BORDER_PRESETS } from "@/lib/planckpass/border-presets"
import { BADGE_PRESETS } from "@/lib/planckpass/badge-presets"
import { defaultXpForTier } from "@/lib/planckpass/xp"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

const BORDER_PRESET_COSMETIC_IDS = new Set(BORDER_PRESETS.map((p) => p.cosmeticId))
const BADGE_PRESET_COSMETIC_IDS = new Set(BADGE_PRESETS.map((p) => p.cosmeticId))

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }
  const supabaseUser = createServerClientWithToken(accessToken)
  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(supabaseUser, user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }
  return { userId: user.id }
}

const rewardKinds = z.enum([
  "icon",
  "badge",
  "border",
  "skin",
  "elo",
  "elo_2x",
  "streak_freeze",
  "coins",
])

const createSeasonSchema = z.object({
  action: z.literal("create_season"),
  title: z.string().min(1).max(120),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  activate: z.boolean().optional(),
})

const activateSeasonSchema = z.object({
  action: z.literal("activate_season"),
  seasonId: z.string().uuid(),
})

const updateTierSchema = z.object({
  action: z.literal("update_tier"),
  seasonId: z.string().uuid(),
  tierNumber: z.number().int().min(1).max(30),
  isFree: z.boolean(),
  rewardKind: rewardKinds,
  label: z.string().max(80),
  xpRequired: z.number().int().min(1).max(100000),
  coinsAmount: z.number().int().nullable().optional(),
  eloAmount: z.number().int().nullable().optional(),
  eloMultiplierMinutes: z.number().int().nullable().optional(),
  streakFreezeHours: z.number().int().nullable().optional(),
  cosmeticId: z.string().uuid().nullable().optional(),
  cosmeticName: z.string().max(80).nullable().optional(),
  cosmeticImageUrl: z.string().max(2048).nullable().optional(),
})

const createCosmeticSchema = z.object({
  action: z.literal("create_cosmetic"),
  kind: z.enum(["icon", "badge", "border", "skin"]),
  name: z.string().min(1).max(80),
  imageUrl: z.string().url(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth && auth.error) return auth.error

    const admin = getServiceRoleSupabase()
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")

    const { data: seasons, error: seasonsErr } = await admin
      .from("planckpass_seasons")
      .select("id, title, starts_at, ends_at, is_active, created_at")
      .order("created_at", { ascending: false })

    if (seasonsErr) {
      logger.error("[admin/planckpass] seasons:", seasonsErr)
      return NextResponse.json({ error: "Nu am putut încărca sezoanele." }, { status: 500 })
    }

    const active = seasons?.find((s) => s.is_active) ?? seasons?.[0] ?? null
    const targetId = seasonId || active?.id || null

    let tiers: unknown[] = []
    if (targetId) {
      const { data: tierRows, error: tiersErr } = await admin
        .from("planckpass_tiers")
        .select(
          "id, season_id, tier_number, is_free, reward_kind, label, xp_required, coins_amount, elo_amount, elo_multiplier_minutes, streak_freeze_hours, cosmetic_id, planckpass_cosmetics(id, kind, name, image_url)",
        )
        .eq("season_id", targetId)
        .order("tier_number", { ascending: true })

      if (tiersErr) {
        logger.error("[admin/planckpass] tiers:", tiersErr)
        return NextResponse.json({ error: "Nu am putut încărca tiers." }, { status: 500 })
      }
      tiers = tierRows ?? []
    }

    const { data: cosmetics } = await admin
      .from("planckpass_cosmetics")
      .select("id, kind, name, image_url, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(200)

    return NextResponse.json({
      seasons: seasons ?? [],
      selectedSeasonId: targetId,
      tiers,
      cosmetics: cosmetics ?? [],
      defaultXpByTier: Array.from({ length: 30 }, (_, i) => defaultXpForTier(i + 1)),
    })
  } catch (err) {
    logger.error("[admin/planckpass] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth && auth.error) return auth.error

    const admin = getServiceRoleSupabase()
    const body = await req.json().catch(() => null)

    const createSeason = createSeasonSchema.safeParse(body)
    if (createSeason.success) {
      // Always deactivate others then activate the new season (one active at a time)
      await admin.from("planckpass_seasons").update({ is_active: false }).eq("is_active", true)
      const { data: season, error } = await admin
        .from("planckpass_seasons")
        .insert({
          title: createSeason.data.title,
          starts_at: createSeason.data.startsAt ?? null,
          ends_at: createSeason.data.endsAt ?? null,
          is_active: true,
        })
        .select("id, title, starts_at, ends_at, is_active")
        .single()

      if (error || !season) {
        logger.error("[admin/planckpass] create season:", error)
        return NextResponse.json({ error: "Nu am putut crea sezonul." }, { status: 500 })
      }

      const { error: seedErr } = await admin.rpc("planckpass_seed_season_tiers", {
        p_season_id: season.id,
      })
      if (seedErr) {
        logger.error("[admin/planckpass] seed tiers:", seedErr)
      }

      return NextResponse.json({ success: true, season }, { status: 201 })
    }

    const activate = activateSeasonSchema.safeParse(body)
    if (activate.success) {
      await admin.from("planckpass_seasons").update({ is_active: false }).eq("is_active", true)
      const { error } = await admin
        .from("planckpass_seasons")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", activate.data.seasonId)

      if (error) {
        return NextResponse.json({ error: "Nu am putut activa sezonul." }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const createCosmetic = createCosmeticSchema.safeParse(body)
    if (createCosmetic.success) {
      if (createCosmetic.data.kind === "border" || createCosmetic.data.kind === "badge") {
        return NextResponse.json(
          {
            error:
              createCosmetic.data.kind === "border"
                ? "Border-urile sunt preset-uri fixe — selectează din listă pe tier."
                : "Badge-urile sunt preset-uri fixe — selectează din listă pe tier.",
          },
          { status: 400 },
        )
      }
      const { data, error } = await admin
        .from("planckpass_cosmetics")
        .insert({
          kind: createCosmetic.data.kind,
          name: createCosmetic.data.name,
          image_url: createCosmetic.data.imageUrl,
        })
        .select("id, kind, name, image_url")
        .single()
      if (error || !data) {
        return NextResponse.json({ error: "Nu am putut crea cosmetic-ul." }, { status: 500 })
      }
      return NextResponse.json({ success: true, cosmetic: data }, { status: 201 })
    }

    const updateTier = updateTierSchema.safeParse(body)
    if (updateTier.success) {
      const d = updateTier.data
      let cosmeticId = d.cosmeticId ?? null

      if (d.rewardKind === "border") {
        if (!cosmeticId || !BORDER_PRESET_COSMETIC_IDS.has(cosmeticId)) {
          return NextResponse.json(
            { error: "Alege un border preset valid din listă." },
            { status: 400 },
          )
        }
      } else if (d.rewardKind === "badge") {
        if (!cosmeticId || !BADGE_PRESET_COSMETIC_IDS.has(cosmeticId)) {
          return NextResponse.json(
            { error: "Alege un badge preset valid din listă." },
            { status: 400 },
          )
        }
      } else if (
        ["icon", "skin"].includes(d.rewardKind) &&
        !cosmeticId &&
        d.cosmeticImageUrl
      ) {
        const { data: cos, error: cosErr } = await admin
          .from("planckpass_cosmetics")
          .insert({
            kind: d.rewardKind,
            name: d.cosmeticName || d.label || d.rewardKind,
            image_url: d.cosmeticImageUrl,
          })
          .select("id")
          .single()
        if (cosErr || !cos) {
          return NextResponse.json({ error: "Nu am putut crea cosmetic-ul pentru tier." }, { status: 500 })
        }
        cosmeticId = cos.id
      }

      const { error } = await admin
        .from("planckpass_tiers")
        .update({
          is_free: d.isFree,
          reward_kind: d.rewardKind,
          label: d.label,
          xp_required: d.xpRequired,
          coins_amount: d.rewardKind === "coins" ? d.coinsAmount ?? 0 : null,
          elo_amount: d.rewardKind === "elo" ? d.eloAmount ?? 0 : null,
          elo_multiplier_minutes:
            d.rewardKind === "elo_2x" ? d.eloMultiplierMinutes ?? 15 : null,
          streak_freeze_hours:
            d.rewardKind === "streak_freeze" ? d.streakFreezeHours ?? 24 : null,
          cosmetic_id: ["icon", "badge", "border", "skin"].includes(d.rewardKind)
            ? cosmeticId
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("season_id", d.seasonId)
        .eq("tier_number", d.tierNumber)

      if (error) {
        logger.error("[admin/planckpass] update tier:", error)
        return NextResponse.json({ error: "Nu am putut salva tier-ul." }, { status: 500 })
      }

      return NextResponse.json({ success: true, cosmeticId })
    }

    return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 })
  } catch (err) {
    logger.error("[admin/planckpass] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

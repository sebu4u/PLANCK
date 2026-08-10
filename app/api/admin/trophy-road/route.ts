import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { logger } from "@/lib/logger"
import { BORDER_PRESETS } from "@/lib/planckpass/border-presets"
import { BADGE_PRESETS } from "@/lib/planckpass/badge-presets"
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
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser()
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

const updateMilestoneSchema = z.object({
  action: z.literal("update_milestone"),
  milestoneId: z.string().uuid(),
  threshold: z.number().int().min(1).max(1_000_000),
  rewardKind: rewardKinds,
  label: z.string().max(80),
  coinsAmount: z.number().int().nullable().optional(),
  eloAmount: z.number().int().nullable().optional(),
  eloMultiplierMinutes: z.number().int().nullable().optional(),
  streakFreezeHours: z.number().int().nullable().optional(),
  cosmeticId: z.string().uuid().nullable().optional(),
  cosmeticName: z.string().max(80).nullable().optional(),
  cosmeticImageUrl: z.string().max(2048).nullable().optional(),
  isActive: z.boolean().optional(),
})

const createMilestoneSchema = z.object({
  action: z.literal("create_milestone"),
  threshold: z.number().int().min(1).max(1_000_000),
  rewardKind: rewardKinds.optional(),
  label: z.string().max(80).optional(),
})

const deleteMilestoneSchema = z.object({
  action: z.literal("delete_milestone"),
  milestoneId: z.string().uuid(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth && auth.error) return auth.error

    const admin = getServiceRoleSupabase()

    const { data: milestones, error: milestonesErr } = await admin
      .from("trophy_road_milestones")
      .select(
        "id, threshold, sort_order, reward_kind, label, coins_amount, elo_amount, elo_multiplier_minutes, streak_freeze_hours, cosmetic_id, is_active, created_at, updated_at, planckpass_cosmetics(id, kind, name, image_url)",
      )
      .order("threshold", { ascending: true })

    if (milestonesErr) {
      logger.error("[admin/trophy-road] milestones:", milestonesErr)
      return NextResponse.json(
        { error: "Nu am putut încărca milestone-urile. Rulează migrarea SQL." },
        { status: 500 },
      )
    }

    const { data: cosmetics } = await admin
      .from("planckpass_cosmetics")
      .select("id, kind, name, image_url, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(200)

    return NextResponse.json({
      milestones: milestones ?? [],
      cosmetics: cosmetics ?? [],
    })
  } catch (err) {
    logger.error("[admin/trophy-road] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth && auth.error) return auth.error

    const admin = getServiceRoleSupabase()
    const body = await req.json().catch(() => null)

    const create = createMilestoneSchema.safeParse(body)
    if (create.success) {
      const d = create.data
      const { count } = await admin
        .from("trophy_road_milestones")
        .select("id", { count: "exact", head: true })

      const { data, error } = await admin
        .from("trophy_road_milestones")
        .insert({
          threshold: d.threshold,
          sort_order: (count ?? 0) + 1,
          reward_kind: d.rewardKind ?? "coins",
          label: d.label ?? "",
        })
        .select("id, threshold")
        .single()

      if (error || !data) {
        if (error?.code === "23505") {
          return NextResponse.json(
            { error: "Există deja un milestone la acest nr. de trofee." },
            { status: 400 },
          )
        }
        logger.error("[admin/trophy-road] create:", error)
        return NextResponse.json({ error: "Nu am putut crea milestone-ul." }, { status: 500 })
      }
      return NextResponse.json({ success: true, milestone: data }, { status: 201 })
    }

    const del = deleteMilestoneSchema.safeParse(body)
    if (del.success) {
      const { error } = await admin
        .from("trophy_road_milestones")
        .delete()
        .eq("id", del.data.milestoneId)
      if (error) {
        return NextResponse.json({ error: "Nu am putut șterge milestone-ul." }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    const update = updateMilestoneSchema.safeParse(body)
    if (update.success) {
      const d = update.data
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
      } else if (["icon", "skin"].includes(d.rewardKind) && !cosmeticId && d.cosmeticImageUrl) {
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
          return NextResponse.json(
            { error: "Nu am putut crea cosmetic-ul pentru milestone." },
            { status: 500 },
          )
        }
        cosmeticId = cos.id
      }

      const { error } = await admin
        .from("trophy_road_milestones")
        .update({
          threshold: d.threshold,
          reward_kind: d.rewardKind,
          label: d.label,
          coins_amount: d.rewardKind === "coins" ? d.coinsAmount ?? 0 : null,
          elo_amount: d.rewardKind === "elo" ? d.eloAmount ?? 0 : null,
          elo_multiplier_minutes:
            d.rewardKind === "elo_2x" ? d.eloMultiplierMinutes ?? 15 : null,
          streak_freeze_hours:
            d.rewardKind === "streak_freeze" ? d.streakFreezeHours ?? 24 : null,
          cosmetic_id: ["icon", "badge", "border", "skin"].includes(d.rewardKind)
            ? cosmeticId
            : null,
          is_active: d.isActive ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", d.milestoneId)

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "Există deja un milestone la acest nr. de trofee." },
            { status: 400 },
          )
        }
        logger.error("[admin/trophy-road] update:", error)
        return NextResponse.json({ error: "Nu am putut salva milestone-ul." }, { status: 500 })
      }

      return NextResponse.json({ success: true, cosmeticId })
    }

    return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 })
  } catch (err) {
    logger.error("[admin/trophy-road] POST error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export const BADGE_PRESET_IDS = [
  "nova-star",
  "ember-shield",
  "gold-medal",
  "crystal-gem",
  "comet-trail",
] as const

export type BadgePresetId = (typeof BADGE_PRESET_IDS)[number]

export type BadgePresetDef = {
  id: BadgePresetId
  name: string
  /** Stable UUID used when seeding planckpass_cosmetics */
  cosmeticId: string
  imageUrl: string
}

/** Deterministic UUIDs for seeded badge cosmetics (migration + admin). */
export const BADGE_PRESETS: BadgePresetDef[] = [
  {
    id: "nova-star",
    name: "Nova",
    cosmeticId: "b1000001-0000-4000-8000-000000000001",
    imageUrl: "/images/planckpass/badges/nova-star.svg",
  },
  {
    id: "ember-shield",
    name: "Scut Ember",
    cosmeticId: "b1000001-0000-4000-8000-000000000002",
    imageUrl: "/images/planckpass/badges/ember-shield.svg",
  },
  {
    id: "gold-medal",
    name: "Medalie de Aur",
    cosmeticId: "b1000001-0000-4000-8000-000000000003",
    imageUrl: "/images/planckpass/badges/gold-medal.svg",
  },
  {
    id: "crystal-gem",
    name: "Gemă",
    cosmeticId: "b1000001-0000-4000-8000-000000000004",
    imageUrl: "/images/planckpass/badges/crystal-gem.svg",
  },
  {
    id: "comet-trail",
    name: "Cometă",
    cosmeticId: "b1000001-0000-4000-8000-000000000005",
    imageUrl: "/images/planckpass/badges/comet-trail.svg",
  },
]

const PRESET_BY_ID = new Map(BADGE_PRESETS.map((p) => [p.id, p]))
const PRESET_BY_COSMETIC_ID = new Map(BADGE_PRESETS.map((p) => [p.cosmeticId, p]))

export function isBadgePresetId(value: unknown): value is BadgePresetId {
  return typeof value === "string" && BADGE_PRESET_IDS.includes(value as BadgePresetId)
}

export function getBadgePreset(id: BadgePresetId | null | undefined): BadgePresetDef | null {
  if (!id) return null
  return PRESET_BY_ID.get(id) ?? null
}

export function getBadgePresetByCosmeticId(cosmeticId: string | null | undefined): BadgePresetDef | null {
  if (!cosmeticId) return null
  return PRESET_BY_COSMETIC_ID.get(cosmeticId) ?? null
}

export function badgePresetIdFromMeta(
  meta: Record<string, unknown> | null | undefined,
): BadgePresetId | null {
  const raw = meta?.presetId
  return isBadgePresetId(raw) ? raw : null
}

export function badgePresetIdFromCosmetic(cosmetic: {
  id?: string
  meta?: Record<string, unknown> | null
} | null | undefined): BadgePresetId | null {
  if (!cosmetic) return null
  const fromMeta = badgePresetIdFromMeta(cosmetic.meta ?? undefined)
  if (fromMeta) return fromMeta
  return getBadgePresetByCosmeticId(cosmetic.id)?.id ?? null
}

export const BORDER_PRESET_IDS = [
  "orbit-rings",
  "neon-circuit",
  "constellation",
  "ember-flame",
  "crystal-prism",
  "aurora-flow",
  "golden-laurel",
  "pixel-glitch",
  "void-portal",
  "confetti-crown",
] as const

export type BorderPresetId = (typeof BORDER_PRESET_IDS)[number]

export type BorderPresetDef = {
  id: BorderPresetId
  name: string
  /** Stable UUID used when seeding planckpass_cosmetics */
  cosmeticId: string
  imageUrl: string
}

/** Deterministic UUIDs for seeded border cosmetics (migration + admin). */
export const BORDER_PRESETS: BorderPresetDef[] = [
  {
    id: "orbit-rings",
    name: "Orbital",
    cosmeticId: "a1000001-0000-4000-8000-000000000001",
    imageUrl: "/images/planckpass/borders/orbit-rings.svg",
  },
  {
    id: "neon-circuit",
    name: "Circuit Neon",
    cosmeticId: "a1000001-0000-4000-8000-000000000002",
    imageUrl: "/images/planckpass/borders/neon-circuit.svg",
  },
  {
    id: "constellation",
    name: "Constelație",
    cosmeticId: "a1000001-0000-4000-8000-000000000003",
    imageUrl: "/images/planckpass/borders/constellation.svg",
  },
  {
    id: "ember-flame",
    name: "Emberi",
    cosmeticId: "a1000001-0000-4000-8000-000000000004",
    imageUrl: "/images/planckpass/borders/ember-flame.svg",
  },
  {
    id: "crystal-prism",
    name: "Prismă",
    cosmeticId: "a1000001-0000-4000-8000-000000000005",
    imageUrl: "/images/planckpass/borders/crystal-prism.svg",
  },
  {
    id: "aurora-flow",
    name: "Auroră",
    cosmeticId: "a1000001-0000-4000-8000-000000000006",
    imageUrl: "/images/planckpass/borders/aurora-flow.svg",
  },
  {
    id: "golden-laurel",
    name: "Lauri de Aur",
    cosmeticId: "a1000001-0000-4000-8000-000000000007",
    imageUrl: "/images/planckpass/borders/golden-laurel.svg",
  },
  {
    id: "pixel-glitch",
    name: "Glitch",
    cosmeticId: "a1000001-0000-4000-8000-000000000008",
    imageUrl: "/images/planckpass/borders/pixel-glitch.svg",
  },
  {
    id: "void-portal",
    name: "Portal",
    cosmeticId: "a1000001-0000-4000-8000-000000000009",
    imageUrl: "/images/planckpass/borders/void-portal.svg",
  },
  {
    id: "confetti-crown",
    name: "Confetti Crown",
    cosmeticId: "a1000001-0000-4000-8000-00000000000a",
    imageUrl: "/images/planckpass/borders/confetti-crown.svg",
  },
]

const PRESET_BY_ID = new Map(BORDER_PRESETS.map((p) => [p.id, p]))
const PRESET_BY_COSMETIC_ID = new Map(BORDER_PRESETS.map((p) => [p.cosmeticId, p]))

export function isBorderPresetId(value: unknown): value is BorderPresetId {
  return typeof value === "string" && BORDER_PRESET_IDS.includes(value as BorderPresetId)
}

export function getBorderPreset(id: BorderPresetId | null | undefined): BorderPresetDef | null {
  if (!id) return null
  return PRESET_BY_ID.get(id) ?? null
}

export function getBorderPresetByCosmeticId(cosmeticId: string | null | undefined): BorderPresetDef | null {
  if (!cosmeticId) return null
  return PRESET_BY_COSMETIC_ID.get(cosmeticId) ?? null
}

export function borderPresetIdFromMeta(
  meta: Record<string, unknown> | null | undefined,
): BorderPresetId | null {
  const raw = meta?.presetId
  return isBorderPresetId(raw) ? raw : null
}

export function borderPresetIdFromCosmetic(cosmetic: {
  id?: string
  meta?: Record<string, unknown> | null
} | null | undefined): BorderPresetId | null {
  if (!cosmetic) return null
  const fromMeta = borderPresetIdFromMeta(cosmetic.meta ?? undefined)
  if (fromMeta) return fromMeta
  return getBorderPresetByCosmeticId(cosmetic.id)?.id ?? null
}

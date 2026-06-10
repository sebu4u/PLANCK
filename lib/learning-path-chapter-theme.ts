export const DEFAULT_LEARNING_PATH_ACCENT_COLOR = "#7c3aed"

export type LearningPathChapterTheme = {
  accent: string
  accentLight: string
  accentDark: string
  accentMutedBorder: string
  accentShadow: string
  accentRing: string
  buttonGlowTint: string
}

type Rgb = { r: number; g: number; b: number }

function parseHex(hex: string): Rgb | null {
  const normalized = hex.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0")

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function mixHex(hex: string, target: Rgb, amount: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex

  return rgbToHex({
    r: rgb.r + (target.r - rgb.r) * amount,
    g: rgb.g + (target.g - rgb.g) * amount,
    b: rgb.b + (target.b - rgb.b) * amount,
  })
}

function lighten(hex: string, amount = 0.2): string {
  return mixHex(hex, { r: 255, g: 255, b: 255 }, amount)
}

function darken(hex: string, amount = 0.35): string {
  return mixHex(hex, { r: 0, g: 0, b: 0 }, amount)
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return `rgba(124, 58, 237, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export function normalizeLearningPathChapterAccentColor(
  accentColor: string | null | undefined
): string | null {
  const trimmed = accentColor?.trim()
  if (!trimmed) return null

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  return parseHex(withHash) ? withHash.toLowerCase() : null
}

export function resolveLearningPathChapterAccentColor(
  accentColor: string | null | undefined
): string {
  return normalizeLearningPathChapterAccentColor(accentColor) ?? DEFAULT_LEARNING_PATH_ACCENT_COLOR
}

export function getLearningPathChapterTheme(
  accentColor: string | null | undefined
): LearningPathChapterTheme {
  const accent = resolveLearningPathChapterAccentColor(accentColor)
  const accentLight = lighten(accent, 0.2)
  const accentDark = darken(accent, 0.35)

  return {
    accent,
    accentLight,
    accentDark,
    accentMutedBorder: mixHex(accent, { r: 255, g: 255, b: 255 }, 0.72),
    accentShadow: `0 8px 24px ${hexToRgba(accent, 0.14)}`,
    accentRing: hexToRgba(accent, 0.3),
    buttonGlowTint: hexToRgba(lighten(accent, 0.55), 0.84),
  }
}

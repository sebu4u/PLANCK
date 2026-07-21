/** Horizontal layout constants shared by cards + track */
export const PLANCKPASS_CARD_WIDTH = 78
export const PLANCKPASS_CARD_HEIGHT = 92
export const PLANCKPASS_CARD_GAP = 14
export const PLANCKPASS_SIDE_PAD = 84
export const PLANCKPASS_EXPANDED_HEIGHT = 220

/** Desktop right panel as % of the dashboard content row */
export const PLANCKPASS_DESKTOP_WIDTH_PCT = 25
/** Larger reward cards on the desktop vertical pass */
export const PLANCKPASS_DESKTOP_CARD_WIDTH = 100
export const PLANCKPASS_DESKTOP_CARD_HEIGHT = 118
export const PLANCKPASS_DESKTOP_CARD_GAP = 18
/** sessionStorage: "1" = collapsed (default on desktop) */
export const PLANCKPASS_DESKTOP_STORAGE_KEY = "planckpass-desktop-collapsed"
/** Vertical track padding above/below the first/last card center */
export const PLANCKPASS_VERTICAL_SIDE_PAD = 8

/** Deterministic left/right placement for a tier (stable across renders). */
export function planckPassDesktopCardSide(tier: number): "left" | "right" {
  const x = Math.sin(tier * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x) >= 0.5 ? "right" : "left"
}

/** Body class while PLANCKPASS band is open (navbar shadow on dashboard). */
export const PLANCKPASS_EXPANDED_BODY_CLASS = "planckpass-expanded"

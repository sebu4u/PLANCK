/** Height of the fixed mobile top bar on /invata (must match navigation h-16). */
export const INVATA_HUB_MOBILE_NAV_HEIGHT = "4rem"

/** Mobile hub header band — light blue, slightly darker than the white content card. */
export const INVATA_HUB_MOBILE_HEADER_BG = "#DCE6FA"

/** Upward drop shadow on the white content sheet, visible over the header band. */
export const INVATA_HUB_MOBILE_SHEET_SHADOW =
  "0 -12px 40px rgba(30, 64, 120, 0.24), 0 -4px 16px rgba(15, 23, 42, 0.14)"

/** Below fixed nav/bottom bar (300), above lesson cards (290). Applied on the in-tree search anchor when open on mobile. */
export const INVATA_ASK_CARD_Z = 295

/**
 * Stacking on mobile /invata hub:
 * top bar (0) < header character (2) < white sheet (10) < …
 * Within the sheet: chapter image (2) < glow (280) < lesson cards (290) < ask advisor (295)
 * Bottom bar stays at 300 (fixed, outside the sheet). Desktop top bar stays at 300.
 */
export const INVATA_HUB_MOBILE_NAV_Z = 0
export const INVATA_HUB_MOBILE_HEADER_Z = 2
export const INVATA_HUB_MOBILE_SHEET_Z = 10
export const INVATA_HUB_TOP_GLOW_Z = 280
export const INVATA_HUB_CHAPTER_IMAGE_Z = 2
export const INVATA_HUB_LESSON_CARDS_Z = 290

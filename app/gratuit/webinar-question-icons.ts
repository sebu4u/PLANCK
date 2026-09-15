/**
 * Exactly one icon per question (1–7), stable order — same question always uses the same asset.
 * Files live under `public/images/icons/`.
 */
const ICON_FILENAMES = [
  "Untitled design (42).webp",
  "Untitled design (43).webp",
  "Untitled design (44).webp",
  "Untitled design (45).webp",
  "Untitled design (46).webp",
  "Untitled design (47).webp",
  "Untitled design (48).webp",
] as const

export const WEBINAR_QUESTION_ICON_SRC: readonly string[] = ICON_FILENAMES.map(
  (name) => `/images/icons/${encodeURIComponent(name)}`,
)

export type WebinarQuestionIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

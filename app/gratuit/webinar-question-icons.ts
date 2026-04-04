/**
 * Exactly one icon per question (1–7), stable order — same question always uses the same asset.
 * Files live under `public/images/icons/`.
 */
const ICON_FILENAMES = [
  "Untitled design (42).png",
  "Untitled design (43).png",
  "Untitled design (44).png",
  "Untitled design (45).png",
  "Untitled design (46).png",
  "Untitled design (47).png",
  "Untitled design (48).png",
] as const

export const WEBINAR_QUESTION_ICON_SRC: readonly string[] = ICON_FILENAMES.map(
  (name) => `/images/icons/${encodeURIComponent(name)}`,
)

export type WebinarQuestionIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

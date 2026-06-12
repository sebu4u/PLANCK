/** Etichete clasă folosite în toate cataloagele (același format ca la fizică). */
export const CATALOG_CLASS_OPTIONS = ["a 9-a", "a 10-a", "a 11-a", "a 12-a"] as const
export type CatalogClassLabel = (typeof CATALOG_CLASS_OPTIONS)[number]

export const CLASS_NUM_TO_LABEL: Record<number, CatalogClassLabel> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a",
}

export const CLASS_LABEL_TO_NUM: Record<CatalogClassLabel, number> = {
  "a 9-a": 9,
  "a 10-a": 10,
  "a 11-a": 11,
  "a 12-a": 12,
}

export function normalizeCatalogValue(value?: string | null) {
  return (value ?? "").trim().toLowerCase()
}

export function mapProfileGradeToCatalogClass(grade: unknown): CatalogClassLabel | null {
  if (grade == null) return null
  const raw = String(grade).trim()
  if (!raw) return null
  if (["9", "10", "11", "12"].includes(raw)) return CLASS_NUM_TO_LABEL[Number(raw)]
  const numeric = Number(raw)
  if ([9, 10, 11, 12].includes(numeric)) return CLASS_NUM_TO_LABEL[numeric]
  const normalized = normalizeCatalogValue(raw)
  const directMatch = CATALOG_CLASS_OPTIONS.find((opt) => normalizeCatalogValue(opt) === normalized)
  return directMatch ?? null
}

export function mapNumericClassToLabel(classNum: number | null | undefined): CatalogClassLabel | null {
  if (typeof classNum !== "number" || !CLASS_NUM_TO_LABEL[classNum]) return null
  return CLASS_NUM_TO_LABEL[classNum]
}

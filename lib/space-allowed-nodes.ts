const FREE_ALLOWED_NODE_TITLES = new Set([
  "distanta",
  "viteza",
  "viteza medie",
  "acceleratie",
  "timp",
  "impuls",
  "deplasare",
  "energie cinetica",
  "energia cinetica",
])

export const normalizeNodeTitle = (title: string): string => {
  if (!title) return ""
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export const isNodeAllowedForFreePlan = (node: { title: string } | null | undefined): boolean => {
  if (!node?.title) return false
  return FREE_ALLOWED_NODE_TITLES.has(normalizeNodeTitle(node.title))
}

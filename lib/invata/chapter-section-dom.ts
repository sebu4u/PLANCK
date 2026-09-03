export function invataChapterSectionDomId(chapterId: string) {
  return `invata-chapter-${chapterId}`
}

/** Mobile + desktop both render the same chapter sections; pick the one currently laid out. */
export function queryVisibleInvataChapterSection(chapterId: string): HTMLElement | null {
  if (typeof document === "undefined") return null

  const selector = `[data-invata-chapter-section="${CSS.escape(chapterId)}"]`
  const nodes = document.querySelectorAll<HTMLElement>(selector)
  for (const node of nodes) {
    if (node.getClientRects().length > 0) return node
  }

  return document.getElementById(invataChapterSectionDomId(chapterId))
}

export const PRODUCT_GUIDE_SHOW_DELAY_MS = 1800

export const PRODUCT_GUIDE_ANCHOR_ATTR = "data-guide-anchor"

export function guideAnchorSelector(anchorId: string): string {
  return `[${PRODUCT_GUIDE_ANCHOR_ATTR}="${anchorId}"]`
}

/** Prefer the first visible, laid-out anchor in the document. */
export function findGuideAnchorElement(anchorId: string): HTMLElement | null {
  if (typeof document === "undefined") return null

  const nodes = document.querySelectorAll<HTMLElement>(guideAnchorSelector(anchorId))
  for (const node of nodes) {
    const style = window.getComputedStyle(node)
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      continue
    }
    const rect = node.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) continue
    return node
  }

  return nodes[0] ?? null
}

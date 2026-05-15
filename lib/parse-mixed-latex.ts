/**
 * Split mixed plain text + LaTeX using delimiters:
 * - Block: $$...$$ or \\[...\\]
 * - Inline: $...$ or \\(...\\)
 *
 * Order: block segments are resolved first, then inline within each text run.
 */

export type MixedLatexPiece =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string }

type BlockOrText = { kind: "text"; value: string } | { kind: "block"; value: string }

type InlineOrText = { kind: "text"; value: string } | { kind: "inline"; value: string }

function findNextBlockStart(s: string, from: number): { type: "dd" | "br"; index: number } | null {
  let i = from
  while (i < s.length) {
    if (s.slice(i, i + 2) === "$$") {
      return { type: "dd", index: i }
    }
    if (s.slice(i, i + 2) === "\\[") {
      return { type: "br", index: i }
    }
    i++
  }
  return null
}

function splitBlockSegments(s: string): BlockOrText[] {
  const out: BlockOrText[] = []
  let i = 0
  while (i < s.length) {
    const start = findNextBlockStart(s, i)
    if (!start) {
      out.push({ kind: "text", value: s.slice(i) })
      break
    }
    if (start.index > i) {
      out.push({ kind: "text", value: s.slice(i, start.index) })
    }
    if (start.type === "dd") {
      const close = s.indexOf("$$", start.index + 2)
      if (close === -1) {
        out.push({ kind: "text", value: s.slice(start.index) })
        break
      }
      out.push({ kind: "block", value: s.slice(start.index + 2, close) })
      i = close + 2
    } else {
      const close = s.indexOf("\\]", start.index + 2)
      if (close === -1) {
        out.push({ kind: "text", value: s.slice(start.index) })
        break
      }
      out.push({ kind: "block", value: s.slice(start.index + 2, close) })
      i = close + 2
    }
  }
  return out
}

function findNextInlineStart(
  s: string,
  from: number
): { type: "dollar" | "paren"; index: number } | null {
  let i = from
  while (i < s.length) {
    if (s[i] === "$") {
      if (s[i + 1] === "$") {
        i += 2
        continue
      }
      return { type: "dollar", index: i }
    }
    if (s.slice(i, i + 2) === "\\(") {
      return { type: "paren", index: i }
    }
    i++
  }
  return null
}

function splitInlineSegments(s: string): InlineOrText[] {
  const out: InlineOrText[] = []
  let i = 0
  while (i < s.length) {
    const start = findNextInlineStart(s, i)
    if (!start) {
      out.push({ kind: "text", value: s.slice(i) })
      break
    }
    if (start.index > i) {
      out.push({ kind: "text", value: s.slice(i, start.index) })
    }
    if (start.type === "dollar") {
      const close = s.indexOf("$", start.index + 1)
      if (close === -1) {
        out.push({ kind: "text", value: s.slice(start.index) })
        break
      }
      out.push({ kind: "inline", value: s.slice(start.index + 1, close) })
      i = close + 1
    } else {
      const close = s.indexOf("\\)", start.index + 2)
      if (close === -1) {
        out.push({ kind: "text", value: s.slice(start.index) })
        break
      }
      out.push({ kind: "inline", value: s.slice(start.index + 2, close) })
      i = close + 2
    }
  }
  return out
}

/** True if the string may contain LaTeX we know how to split (including single `$` and `\\(`). */
export function hasMixedLatexDelimiters(s: string): boolean {
  if (!s) return false
  if (s.includes("$$") || s.includes("\\[") || s.includes("\\(")) return true
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "$" && s[i + 1] !== "$") {
      return true
    }
  }
  return false
}

export function splitMixedLatex(content: string): MixedLatexPiece[] {
  if (!content) return []
  const pieces: MixedLatexPiece[] = []
  for (const blockSeg of splitBlockSegments(content)) {
    if (blockSeg.kind === "block") {
      pieces.push({ type: "block", value: blockSeg.value })
      continue
    }
    for (const inl of splitInlineSegments(blockSeg.value)) {
      if (inl.kind === "inline") {
        pieces.push({ type: "inline", value: inl.value })
      } else if (inl.value.length > 0) {
        pieces.push({ type: "text", value: inl.value })
      }
    }
  }
  return pieces
}

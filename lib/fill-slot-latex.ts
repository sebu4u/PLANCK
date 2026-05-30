export const FILL_SLOT_CHIP_DRAG_MIME = "application/x-planck-fill-chip"

export const FILL_SLOT_CHIP_SELECTED =
  "border-violet-500 shadow-[0_4px_0_#5b21b6] ring-2 ring-violet-300 ring-offset-1"

export function normalizeLatexSegment(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2 && !trimmed.slice(1, -1).includes("$")) {
    return trimmed.slice(1, -1).trim()
  }
  if (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

export function chipToLatex(chip: string): string {
  const value = normalizeLatexSegment(chip)
  if (!value) return "\\text{?}"
  if (/\\[a-zA-Z]+|[\^_{}=]/.test(value)) return value
  return `\\text{${value.replace(/([#%&_{}])/g, "\\$1")}}`
}

export function buildFillSlotPlaceholder(
  slotId: string,
  value: string | null,
  isActive: boolean,
  autoResult: "ok" | "bad" | null,
  slotCorrect: boolean,
): string {
  const inner = value ? chipToLatex(value) : "\\text{?}"
  let body = `\\boxed{${inner}}`

  if (autoResult === "ok") {
    body = `\\color{#059669}{${body}}`
  } else if (autoResult === "bad" && value) {
    body = slotCorrect ? `\\color{#059669}{${body}}` : `\\color{#dc2626}{${body}}`
  } else if (isActive) {
    body = `\\color{#7c3aed}{${body}}`
  }

  return `\\htmlId{fill-slot-${slotId}}{${body}}`
}

export function buildFillSlotLatex(
  template: string,
  assign: Record<string, string | null>,
  active: string | null,
  autoResult: "ok" | "bad" | null,
  slots: { id: string; answer: string }[],
): string {
  const base = normalizeLatexSegment(template)
  const answerById = new Map(slots.map((s) => [s.id, s.answer.trim()]))

  return base.replace(/\{\{(\w+)\}\}/g, (_, slotId: string) => {
    const value = assign[slotId] ?? null
    const slotCorrect = value ? value.trim() === (answerById.get(slotId) ?? "") : false
    return buildFillSlotPlaceholder(slotId, value, active === slotId, autoResult, slotCorrect)
  })
}

export function extractFillSlotPlaceholderIds(template: string): string[] {
  const ids: string[] = []
  const re = /\{\{(\w+)\}\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(template)) !== null) {
    const id = match[1]
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

export const FILL_SLOT_TEMPLATE_PRESETS = [
  { label: "F = m · a", template: "F = {{m}} \\cdot a" },
  { label: "E = m c²", template: "E = {{m}} c^2" },
  { label: "v = d / t", template: "v = \\frac{{{d}}}{{{t}}}" },
  { label: "a² + b² = c²", template: "a^2 + b^2 = {{c}}^2" },
] as const

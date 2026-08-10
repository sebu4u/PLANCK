export const INTERACTIVE_MARKER = '---INTERACTIVE---'

export const NUMERIC_ANSWER_TOLERANCE = 0.05

export type InsightInteractiveType = 'numeric' | 'mcq' | 'true_false' | 'formula'

type InteractiveBase = {
  prompt: string
  feedbackCorrect: string
  feedbackWrong: string
  /** Shown after the user verifies — 2 follow-up chips to continue (no auto-send). */
  continueSuggestions: [string, string]
}

export const DEFAULT_INTERACTIVE_CONTINUE_SUGGESTIONS = [
  'Care e următorul pas?',
  'Explică-mi pe scurt de ce',
] as const

export type InsightInteractiveNumeric = InteractiveBase & {
  type: 'numeric'
  correctValue: number
  unit?: string
}

export type InsightInteractiveMcq = InteractiveBase & {
  type: 'mcq'
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

export type InsightInteractiveTrueFalse = InteractiveBase & {
  type: 'true_false'
  correct: boolean
}

export type InsightInteractiveFormula = InteractiveBase & {
  type: 'formula'
  /** e.g. "F = {{m}} \\cdot a" — placeholders match slot ids */
  latexTemplate: string
  slots: { id: string; answer: string }[]
  /** Chip texts the user can drag/tap into slots (includes distractors). */
  chips: string[]
}

export type InsightInteractivePayload =
  | InsightInteractiveNumeric
  | InsightInteractiveMcq
  | InsightInteractiveTrueFalse
  | InsightInteractiveFormula

export type InsightInteractiveResult = {
  correct: boolean
  userAnswerLabel: string
}

function asNonEmptyString(value: unknown, maxLen = 500): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLen) return null
  return trimmed
}

function asFeedback(value: unknown, fallback: string): string {
  const text = asNonEmptyString(value, 120)
  return text ?? fallback
}

/** Normalize `{{ m }}` / `{{m}}` placeholders to canonical `{{m}}`. */
function normalizeLatexTemplatePlaceholders(template: string): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, '{{$1}}')
}

/**
 * Models often emit LaTeX with single backslashes inside JSON (`\cdot`), which is invalid.
 * Double any backslash that is not a valid JSON escape.
 */
function repairInvalidJsonEscapes(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (ch !== '\\') {
      out += ch
      continue
    }
    const next = raw[i + 1]
    if (next === undefined) {
      out += '\\\\'
      continue
    }
    if (next === '"' || next === '\\' || next === '/') {
      out += `\\${next}`
      i += 1
      continue
    }
    // `\b` `\f` `\n` `\r` `\t` are valid JSON escapes only when not starting a LaTeX command
    // (`\frac`, `\nu`, `\times`, `\beta`, `\rightarrow`, …).
    if (next === 'b' || next === 'f' || next === 'n' || next === 'r' || next === 't') {
      const after = raw[i + 2]
      if (after && /[a-zA-Z]/.test(after)) {
        out += `\\\\${next}`
        i += 1
        continue
      }
      out += `\\${next}`
      i += 1
      continue
    }
    if (next === 'u') {
      const hex = raw.slice(i + 2, i + 6)
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        out += `\\u${hex}`
        i += 5
        continue
      }
      out += '\\\\u'
      i += 1
      continue
    }
    out += `\\\\${next}`
    i += 1
  }
  return out
}

function stripMarkdownFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function tryParseInteractiveJson(raw: string): unknown | null {
  const cleaned = stripMarkdownFence(raw)
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const slice = cleaned.slice(start, end + 1)

  // Prefer repaired escapes first: models often emit LaTeX `\cdot` / `\frac` which
  // either fails JSON.parse or silently corrupts via `\f` / `\n` control escapes.
  try {
    return JSON.parse(repairInvalidJsonEscapes(slice))
  } catch {
    // fall through
  }

  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

function parseNumberLoose(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/[^0-9eE.+-]/g, '')
  if (!cleaned || cleaned === '.' || cleaned === '-' || cleaned === '+') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function normalizeFormula(input: string): string {
  return input
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot|\\times|·|×/g, '*')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/[{}\s]/g, '')
    .replace(/\^/g, '^')
    .toLowerCase()
}

export function formatFilledFormulaLabel(
  assign: Record<string, string | null>,
  slots: { id: string; answer: string }[]
): string {
  return slots
    .map((slot) => {
      const value = (assign[slot.id] ?? '').trim() || '?'
      return `${slot.id}=${value}`
    })
    .join(', ')
}

export function isFormulaSlotsCorrect(
  assign: Record<string, string | null>,
  slots: { id: string; answer: string }[]
): boolean {
  if (slots.length === 0) return false
  return slots.every((slot) => (assign[slot.id] || '').trim() === slot.answer.trim())
}

export function isNumericAnswerCorrect(
  userRaw: string,
  expected: number,
  tolerance = NUMERIC_ANSWER_TOLERANCE
): boolean {
  const userValue = parseNumberLoose(userRaw)
  if (userValue === null || !Number.isFinite(expected)) return false
  if (expected === 0) {
    return Math.abs(userValue) <= Math.max(1e-9, Math.abs(expected) * tolerance || 1e-9)
  }
  return Math.abs(userValue - expected) / Math.abs(expected) <= tolerance
}

export function formatInteractiveCorrectAnswer(payload: InsightInteractivePayload): string {
  switch (payload.type) {
    case 'numeric': {
      const unit = payload.unit?.trim()
      return unit ? `${payload.correctValue} ${unit}` : String(payload.correctValue)
    }
    case 'mcq': {
      const letter = String.fromCharCode(65 + payload.correctIndex)
      return `${letter}) ${payload.options[payload.correctIndex]}`
    }
    case 'true_false':
      return payload.correct ? 'Adevărat' : 'Fals'
    case 'formula':
      return payload.slots.map((slot) => `${slot.id}=${slot.answer}`).join(', ')
  }
}

export function evaluateInteractiveAnswer(
  payload: InsightInteractivePayload,
  answer: unknown
): InsightInteractiveResult | null {
  switch (payload.type) {
    case 'numeric': {
      if (typeof answer !== 'string') return null
      const trimmed = answer.trim()
      if (!trimmed) return null
      const correct = isNumericAnswerCorrect(trimmed, payload.correctValue)
      const unit = payload.unit?.trim()
      return {
        correct,
        userAnswerLabel: unit ? `${trimmed} ${unit}` : trimmed,
      }
    }
    case 'mcq': {
      if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > 3) {
        return null
      }
      const index = answer as 0 | 1 | 2 | 3
      const letter = String.fromCharCode(65 + index)
      return {
        correct: index === payload.correctIndex,
        userAnswerLabel: `${letter}) ${payload.options[index]}`,
      }
    }
    case 'true_false': {
      if (typeof answer !== 'boolean') return null
      return {
        correct: answer === payload.correct,
        userAnswerLabel: answer ? 'Adevărat' : 'Fals',
      }
    }
    case 'formula': {
      if (!answer || typeof answer !== 'object') return null
      const assign = answer as Record<string, string | null>
      const allFilled = payload.slots.every((slot) => Boolean((assign[slot.id] || '').trim()))
      if (!allFilled) return null
      return {
        correct: isFormulaSlotsCorrect(assign, payload.slots),
        userAnswerLabel: formatFilledFormulaLabel(assign, payload.slots),
      }
    }
  }
}

export function buildInteractiveFollowUpMessage(result: InsightInteractiveResult): string {
  return `Am răspuns: ${result.userAnswerLabel} — ${result.correct ? 'corect' : 'greșit'}`
}

function parseContinueSuggestions(value: unknown): [string, string] {
  if (Array.isArray(value)) {
    const cleaned = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2)
    if (cleaned.length >= 2) {
      return [cleaned[0]!, cleaned[1]!]
    }
    if (cleaned.length === 1) {
      return [cleaned[0]!, DEFAULT_INTERACTIVE_CONTINUE_SUGGESTIONS[1]]
    }
  }
  return [
    DEFAULT_INTERACTIVE_CONTINUE_SUGGESTIONS[0],
    DEFAULT_INTERACTIVE_CONTINUE_SUGGESTIONS[1],
  ]
}

function parseInteractivePayload(raw: unknown): InsightInteractivePayload | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const type = obj.type
  const prompt = asNonEmptyString(obj.prompt, 400)
  if (!prompt) return null

  const feedbackCorrect = asFeedback(obj.feedbackCorrect, 'Corect!')
  const feedbackWrong = asFeedback(obj.feedbackWrong, 'Nu chiar.')
  const continueSuggestions = parseContinueSuggestions(obj.continueSuggestions)

  if (type === 'numeric') {
    const correctValue =
      typeof obj.correctValue === 'number'
        ? obj.correctValue
        : typeof obj.correctValue === 'string'
          ? parseNumberLoose(obj.correctValue)
          : null
    if (correctValue === null || !Number.isFinite(correctValue)) return null
    const unit = asNonEmptyString(obj.unit, 40) ?? undefined
    return {
      type: 'numeric',
      prompt,
      correctValue,
      unit,
      feedbackCorrect,
      feedbackWrong,
      continueSuggestions,
    }
  }

  if (type === 'mcq') {
    if (!Array.isArray(obj.options) || obj.options.length !== 4) return null
    const options = obj.options.map((item) => asNonEmptyString(item, 200))
    if (options.some((item) => !item)) return null
    const correctIndex =
      typeof obj.correctIndex === 'number' && Number.isInteger(obj.correctIndex)
        ? obj.correctIndex
        : null
    if (correctIndex === null || correctIndex < 0 || correctIndex > 3) return null
    return {
      type: 'mcq',
      prompt,
      options: options as [string, string, string, string],
      correctIndex: correctIndex as 0 | 1 | 2 | 3,
      feedbackCorrect,
      feedbackWrong,
      continueSuggestions,
    }
  }

  if (type === 'true_false') {
    if (typeof obj.correct !== 'boolean') return null
    return {
      type: 'true_false',
      prompt,
      correct: obj.correct,
      feedbackCorrect,
      feedbackWrong,
      continueSuggestions,
    }
  }

  if (type === 'formula') {
    const rawTemplate =
      asNonEmptyString(obj.latexTemplate, 600) ||
      asNonEmptyString(obj.template, 600)
    if (!rawTemplate) return null
    const latexTemplate = normalizeLatexTemplatePlaceholders(rawTemplate)
    if (!/\{\{\w+\}\}/.test(latexTemplate)) return null
    if (!Array.isArray(obj.slots) || obj.slots.length < 1 || obj.slots.length > 4) return null
    if (!Array.isArray(obj.chips) || obj.chips.length < 1 || obj.chips.length > 8) return null

    const slots: { id: string; answer: string }[] = []
    for (const rawSlot of obj.slots) {
      if (!rawSlot || typeof rawSlot !== 'object') return null
      const slot = rawSlot as Record<string, unknown>
      const id = asNonEmptyString(slot.id, 40)?.replace(/\s+/g, '')
      const answer = asNonEmptyString(slot.answer, 120)
      if (!id || !answer) return null
      if (!latexTemplate.includes(`{{${id}}}`)) return null
      slots.push({ id, answer })
    }

    const chips = obj.chips
      .map((item) => asNonEmptyString(item, 120))
      .filter((item): item is string => Boolean(item))
    if (chips.length < slots.length) return null

    // Every slot answer must appear among chips so the puzzle is solvable.
    for (const slot of slots) {
      if (!chips.some((chip) => chip.trim() === slot.answer.trim())) return null
    }

    return {
      type: 'formula',
      prompt,
      latexTemplate,
      slots,
      chips,
      feedbackCorrect,
      feedbackWrong,
      continueSuggestions,
    }
  }

  return null
}

/**
 * Strips ---INTERACTIVE--- JSON from assistant output and returns a validated payload when complete.
 * Incomplete JSON while streaming returns interactive: null with truncated display content.
 */
export function parseAssistantInteractive(rawContent: string): {
  displayContent: string
  interactive: InsightInteractivePayload | null
  /** True when the marker was present (even if JSON failed validation). */
  markerPresent: boolean
} {
  if (!rawContent.includes(INTERACTIVE_MARKER)) {
    return { displayContent: rawContent, interactive: null, markerPresent: false }
  }

  const parts = rawContent.split(INTERACTIVE_MARKER)
  const displayContent = parts[0]?.trim() ?? ''
  const rawInteractive = (parts[1] ?? '').trim()
  const parsed = tryParseInteractiveJson(rawInteractive)
  const interactive = parseInteractivePayload(parsed)
  return { displayContent, interactive, markerPresent: true }
}

/** Strip both INTERACTIVE and leave display text safe while streaming (hide partial marker). */
export function stripInteractiveMarkerForDisplay(rawContent: string): string {
  const idx = rawContent.indexOf(INTERACTIVE_MARKER)
  if (idx === -1) return rawContent
  return rawContent.slice(0, idx).trim()
}

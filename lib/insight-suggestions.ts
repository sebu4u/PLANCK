export const INSIGHT_SUGGESTIONS_MARKER = '---SUGGESTIONS---'

export const DEFAULT_LESSON_TUTOR_SUGGESTIONS = [
  'Explică-mi mai simplu',
  'Dă-mi un exemplu',
]

export function parseAssistantSuggestions(rawContent: string): {
  displayContent: string
  suggestions: string[] | null
} {
  if (!rawContent.includes(INSIGHT_SUGGESTIONS_MARKER)) {
    return { displayContent: rawContent, suggestions: null }
  }

  const parts = rawContent.split(INSIGHT_SUGGESTIONS_MARKER)
  const displayContent = parts[0]?.trim() ?? ''
  const rawSuggestions = (parts[1] ?? '').trim()
  const jsonStartIndex = rawSuggestions.indexOf('[')
  const jsonEndIndex = rawSuggestions.lastIndexOf(']')

  if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex <= jsonStartIndex) {
    return { displayContent, suggestions: null }
  }

  try {
    const parsed = JSON.parse(rawSuggestions.substring(jsonStartIndex, jsonEndIndex + 1))
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
      return { displayContent, suggestions: cleaned.length > 0 ? cleaned : null }
    }
  } catch {
    // Incomplete or invalid JSON while streaming
  }

  return { displayContent, suggestions: null }
}

export function resolveLessonTutorSuggestions(
  rawContent: string,
  options?: { skipFallback?: boolean }
): { displayContent: string; suggestions?: string[] } {
  const { displayContent, suggestions } = parseAssistantSuggestions(rawContent)

  if (options?.skipFallback) {
    return { displayContent, suggestions: suggestions ?? undefined }
  }

  if (suggestions && suggestions.length > 0) {
    return { displayContent, suggestions: suggestions.slice(0, 2) }
  }

  return { displayContent, suggestions: DEFAULT_LESSON_TUTOR_SUGGESTIONS }
}

/** Strip the suggestions marker for live streaming display. */
export function stripSuggestionsMarker(rawContent: string): string {
  if (!rawContent.includes(INSIGHT_SUGGESTIONS_MARKER)) return rawContent
  return rawContent.split(INSIGHT_SUGGESTIONS_MARKER)[0]?.trim() ?? rawContent
}

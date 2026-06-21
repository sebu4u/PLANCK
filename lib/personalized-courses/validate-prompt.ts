export const MIN_PROMPT_LENGTH = 3
export const MAX_PROMPT_LENGTH = 500

export function normalizePrompt(value: unknown): string | null {
  if (typeof value !== "string") return null
  const prompt = value.replace(/\s+/g, " ").trim()
  return prompt || null
}

export function validatePrompt(prompt: string): string | null {
  if (prompt.length < MIN_PROMPT_LENGTH) return "Scrie ce vrei să înveți în cel puțin câteva cuvinte."
  if (prompt.length > MAX_PROMPT_LENGTH) return `Promptul poate avea maximum ${MAX_PROMPT_LENGTH} de caractere.`
  if (/(.)\1{18,}/.test(prompt)) return "Promptul pare spam. Reformulează obiectivul de învățare."
  if (/https?:\/\//i.test(prompt)) return "Scrie obiectivul de învățare în text, fără linkuri."
  if (/<[a-z][\s\S]*?>/i.test(prompt)) return "Scrie obiectivul în text simplu, fără HTML."

  const abusivePattern = /\b(kill|suicide|bomb|terror|porn|xxx|curva|pula|muie|prostule|idiotule)\b/i
  if (abusivePattern.test(prompt)) {
    return "Promptul trebuie să fie un obiectiv de învățare formulat respectuos."
  }

  return null
}

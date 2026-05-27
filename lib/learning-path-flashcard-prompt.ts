import { z } from "zod"

export const FLASHCARD_COUNT = 3
export const FLASHCARD_DAILY_GENERATION_LIMIT = 15
export const FLASHCARD_COOLDOWN_DAYS = 7

export const generatedFlashcardsSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(300),
        back: z.string().min(1).max(600),
      })
    )
    .length(FLASHCARD_COUNT),
})

export type GeneratedFlashcards = z.infer<typeof generatedFlashcardsSchema>

export const FLASHCARD_SYSTEM_PROMPT = `Ești un profesor de fizică pentru liceu (România). Generezi flashcard-uri de revizuire.

Reguli:
- Răspunde DOAR cu JSON valid, fără markdown sau text suplimentar.
- Generează exact 3 flashcard-uri în română.
- Fiecare card are "front" (întrebare/concept scurt) și "back" (explicație clară).
- Folosește LaTeX în $...$ pentru formule când e necesar.
- Bazează-te STRICT pe contextul exercițiului furnizat; nu inventa informații din afara lui.
- Variază tipurile: definiție, aplicare, capcană conceptuală.
- Nivel: liceu (clasele IX–XII).

Format JSON:
{"cards":[{"front":"...","back":"..."},{"front":"...","back":"..."},{"front":"...","back":"..."}]}`

export function buildFlashcardUserPrompt(context: string, itemType: string, itemTitle?: string | null) {
  const titleLine = itemTitle?.trim() ? `Titlu item: ${itemTitle.trim()}\n\n` : ""
  return `${titleLine}Tip item learning path: ${itemType}

Context exercițiu:
${context.trim()}

Generează 3 flashcard-uri pentru a fixa conceptul la care elevul a avut dificultăți.`
}

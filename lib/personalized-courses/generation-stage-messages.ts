export const GENERATION_STAGE_LABELS: Record<string, string> = {
  searching: "Caut conținut Planck relevant",
  planning: "AI planifică lecțiile și exercițiile",
  saving: "Salvez lecțiile în baza de date",
  saving_lessons: "Salvez lecțiile în baza de date",
  finalizing: "Verific și activez cursul",
  ready: "Curs gata!",
}

export const GENERATION_STAGE_FALLBACK_MESSAGES: Record<string, string[]> = {
  searching: [
    "Analizez obiectivul tău de învățare…",
    "Caut probleme, grile și lecții relevante…",
    "Selectez cel mai potrivit conținut Planck…",
  ],
  planning: [
    "Planific structura cursului pe lecții…",
    "Aleg exercițiile interactive pentru fiecare lecție…",
    "Ordonez topicurile în progresie logică…",
    "Verific varietatea itemilor (explicații, grile, probleme)…",
  ],
  saving: [
    "Salvez lecțiile și itemii în baza de date…",
    "Generez conținutul fiecărui item…",
    "Aplic verificările de calitate…",
  ],
  saving_lessons: [
    "Salvez lecțiile și itemii în baza de date…",
    "Generez conținutul fiecărui item…",
    "Aplic verificările de calitate…",
  ],
  finalizing: [
    "Verific că toate itemii sunt validați…",
    "Activez cursul pe /invata…",
    "Pregătesc redirecționarea către prima lecție…",
  ],
}

export function buildGenerationMessageCycle(stage: string | null, serverMessage: string | null): string[] {
  const head = serverMessage || GENERATION_STAGE_LABELS[stage ?? ""] || "Pornire…"
  const fallbacks = GENERATION_STAGE_FALLBACK_MESSAGES[stage ?? ""] ?? []
  const seen = new Set<string>([head])
  const cycle = [head]
  for (const message of fallbacks) {
    if (!seen.has(message)) {
      seen.add(message)
      cycle.push(message)
    }
  }
  return cycle
}

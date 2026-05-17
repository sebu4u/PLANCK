import type { Problem } from "@/data/problems"
import type { QuizQuestion, AnswerKey } from "@/lib/types/quiz-questions"

/** First user message sent when learner taps „De ce?” (full text goes to the model). */
export const LEARNING_PATH_EXPLAIN_INITIAL_PROMPT =
  "Explică pas cu pas de ce răspunsul corect este cel indicat oficial și cum reiese din enunț. Dacă am ales altceva decât răspunsul corect, explică și de ce varianta mea nu este corectă."

const ANSWER_KEYS: AnswerKey[] = ["A", "B", "C", "D", "E", "F"]

function formatQuizAnswersBlock(q: QuizQuestion): string {
  const lines: string[] = []
  for (const key of ANSWER_KEYS) {
    const text = q.answers[key]
    if (text != null && String(text).trim() !== "") {
      lines.push(`${key}) ${String(text).trim()}`)
    }
  }
  return lines.length ? lines.join("\n") : "(fără variante)"
}

export function formatGrilaLearningPathContext(
  question: QuizQuestion,
  selectedAnswer: AnswerKey | null,
  wasCorrect: boolean | null
): string {
  const parts = [
    "Tip exercițiu: grilă (învățare — learning path).",
    "",
    "Enunț:",
    question.statement.trim(),
    "",
    "Variante:",
    formatQuizAnswersBlock(question),
    "",
    `Răspuns corect oficial: ${question.correct_answer}.`,
    `Răspunsul selectat de utilizator: ${selectedAnswer ?? "(niciunul)"}.`,
    `Rezultat după verificare: ${wasCorrect === true ? "corect" : wasCorrect === false ? "incorect" : "necunoscut"}.`,
  ]
  return parts.join("\n")
}

export function formatPollLearningPathContext(params: {
  question: string
  options: { id: string; label: string }[]
  selectedId: string | null
  correctAnswerId: string
  displayTextAfterVerify: string
  wasCorrect: boolean | null
}): string {
  const optLines = params.options.map((o) => `- ${o.id}: ${o.label}`).join("\n")
  const parts = [
    "Tip exercițiu: sondaj (învățare — learning path).",
    "",
    "Întrebare / text afișat:",
    params.question.trim(),
    "",
    "Opțiuni:",
    optLines || "(fără)",
    "",
    `Variantă marcată ca răspuns corect în conținut: ${params.correctAnswerId}.`,
    `Opțiunea aleasă de utilizator: ${params.selectedId ?? "(niciuna)"}.`,
    "",
    "Text afișat după verificare (feedback):",
    params.displayTextAfterVerify.trim(),
    "",
    `Rezultat: ${params.wasCorrect === true ? "alegere corectă" : params.wasCorrect === false ? "alegere diferită de varianta indicată" : "necunoscut"}.`,
  ]
  return parts.join("\n")
}

export function formatProblemLearningPathContext(params: {
  problem: Problem
  answerType: string | null
  /** value mode */
  valueInput?: string
  valueSubpointLabel?: string
  valueCorrectValue?: number
  /** grila mode on problem */
  grilaOptions?: string[]
  grilaSelectedIndex?: number
  grilaCorrectIndex?: number
  wasCorrect: boolean | null
}): string {
  const p = params.problem
  const parts: string[] = [
    "Tip exercițiu: problemă (învățare — learning path).",
    "",
    "Enunț:",
    String(p.statement ?? "").trim(),
  ]

  if (params.answerType === "value" && params.valueSubpointLabel != null) {
    parts.push(
      "",
      `Subpunct curent: ${params.valueSubpointLabel}.`,
      `Valoare introdusă de utilizator: ${params.valueInput ?? ""}.`,
      `Valoare așteptată (referință): ${params.valueCorrectValue}.`,
      `Rezultat verificare: ${params.wasCorrect === true ? "corect" : params.wasCorrect === false ? "incorect" : "necunoscut"}.`
    )
  } else if (params.answerType === "grila" && params.grilaOptions?.length) {
    const opts = params.grilaOptions.map((t, i) => `${i}) ${t}`).join("\n")
    parts.push(
      "",
      "Variante (grilă problemă):",
      opts,
      "",
      `Indice răspuns corect: ${params.grilaCorrectIndex}.`,
      `Indice ales de utilizator: ${params.grilaSelectedIndex ?? "(niciunul)"}.`,
      `Rezultat: ${params.wasCorrect === true ? "corect" : params.wasCorrect === false ? "incorect" : "necunoscut"}.`
    )
  } else {
    parts.push("", `Tip răspuns problemă: ${params.answerType ?? "necunoscut"}.`)
  }

  return parts.join("\n")
}

/** First user message when learner taps „De ce?” on card-sort items. */
export const LEARNING_PATH_CARD_SORT_EXPLAIN_INITIAL_PROMPT =
  "Explică de ce ordinea corectă a pașilor este cea indicată și cum se leagă logic pașii între ei. Dacă ordinea mea actuală diferă de cea corectă, arată ce nu convine și ce ar trebui schimbat (fără a-mi da direct lista finală mut cu mut, ci ghidând gândirea)."

export function formatCardSortLearningPathContext(params: {
  instructions?: string
  cards: { id: string; text: string }[]
  currentOrderIds: string[]
  correctOrderIds: string[]
  /** null = ordinea curentă nu a fost verificată (sau s-a reordonat după o verificare greșită). */
  wasLastVerifyCorrect: boolean | null
}): string {
  const map = new Map(params.cards.map((c) => [c.id, c.text.trim()]))
  const lines = (ids: string[]) => ids.map((id, i) => `${i + 1}. ${map.get(id) ?? id}`).join("\n")

  const verifyLine =
    params.wasLastVerifyCorrect === null
      ? "Ordinea curentă nu a fost verificată după ultimele mutări (sau nu s-a apăsat încă „Verifică ordinea”)."
      : params.wasLastVerifyCorrect
        ? "Ultima verificare: ordinea este corectă."
        : "Ultima verificare: ordinea este incorectă."

  const parts: string[] = [
    "Tip exercițiu: ordonare carduri (învățare — learning path).",
    "",
  ]
  if (params.instructions?.trim()) {
    parts.push("Instrucțiuni afișate utilizatorului:", params.instructions.trim(), "")
  }
  parts.push(
    "Ordinea curentă a utilizatorului (de sus în jos):",
    lines(params.currentOrderIds),
    "",
    "Ordinea de referință corectă (de sus în jos):",
    lines(params.correctOrderIds),
    "",
    verifyLine,
  )
  return parts.join("\n")
}

/** First user message when learner taps „De ce?” on fill-slot items. */
export const LEARNING_PATH_FILL_SLOT_EXPLAIN_INITIAL_PROMPT =
  "Explică cum se completează corect ecuația și ce reprezintă fiecare mărime. Dacă am completat greșit, arată de ce nu convine varianta aleasă și ce ar trebui să fie acolo (fără a-mi da direct răspunsul final pe tavă, ci clarificând conceptul)."

export function formatFillSlotLearningPathContext(params: {
  instructions?: string
  latexTemplate: string
  slots: { id: string; answer: string }[]
  assign: Record<string, string | null>
  chips: string[]
  /** null = nu toate sloturile sunt completate; ok/bad = toate completate */
  autoResult: "ok" | "bad" | null
}): string {
  const slotLines = params.slots.map((s) => {
    const v = params.assign[s.id]
    return `- slot ${s.id}: valoare curentă = ${v ?? "(gol)"}; răspuns de referință = ${s.answer}`
  })
  const resultLine =
    params.autoResult === null
      ? "Nu toate sloturile sunt completate încă."
      : params.autoResult === "ok"
        ? "Toate sloturile sunt completate și valorile coincid cu referința."
        : "Toate sloturile sunt completate, dar cel puțin o valoare nu coincide cu referința."

  const parts: string[] = [
    "Tip exercițiu: completare sloturi în ecuație (LaTeX) — learning path.",
    "",
  ]
  if (params.instructions?.trim()) {
    parts.push("Instrucțiuni (metadate, pot fi ascunse în UI):", params.instructions.trim(), "")
  }
  parts.push(
    "Șablon ecuație (cu placeholder-e {{slotId}}):",
    params.latexTemplate.trim(),
    "",
    "Chip-uri disponibile:",
    params.chips.join(", ") || "(niciunul)",
    "",
    "Sloturi și valori:",
    slotLines.join("\n"),
    "",
    resultLine,
  )
  return parts.join("\n")
}

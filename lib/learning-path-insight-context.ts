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

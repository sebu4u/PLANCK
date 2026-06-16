import type { QuizQuestion, AnswerKey, UserAnswer, GradeLevel } from "@/lib/types/quiz-questions"
import { getCorrectAnswerKeys } from "@/lib/quiz-question-utils"

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

/** Chip-uri afișate când utilizatorul deschide chat-ul (înainte de primul mesaj). */
export const GRILE_INSIGHT_STARTER_CHIPS = [
  "Ce concept fizic stă la baza acestei grile?",
  "Cum pot elimina rațional variantele greșite?",
  "Explică enunțul cu alte cuvinte, pas cu pas.",
]

export function formatGrileCatalogInsightContext(params: {
  question: QuizQuestion
  userAnswer: UserAnswer | null
  classLevel: GradeLevel
  questionIndex: number
  totalQuestions: number
  catalogPath?: string
}): string {
  const { question, userAnswer, classLevel, questionIndex, totalQuestions, catalogPath = "/grile" } = params
  const selected = userAnswer?.selectedAnswers ?? []
  const verified = userAnswer?.isVerified ?? false
  const wasCorrect = verified ? (userAnswer?.isCorrect ?? null) : null
  const correctKeys = getCorrectAnswerKeys(question)
  const parts = [
    `Context: utilizatorul lucrează la pagina de teste grilă (${catalogPath}), mod catalog.`,
    `Clasă selectată în UI: clasa a ${classLevel}-a.`,
    `Poziție în sesiunea curentă: întrebarea ${questionIndex + 1} din ${totalQuestions}.`,
    `ID întrebare: ${question.id}.`,
    question.title?.trim() ? `Titlu: ${question.title.trim()}.` : "",
    "",
    "Enunț:",
    question.statement.trim(),
    "",
    "Variante:",
    formatQuizAnswersBlock(question),
    "",
    `Răspuns(uri) corect(e) oficial(e): ${correctKeys.join(", ")}.`,
    `Variante selectate de utilizator: ${selected.length ? selected.join(", ") : "(încă neselectate)"}.`,
    verified
      ? `Verificare efectuată. Rezultat: ${wasCorrect === true ? "corect" : wasCorrect === false ? "incorect" : "necunoscut"}.`
      : "Verificarea nu a fost încă apăsată (utilizatorul poate discuta înainte sau după verificare).",
  ]
  return parts.filter((line) => line !== "").join("\n")
}

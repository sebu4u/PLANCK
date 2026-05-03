import type { QuizQuestion, AnswerKey, UserAnswer, GradeLevel } from "@/lib/types/quiz-questions"

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
}): string {
  const { question, userAnswer, classLevel, questionIndex, totalQuestions } = params
  const selected = userAnswer?.selectedAnswer ?? null
  const verified = userAnswer?.isVerified ?? false
  const wasCorrect = verified ? (userAnswer?.isCorrect ?? null) : null
  const parts = [
    "Context: utilizatorul lucrează la pagina de teste grilă (/grile), mod catalog.",
    `Clasă selectată în UI: clasa a ${classLevel}-a.`,
    `Poziție în sesiunea curentă: întrebarea ${questionIndex + 1} din ${totalQuestions}.`,
    `ID întrebare: ${question.id}.`,
    "",
    "Enunț:",
    question.statement.trim(),
    "",
    "Variante:",
    formatQuizAnswersBlock(question),
    "",
    `Răspuns corect oficial: ${question.correct_answer}.`,
    `Variantă selectată de utilizator: ${selected ?? "(încă neselectată)"}.`,
    verified
      ? `Verificare efectuată. Rezultat: ${wasCorrect === true ? "corect" : wasCorrect === false ? "incorect" : "necunoscut"}.`
      : "Verificarea nu a fost încă apăsată (utilizatorul poate discuta înainte sau după verificare).",
  ]
  return parts.join("\n")
}

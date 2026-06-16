import type { AnswerKey, QuizAnswers, QuizQuestion } from "@/lib/types/quiz-questions"

export const ANSWER_KEYS: AnswerKey[] = ["A", "B", "C", "D", "E", "F"]

export function getActiveAnswerEntries(answers: QuizAnswers): [AnswerKey, string][] {
  return ANSWER_KEYS.map((key) => [key, answers[key]] as [AnswerKey, string]).filter(
    ([, text]) => text != null && String(text).trim() !== "",
  )
}

export function getCorrectAnswerKeys(question: QuizQuestion): AnswerKey[] {
  if (question.correct_answers?.length) {
    return question.correct_answers.filter((key): key is AnswerKey =>
      ANSWER_KEYS.includes(key as AnswerKey),
    )
  }
  if (question.correct_answer) {
    return [question.correct_answer]
  }
  return []
}

export function isBiologyQuizQuestion(question: Pick<QuizQuestion, "materie">): boolean {
  return question.materie === "biologie"
}

export function isMultiSelectQuizQuestion(question: Pick<QuizQuestion, "materie" | "correct_answers">): boolean {
  if (isBiologyQuizQuestion(question)) return true
  return (question.correct_answers?.length ?? 0) > 1
}

export function verifyQuizSelection(selected: AnswerKey[], question: QuizQuestion): boolean {
  const correct = getCorrectAnswerKeys(question)
  if (selected.length !== correct.length) return false
  const correctSet = new Set(correct)
  return selected.every((key) => correctSet.has(key))
}

export function normalizeQuizAnswers(raw: Record<string, unknown>): QuizAnswers {
  const answers = {} as QuizAnswers
  for (const key of ANSWER_KEYS) {
    const value = raw[key]
    answers[key] = typeof value === "string" ? value : ""
  }
  return answers
}

export type BiologyQuizCreateInput = {
  question_id: string
  title: string
  statement: string
  description?: string | null
  tags?: string[]
  difficulty: number
  class: number
  answers: Record<string, string>
  correct_answers: string[]
  image_url?: string | null
  video_url?: string | null
}

export function validateBiologyQuizInput(
  input: BiologyQuizCreateInput,
): { ok: true } | { ok: false; message: string } {
  const questionId = input.question_id?.trim() ?? ""
  if (!/^B\d{3,}$/i.test(questionId)) {
    return { ok: false, message: "ID-ul trebuie să fie de forma B001 (B urmat de cifre)." }
  }

  if (!input.title?.trim()) {
    return { ok: false, message: "Titlul este obligatoriu." }
  }

  if (!input.statement?.trim()) {
    return { ok: false, message: "Enunțul este obligatoriu." }
  }

  if (![1, 2, 3].includes(input.difficulty)) {
    return { ok: false, message: "Dificultatea trebuie să fie 1, 2 sau 3." }
  }

  if (![9, 10, 11, 12].includes(input.class)) {
    return { ok: false, message: "Clasa trebuie să fie 9, 10, 11 sau 12." }
  }

  const filledEntries = ANSWER_KEYS.filter((key) => {
    const text = input.answers[key]
    return typeof text === "string" && text.trim().length > 0
  })

  if (filledEntries.length < 2 || filledEntries.length > 6) {
    return { ok: false, message: "Grilei trebuie să aibă între 2 și 6 variante de răspuns." }
  }

  const correctAnswers = (input.correct_answers ?? []).filter((key): key is AnswerKey =>
    ANSWER_KEYS.includes(key as AnswerKey),
  )

  if (correctAnswers.length < 1) {
    return { ok: false, message: "Selectează cel puțin un răspuns corect." }
  }

  const filledSet = new Set(filledEntries)
  if (!correctAnswers.every((key) => filledSet.has(key))) {
    return { ok: false, message: "Răspunsurile corecte trebuie să fie printre variantele completate." }
  }

  return { ok: true }
}

export function buildBiologyQuizRow(input: BiologyQuizCreateInput) {
  const validation = validateBiologyQuizInput(input)
  if (!validation.ok) {
    throw new Error(validation.message)
  }

  const answers = normalizeQuizAnswers(input.answers)
  const correctAnswers = input.correct_answers.filter((key): key is AnswerKey =>
    ANSWER_KEYS.includes(key as AnswerKey),
  )

  return {
    question_id: input.question_id.trim().toUpperCase(),
    materie: "biologie" as const,
    title: input.title.trim(),
    statement: input.statement.trim(),
    description: input.description?.trim() || null,
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    difficulty: input.difficulty,
    class: input.class,
    answers,
    correct_answers: correctAnswers,
    correct_answer: correctAnswers[0],
    image_url: input.image_url?.trim() || null,
    video_url: input.video_url?.trim() || null,
  }
}

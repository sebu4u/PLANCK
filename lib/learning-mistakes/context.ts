import type { Problem } from "@/data/problems"
import type { AnswerKey, QuizQuestion } from "@/lib/types/quiz-questions"
import { getCorrectAnswerKeys } from "@/lib/quiz-question-utils"

export function normalizeLearningMistakeTags(tags: unknown): string[] {
  const raw = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags.split(",")
      : []

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of raw) {
    const tag = String(value ?? "").trim()
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(tag.slice(0, 80))
  }

  return normalized.slice(0, 12)
}

export function getProblemMistakeTags(problem: Pick<Problem, "tags" | "category" | "difficulty">): string[] {
  const tags = normalizeLearningMistakeTags(problem.tags)
  if (problem.category) tags.push(String(problem.category).trim())
  if (problem.difficulty) tags.push(String(problem.difficulty).trim())
  return normalizeLearningMistakeTags(tags)
}

export function buildProblemMistakeContext(problem: Problem): Record<string, unknown> {
  return {
    title: problem.title ?? null,
    statement: problem.statement ?? null,
    description: problem.description ?? null,
    category: problem.category ?? null,
    difficulty: problem.difficulty ?? null,
    answerType: problem.answer_type ?? null,
    class: problem.class ?? problem.classString ?? null,
  }
}

export function getQuizQuestionMistakeTags(question: QuizQuestion): string[] {
  const tags = normalizeLearningMistakeTags(question.tags)
  if (question.materie) tags.push(question.materie)
  if (question.title) tags.push(question.title)
  return normalizeLearningMistakeTags(tags)
}

export function buildQuizQuestionMistakeContext(question: QuizQuestion): Record<string, unknown> {
  return {
    id: question.id,
    questionId: question.question_id,
    title: question.title ?? null,
    statement: question.statement,
    description: question.description ?? null,
    difficulty: question.difficulty,
    class: question.class,
    materie: question.materie ?? null,
    answers: question.answers,
  }
}

export function getCorrectQuizAnswers(question: QuizQuestion): AnswerKey[] {
  return getCorrectAnswerKeys(question)
}

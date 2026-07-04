import type { PracticeSubjectId } from "@/lib/practice-subject"

export const SUBJECT_CHANGE_CELEBRATION_STORAGE_KEY = "planck_subject_change_celebration"

export type SubjectChangeCelebrationPayload = {
  from: string
  to: string
}

export function readSubjectChangeCelebrationFromStorage(): SubjectChangeCelebrationPayload | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(SUBJECT_CHANGE_CELEBRATION_STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(SUBJECT_CHANGE_CELEBRATION_STORAGE_KEY)
    const parsed = JSON.parse(raw) as SubjectChangeCelebrationPayload
    if (typeof parsed?.from !== "string" || typeof parsed?.to !== "string") return null
    return parsed
  } catch {
    sessionStorage.removeItem(SUBJECT_CHANGE_CELEBRATION_STORAGE_KEY)
    return null
  }
}

export function writeSubjectChangeCelebrationToStorage(payload: SubjectChangeCelebrationPayload) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SUBJECT_CHANGE_CELEBRATION_STORAGE_KEY, JSON.stringify(payload))
}

export const SUBJECT_CHANGE_CELEBRATION_COMPLETE_EVENT = "planck:subject-change-celebration-complete"

export type SubjectChangeCelebrationCompleteDetail = {
  from: PracticeSubjectId
  to: PracticeSubjectId
}

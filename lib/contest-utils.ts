export const CONTEST_GRADES = ["IX", "X", "XI", "XII"] as const
export const CONTEST_ANSWERS = ["A", "B", "C", "D"] as const

export type ContestGrade = (typeof CONTEST_GRADES)[number]
export type ContestAnswer = (typeof CONTEST_ANSWERS)[number]
export type ContestStatus = "none" | "not_started" | "active" | "ended"

export interface ContestSummary {
  id: string
  name: string
  start_time: string
  duration_minutes: number
  created_at?: string
}

export interface ContestProblem {
  id: string
  display_order: number
  statement: string
  image_url: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export interface ContestSubmission {
  problem_id: string
  answer: ContestAnswer
  submitted_at: string
}

export function getContestEndTime(contest: Pick<ContestSummary, "start_time" | "duration_minutes">) {
  const start = new Date(contest.start_time)
  return new Date(start.getTime() + contest.duration_minutes * 60 * 1000)
}

export function getContestStatus(
  contest: Pick<ContestSummary, "start_time" | "duration_minutes"> | null | undefined,
  now: Date = new Date()
): { status: ContestStatus; remaining_seconds: number } {
  if (!contest) {
    return { status: "none", remaining_seconds: 0 }
  }

  const start = new Date(contest.start_time)
  const end = getContestEndTime(contest)

  if (now < start) {
    return {
      status: "not_started",
      remaining_seconds: Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000))
    }
  }

  if (now >= end) {
    return { status: "ended", remaining_seconds: 0 }
  }

  return {
    status: "active",
    remaining_seconds: Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
  }
}

export function isContestAnswer(value: string): value is ContestAnswer {
  return CONTEST_ANSWERS.includes(value as ContestAnswer)
}

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":")
}

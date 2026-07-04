const ONLINE_BASE = 200
const ONLINE_MIN = 185
const ONLINE_MAX = 215

const PROBLEMS_BASE = 8000
const PROBLEMS_DAILY_GROWTH = 25
const PROBLEMS_INTRADAY_MAX = 25
const PROBLEMS_REFERENCE_DATE = new Date("2025-12-28T00:00:00")

export const PLACEHOLDER_ONLINE_USERS = ONLINE_BASE
export const PLACEHOLDER_PROBLEMS_SOLVED = PROBLEMS_BASE

function startOfDay(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export function getPlaceholderProblemsSolved(now = new Date()) {
  const today = startOfDay(now)
  const reference = startOfDay(PROBLEMS_REFERENCE_DATE)
  const daysSince = Math.max(
    0,
    Math.floor((today.getTime() - reference.getTime()) / 86_400_000)
  )
  const dayProgress = (now.getTime() - today.getTime()) / 86_400_000
  const intraday = Math.floor(dayProgress * PROBLEMS_INTRADAY_MAX)

  return PROBLEMS_BASE + daysSince * PROBLEMS_DAILY_GROWTH + intraday
}

export function getPlaceholderOnlineUsers(now = new Date()) {
  const minuteOfDay = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const slowWave = Math.sin(minuteOfDay * 0.04) * 8
  const fastWave = Math.sin(now.getTime() / 12_000) * 7

  return Math.round(
    Math.min(ONLINE_MAX, Math.max(ONLINE_MIN, ONLINE_BASE + slowWave + fastWave))
  )
}

export function getNextPlaceholderOnlineUsers(current: number) {
  const delta = Math.floor(Math.random() * 7) - 3
  return Math.min(ONLINE_MAX, Math.max(ONLINE_MIN, current + delta))
}

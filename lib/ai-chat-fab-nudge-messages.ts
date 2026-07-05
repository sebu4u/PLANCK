export const AI_CHAT_FAB_NUDGE_MESSAGES = [
  "Pst.. te-ai blocat?",
  "Ai nevoie de un hint?",
  "Pot să te ajut!",
  "Întreabă-mă ceva!",
  "Stai blocat de mult?",
  "Hai, spune-mi unde te-ai pierdut.",
  "Nu te lăsa, sunt aici.",
  "Vrei să-ți explic altfel?",
  "O idee nouă te-ar ajuta?",
  "Dă-mi un semn dacă te-ai împotmolit.",
] as const

export function pickRandomAiChatFabNudgeMessage(exclude?: string): string {
  const pool = [...AI_CHAT_FAB_NUDGE_MESSAGES]

  let message = pool[Math.floor(Math.random() * pool.length)]
  let attempts = 0
  while (message === exclude && attempts < 8) {
    message = pool[Math.floor(Math.random() * pool.length)]
    attempts += 1
  }
  return message
}

export const AI_CHAT_FAB_NUDGE_INTERVAL_MIN_MS = 10_000
export const AI_CHAT_FAB_NUDGE_INTERVAL_MAX_MS = 15_000
export const AI_CHAT_FAB_NUDGE_VISIBLE_MS = 5_000
export const AI_CHAT_FAB_NUDGE_ENTER_MS = 400
export const AI_CHAT_FAB_NUDGE_EXIT_MS = 300

export function randomAiChatFabNudgeIntervalMs(): number {
  const span = AI_CHAT_FAB_NUDGE_INTERVAL_MAX_MS - AI_CHAT_FAB_NUDGE_INTERVAL_MIN_MS
  return AI_CHAT_FAB_NUDGE_INTERVAL_MIN_MS + Math.random() * span
}

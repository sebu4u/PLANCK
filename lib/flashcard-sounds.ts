import {
  playButtonClickSound,
  playSuccessSound,
} from "@/lib/platform-sounds"

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = freq
  osc.type = type
  gain.gain.setValueAtTime(0, ctx.currentTime + start)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

/** Card flip — scurt sweep descendent, ca o întoarcere de hârtie. */
export function playFlashcardFlipSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "triangle"
    osc.frequency.setValueAtTime(920, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.18)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.24)
  } catch {
    // Ignore
  }
}

/** Self-assessment: userul știa răspunsul. */
export function playFlashcardKnewSound(): void {
  playSuccessSound()
}

/** Self-assessment: userul nu știa — ton blând, fără sunet de eroare. */
export function playFlashcardDidntKnowSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    playTone(ctx, 392, 0, 0.14, 0.07)
    playTone(ctx, 311.13, 0.07, 0.18, 0.06)
  } catch {
    // Ignore
  }
}

/** Trecere la următorul card din sesiune. */
export function playFlashcardAdvanceSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    playTone(ctx, 587.33, 0, 0.08, 0.06)
  } catch {
    // Ignore
  }
}

/** Sesiunea de flashcard-uri s-a încheiat cu succes. */
export function playFlashcardSessionCompleteSound(): void {
  playSuccessSound()
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    playTone(ctx, 987.77, 0.22, 0.28, 0.07)
  } catch {
    // Ignore
  }
}

/** CTA-uri pe ecranul de ofertă / butoane principale flashcard. */
export function playFlashcardActionSound(): void {
  playButtonClickSound()
}

/**
 * Sound effects for the onboarding wizards (student + guardian). These are intentionally
 * distinct from the platform's classic click sound (`lib/platform-sounds.ts`), synthesized
 * via the Web Audio API so no extra asset files are needed.
 */

type AudioCtor = typeof AudioContext

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor: AudioCtor | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  if (!Ctor) return null
  try {
    return new Ctor()
  } catch {
    return null
  }
}

/** Soft, rounded "pop" used when the user selects an onboarding option/pill. */
export function playOnboardingSelectSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.16, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc.start(now)
    osc.stop(now + 0.15)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    // Ignore
  }
}

const SLIDER_TICK_MIN_INTERVAL_MS = 55
let lastSliderTickAt = 0

/** Very short, quiet tick used while dragging the "nota" slider. Self-throttled. */
export function playOnboardingSliderTickSound(): void {
  const now = Date.now()
  if (now - lastSliderTickAt < SLIDER_TICK_MIN_INTERVAL_MS) return
  lastSliderTickAt = now

  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "triangle"
    osc.frequency.setValueAtTime(1100, t0)
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.07, t0 + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.045)
    osc.start(t0)
    osc.stop(t0 + 0.05)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    // Ignore
  }
}

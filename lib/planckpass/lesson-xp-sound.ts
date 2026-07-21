/**
 * Lesson XP gain SFX — Web Audio only (no asset files).
 * Count-up: soft ascending ticks. Collect: whoosh + chime as XP flies into the badge.
 */

type AudioCtor = typeof AudioContext

let sharedCtx: AudioContext | null = null

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor: AudioCtor | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  if (!Ctor) return null
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new Ctor()
    }
    return sharedCtx
  } catch {
    return null
  }
}

function resumeCtx(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {})
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  const t0 = ctx.currentTime + start
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Soft rising ticks while the floating +XP counts up. */
export function playLessonXpCountupSound(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  try {
    resumeCtx(ctx)
    playTone(ctx, 523.25, 0, 0.1, 0.04, "triangle")
    playTone(ctx, 659.25, 0.09, 0.1, 0.035, "triangle")
    playTone(ctx, 783.99, 0.18, 0.12, 0.032, "sine")
    playTone(ctx, 987.77, 0.28, 0.16, 0.028, "sine")
  } catch {
    // Ignore
  }
}

/** Whoosh + bright chime when the floating XP merges into the navbar badge. */
export function playLessonXpCollectSound(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  try {
    resumeCtx(ctx)
    const now = ctx.currentTime

    const whoosh = ctx.createOscillator()
    const whooshGain = ctx.createGain()
    whoosh.connect(whooshGain)
    whooshGain.connect(ctx.destination)
    whoosh.type = "triangle"
    whoosh.frequency.setValueAtTime(260, now)
    whoosh.frequency.exponentialRampToValueAtTime(1100, now + 0.2)
    whooshGain.gain.setValueAtTime(0, now)
    whooshGain.gain.linearRampToValueAtTime(0.028, now + 0.03)
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    whoosh.start(now)
    whoosh.stop(now + 0.26)

    playTone(ctx, 880, 0.04, 0.12, 0.05, "sine")
    playTone(ctx, 1318.5, 0.1, 0.18, 0.045, "sine")
    playTone(ctx, 1760, 0.16, 0.14, 0.028, "triangle")
  } catch {
    // Ignore
  }
}

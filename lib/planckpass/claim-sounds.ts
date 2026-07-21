/**
 * PlanckPass claim-reveal SFX — Web Audio only (no asset files).
 * Open: bright “drop reveal” fanfare. Collect: short whoosh + chime.
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

/** Call from a user gesture (claim tap) so later SFX are allowed by autoplay policy. */
export function unlockPlanckPassClaimAudio(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
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
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** When the Starr-drop reveal screen appears. */
export function playPlanckPassClaimOpenSound(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  try {
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime

    const whoosh = ctx.createOscillator()
    const whooshGain = ctx.createGain()
    whoosh.connect(whooshGain)
    whooshGain.connect(ctx.destination)
    whoosh.type = "triangle"
    whoosh.frequency.setValueAtTime(180, now)
    whoosh.frequency.exponentialRampToValueAtTime(920, now + 0.22)
    whooshGain.gain.setValueAtTime(0, now)
    whooshGain.gain.linearRampToValueAtTime(0.07, now + 0.04)
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    whoosh.start(now)
    whoosh.stop(now + 0.3)

    playTone(ctx, 523.25, 0.05, 0.14, 0.11, "triangle")
    playTone(ctx, 659.25, 0.12, 0.14, 0.1, "triangle")
    playTone(ctx, 783.99, 0.19, 0.16, 0.1, "sine")
    playTone(ctx, 1046.5, 0.28, 0.28, 0.09, "sine")
    playTone(ctx, 1568, 0.34, 0.08, 0.05, "sine")
    playTone(ctx, 2093, 0.42, 0.1, 0.04, "sine")
  } catch {
    // Ignore
  }
}

/** When the user taps to collect the reward. */
export function playPlanckPassClaimCollectSound(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  try {
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime

    const whoosh = ctx.createOscillator()
    const whooshGain = ctx.createGain()
    whoosh.connect(whooshGain)
    whooshGain.connect(ctx.destination)
    whoosh.type = "sawtooth"
    whoosh.frequency.setValueAtTime(420, now)
    whoosh.frequency.exponentialRampToValueAtTime(1400, now + 0.18)
    whooshGain.gain.setValueAtTime(0, now)
    whooshGain.gain.linearRampToValueAtTime(0.055, now + 0.02)
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    whoosh.start(now)
    whoosh.stop(now + 0.24)

    playTone(ctx, 880, 0.02, 0.12, 0.1, "sine")
    playTone(ctx, 1174.66, 0.08, 0.14, 0.09, "sine")
    playTone(ctx, 1567.98, 0.14, 0.22, 0.08, "triangle")
  } catch {
    // Ignore
  }
}

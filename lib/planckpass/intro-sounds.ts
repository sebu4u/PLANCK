/**
 * PLANCKPASS season intro SFX — Web Audio only (no asset files).
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

/** Call from a click so a later delayed SFX is allowed to play. */
export function unlockPlanckPassIntroAudio(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  resumeCtx(ctx)
}

/**
 * Drawn-string / taut-cord sound timed to the XP bar fill.
 * The correct-answer chime plays separately when the bar completes.
 */
export function playXpBarStringPullSound(fillSeconds = 1.15): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  try {
    resumeCtx(ctx)
    const now = ctx.currentTime
    const pull = Math.max(0.45, fillSeconds)

    const tension = ctx.createOscillator()
    const tensionGain = ctx.createGain()
    const tensionFilter = ctx.createBiquadFilter()
    tension.type = "sawtooth"
    tension.frequency.setValueAtTime(92, now)
    tension.frequency.exponentialRampToValueAtTime(248, now + pull)
    tensionFilter.type = "lowpass"
    tensionFilter.Q.value = 6
    tensionFilter.frequency.setValueAtTime(420, now)
    tensionFilter.frequency.exponentialRampToValueAtTime(1600, now + pull)
    tensionGain.gain.setValueAtTime(0.0001, now)
    tensionGain.gain.exponentialRampToValueAtTime(0.07, now + pull * 0.72)
    tensionGain.gain.exponentialRampToValueAtTime(0.001, now + pull + 0.04)
    tension.connect(tensionFilter)
    tensionFilter.connect(tensionGain)
    tensionGain.connect(ctx.destination)
    tension.start(now)
    tension.stop(now + pull + 0.06)

    const harmonic = ctx.createOscillator()
    const harmonicGain = ctx.createGain()
    harmonic.type = "triangle"
    harmonic.frequency.setValueAtTime(184, now)
    harmonic.frequency.exponentialRampToValueAtTime(496, now + pull)
    harmonicGain.gain.setValueAtTime(0.0001, now)
    harmonicGain.gain.exponentialRampToValueAtTime(0.045, now + pull * 0.8)
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + pull + 0.05)
    harmonic.connect(harmonicGain)
    harmonicGain.connect(ctx.destination)
    harmonic.start(now)
    harmonic.stop(now + pull + 0.07)
  } catch {
    // Ignore
  }
}

/** Short bubble pop when a reward lights up on the intro track. */
export function playRewardUnlockPopSound(index = 0): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  try {
    resumeCtx(ctx)
    const now = ctx.currentTime
    const startFreq = 480 + index * 70
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.65, now + 0.08)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.14, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
    osc.start(now)
    osc.stop(now + 0.15)
  } catch {
    // Ignore
  }
}

/**
 * Short UI “mouse click” for primary CTAs (e.g. `.dashboard-start-glow` buttons/links).
 * Reuses one AudioContext to avoid churn and to stay within autoplay rules after first gesture.
 */

let sharedCtx: AudioContext | null = null

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!sharedCtx) sharedCtx = new AC()
    if (sharedCtx.state === "suspended") void sharedCtx.resume()
    return sharedCtx
  } catch {
    return null
  }
}

export function playDashboardStartButtonClickSound(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  const t = ctx.currentTime
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = "sine"
    gain.gain.setValueAtTime(0.12, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.start(t)
    osc.stop(t + 0.08)
  } catch {
    // Ignore (tab suspended, etc.)
  }
}

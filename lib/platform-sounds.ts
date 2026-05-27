const SOUND_PATHS = {
  buttonClick: "/sounds/mixkit-typewriter-soft-click-1125.wav",
  error: "/sounds/mixkit-click-error-1110.wav",
  notification: "/sounds/mixkit-select-click-1109.wav",
} as const

/** After an error sound, skip notification sounds briefly to avoid overlap. */
const NOTIFICATION_SUPPRESS_MS_AFTER_ERROR = 1200

let suppressNotificationSoundUntil = 0

function isDashboardRoute(): boolean {
  if (typeof window === "undefined") return false
  const pathname = window.location.pathname
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
}

function playWav(src: string, volume = 0.5): void {
  if (typeof window === "undefined") return
  try {
    const audio = new Audio(src)
    audio.volume = volume
    void audio.play().catch(() => {
      // Autoplay policy / tab suspended
    })
  } catch {
    // Ignore
  }
}

/** CTA buttons, grile clicks, and general UI button feedback. */
export function playButtonClickSound(): void {
  playWav(SOUND_PATHS.buttonClick, 0.45)
}

/** Incorrect answer / error feedback. */
export function playErrorSound(): void {
  suppressNotificationSoundUntil = Date.now() + NOTIFICATION_SUPPRESS_MS_AFTER_ERROR
  playWav(SOUND_PATHS.error, 0.5)
}

/** Correct answer / success feedback (short ascending tones). */
export function playSuccessSound(): void {
  if (typeof window === "undefined") return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const playTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = "sine"
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    playTone(523.25, 0, 0.12, 0.12)
    playTone(659.25, 0.08, 0.12, 0.1)
    playTone(783.99, 0.16, 0.2, 0.08)
  } catch {
    // Ignore
  }
}

/** Toast, engagement card, and other platform notifications. */
export function playNotificationSound(): void {
  if (Date.now() < suppressNotificationSoundUntil) return
  if (isDashboardRoute()) return
  playWav(SOUND_PATHS.notification, 0.45)
}

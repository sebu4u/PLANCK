const SOUND_PATHS = {
  buttonClick: "/sounds/mixkit-typewriter-soft-click-1125.wav",
  error: "/sounds/mixkit-click-error-1110.wav",
  notification: "/sounds/mixkit-select-click-1109.wav",
} as const

/** After an error sound, skip notification sounds briefly to avoid overlap. */
const NOTIFICATION_SUPPRESS_MS_AFTER_ERROR = 1200

let suppressNotificationSoundUntil = 0

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

/** Toast, engagement card, and other platform notifications. */
export function playNotificationSound(): void {
  if (Date.now() < suppressNotificationSoundUntil) return
  playWav(SOUND_PATHS.notification, 0.45)
}

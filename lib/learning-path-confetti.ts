import confetti from "canvas-confetti"

/** Confetti când utilizatorul răspunde corect la problemă / grilă / sondaj în learning paths. */
export function fireLearningPathCorrectConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    zIndex: 4000,
  })
}

/** Confetti de fundal când un dev adaugă conținut (card motivațional). */
export function fireDevCelebrationConfetti() {
  const zIndex = 451
  const duration = 2800
  const end = Date.now() + duration

  confetti({
    particleCount: 110,
    spread: 95,
    origin: { y: 0.55 },
    zIndex,
  })

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.45 },
      zIndex,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.45 },
      zIndex,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

/** Confetti de fundal când userul termină o lecție fizică. */
export function fireFizicaLessonCompletionConfetti() {
  const zIndex = 501
  const duration = 2800
  const end = Date.now() + duration

  confetti({
    particleCount: 110,
    spread: 95,
    origin: { y: 0.55 },
    zIndex,
  })

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.45 },
      zIndex,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.45 },
      zIndex,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

/** Particule verzi când userul urcă în clasament. */
export function fireLeaderboardClimbParticles(origin?: { x?: number; y?: number }) {
  confetti({
    particleCount: 55,
    spread: 72,
    origin: { x: origin?.x ?? 0.5, y: origin?.y ?? 0.55 },
    colors: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#a7f3d0"],
    zIndex: 505,
    ticks: 120,
  })
}

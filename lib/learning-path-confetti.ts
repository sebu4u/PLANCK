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

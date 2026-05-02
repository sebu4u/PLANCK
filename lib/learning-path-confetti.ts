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

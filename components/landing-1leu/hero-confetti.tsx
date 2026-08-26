"use client"

const PIECES = [
  { left: "11%", delay: "0s", duration: "20s", color: "#7C5CFC", width: 8, height: 11, drift: "18px", spin: "220deg" },
  { left: "31%", delay: "5.5s", duration: "23s", color: "#7dd3fc", width: 9, height: 7, drift: "-22px", spin: "-190deg" },
  { left: "52%", delay: "2s", duration: "18s", color: "#A3E635", width: 7, height: 10, drift: "14px", spin: "160deg" },
  { left: "71%", delay: "9s", duration: "21s", color: "#c77bff", width: 10, height: 8, drift: "-16px", spin: "-240deg" },
  { left: "88%", delay: "13s", duration: "24s", color: "#ffb56b", width: 8, height: 8, drift: "20px", spin: "200deg" },
] as const

export function Landing1LeuHeroConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes leuConfettiFall {
          0% {
            transform: translate3d(0, -24px, 0) rotate(0deg);
            opacity: 0;
          }
          7% { opacity: 0.85; }
          88% { opacity: 0.75; }
          100% {
            transform: translate3d(var(--leu-drift), 110vh, 0) rotate(var(--leu-spin));
            opacity: 0;
          }
        }
        .leu-confetti-piece {
          animation-name: leuConfettiFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .leu-confetti-piece { animation: none; display: none; }
        }
      `}</style>
      {PIECES.map((piece) => (
        <span
          key={piece.left}
          className="leu-confetti-piece absolute top-0 rounded-[2px]"
          style={{
            left: piece.left,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            ["--leu-drift" as string]: piece.drift,
            ["--leu-spin" as string]: piece.spin,
          }}
        />
      ))}
    </div>
  )
}

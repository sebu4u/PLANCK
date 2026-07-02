"use client"

export function AnimatedWords({
  text,
  className,
  startDelay = 0,
  as: Tag = "p",
}: {
  text: string
  className?: string
  startDelay?: number
  as?: "p" | "h1" | "h2"
}) {
  const words = text.split(" ")

  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block opacity-0"
          style={{
            animation: "registerWordFade 420ms ease-out forwards",
            animationDelay: `${startDelay + index * 80}ms`,
          }}
        >
          {word}
          {index === words.length - 1 ? "" : "\u00A0"}
        </span>
      ))}
    </Tag>
  )
}

export const ONBOARDING_STEP_ENTER_ANIM = "registerStepEnter 500ms ease-out forwards"
export const ONBOARDING_STEP_POP_FROM_LEFT_ANIM =
  "registerStepPopFromLeft 420ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
export const ONBOARDING_STEP_IMAGE_ANIM = "registerStepImageEnter 450ms ease-out forwards"
export const ONBOARDING_STEP_BUTTON_ANIM = "registerStepButtonEnter 400ms ease-out forwards"

export function OnboardingKeyframes() {
  return (
    <style jsx global>{`
      @keyframes registerWordFade {
        0% {
          opacity: 0;
          transform: translateY(12px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes registerStepEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes registerStepImageEnter {
        0% {
          opacity: 0;
          transform: translateX(-12px) scale(0.9);
        }
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes registerStepButtonEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes registerStepPopFromLeft {
        0% {
          opacity: 0;
          transform: translateX(-18px) scale(0.96);
        }
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes guardianStreakPop {
        0% {
          opacity: 0;
          transform: scale(0.4);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes guardianStreakSlideBump {
        0% {
          transform: scale(1);
        }
        55% {
          transform: scale(1.08);
        }
        78% {
          transform: scale(0.98);
        }
        100% {
          transform: scale(1);
        }
      }
    `}</style>
  )
}

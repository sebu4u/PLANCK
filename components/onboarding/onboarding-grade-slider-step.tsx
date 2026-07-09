"use client"

import Image from "next/image"
import {
  AnimatedWords,
  ONBOARDING_STEP_BUTTON_ANIM,
  ONBOARDING_STEP_ENTER_ANIM,
  ONBOARDING_STEP_IMAGE_ANIM,
  ONBOARDING_STEP_POP_FROM_LEFT_ANIM,
} from "@/components/onboarding/animated-words"
import { Slider } from "@/components/ui/slider"
import { playOnboardingSliderTickSound } from "@/lib/onboarding-sounds"
import { formatGrade } from "@/lib/parent/grade-estimate"
import {
  clampSelfGrade,
  clampTargetGrade,
  getMinTargetGrade,
  SELF_GRADE_MAX,
  SELF_GRADE_MIN,
  TARGET_GRADE_MAX,
} from "@/lib/student-onboarding-plan"

type OnboardingGradeSliderStepProps = {
  mode: "self" | "target"
  value: number
  selfGrade?: number
  onChange: (value: number) => void
  headline: string
  subtitle?: string
  popFromLeft?: boolean
}

function StepHeading({
  children,
  subtitle,
  popFromLeft,
}: {
  children: string
  subtitle?: string
  popFromLeft?: boolean
}) {
  const headingClassName = "text-[25px] font-semibold leading-tight text-[#0f1115] sm:text-[32px]"

  return (
    <div className="mb-5 flex items-start gap-3 sm:mb-7 sm:gap-5">
      <div
        className="-mt-0.5 flex-shrink-0 opacity-0"
        style={{ animation: ONBOARDING_STEP_IMAGE_ANIM }}
      >
        <Image
          src="/streak-icon.png"
          alt=""
          width={64}
          height={64}
          className="h-12 w-12 rounded-lg object-contain sm:h-16 sm:w-16"
        />
      </div>
      <div className="min-w-0 flex-1">
        {popFromLeft ? (
          <h1
            key={children}
            className={`${headingClassName} opacity-0`}
            style={{ animation: ONBOARDING_STEP_POP_FROM_LEFT_ANIM, animationDelay: "0ms" }}
          >
            {children}
          </h1>
        ) : (
          <AnimatedWords as="h1" text={children} className={headingClassName} startDelay={80} />
        )}
        {subtitle ? (
          <p
            className="mt-2 text-[13px] text-[#666a73] opacity-0 sm:text-sm"
            style={{ animation: ONBOARDING_STEP_ENTER_ANIM, animationDelay: "180ms" }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function OnboardingGradeSliderStep({
  mode,
  value,
  selfGrade = SELF_GRADE_MIN,
  onChange,
  headline,
  subtitle,
  popFromLeft,
}: OnboardingGradeSliderStepProps) {
  const isSelf = mode === "self"
  const min = isSelf ? SELF_GRADE_MIN : getMinTargetGrade(selfGrade)
  const max = isSelf ? SELF_GRADE_MAX : TARGET_GRADE_MAX
  const sliderMin = Math.round(min * 10)
  const sliderMax = Math.round(max * 10)
  const sliderValue = Math.round(value * 10)

  const handleSliderChange = (values: number[]) => {
    const raw = values[0] ?? sliderMin
    const grade = raw / 10
    if (raw !== sliderValue) playOnboardingSliderTickSound()
    onChange(isSelf ? clampSelfGrade(grade) : clampTargetGrade(selfGrade, grade))
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <StepHeading subtitle={subtitle} popFromLeft={popFromLeft}>
        {headline}
      </StepHeading>

      <div
        className="rounded-3xl border border-[#ececef] bg-[#f8f8fb] px-5 py-6 opacity-0 sm:px-7 sm:py-8"
        style={{ animation: ONBOARDING_STEP_BUTTON_ANIM, animationDelay: "240ms" }}
      >
        <p className="text-center text-[56px] font-bold leading-none tracking-tight text-[#8043f0] sm:text-[72px]">
          {formatGrade(value)}
        </p>
        <p className="mt-1 text-center text-xs font-medium uppercase tracking-[0.16em] text-[#666a73]">
          {isSelf ? "Nota ta acum" : "Nota la care vrei să ajungi"}
        </p>

        <div className="mt-8 px-1">
          <Slider
            min={sliderMin}
            max={sliderMax}
            step={1}
            value={[Math.min(sliderMax, Math.max(sliderMin, sliderValue))]}
            onValueChange={handleSliderChange}
            className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-[#8043f0] [&_[role=slider]]:bg-white [&_.bg-primary]:bg-[#8043f0]"
            aria-label={isSelf ? "Nota curentă" : "Nota țintă"}
          />
          <div className="mt-3 flex justify-between text-xs font-medium text-[#666a73]">
            <span>{formatGrade(min)}</span>
            <span>{formatGrade(max)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
